import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { GenerationFailedError, QuotaExceededError } from "../../commons/errors/app-error";
import type { ClientInfo } from "../../commons/http/request-context";
import { logger } from "../../commons/utils/logger";
import { env } from "../../infrastructure/config/env";
import { AI_INPUT_MAX_DIMENSION, GenerationChainError, runStrategyChain } from "../../infrastructure/ai";
import { storage } from "../../infrastructure/storage";
import type { AuthUser } from "../../types/auth";
import { AuditService } from "../audit/audit.service";
import { AUDIT_ACTIONS } from "../audit/constants/audit-actions.constants";
import type { ImageRow } from "../images/images.entity";
import { ImagesService } from "../images/images.service";
import type { TemplateDefinition } from "../templates/constants/templates.constants";
import { TemplatesService } from "../templates/templates.service";
import type { GenerationRow } from "./generations.entity";
import { buildCacheKey } from "./helpers/cache-key.helper";
import { evaluateQuota, windowStart, type QuotaStatus } from "./policies/quota.policy";
import { GenerationsRepository } from "./repositories/generations.repository";

export type GenerationResult = { generation: GenerationRow; cached: boolean };

const RESULT_WEBP_QUALITY = 92;

const prepareModelInput = (original: Buffer): Promise<Buffer> =>
  sharp(original)
    .resize(AI_INPUT_MAX_DIMENSION, AI_INPUT_MAX_DIMENSION, { fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 90 })
    .toBuffer();

const render = async (user: AuthUser, image: ImageRow, template: TemplateDefinition, pending: GenerationRow) => {
  const original = await storage.read(image.storageKey);
  const output = await runStrategyChain(
    { image: await prepareModelInput(original), mimeType: "image/jpeg", prompt: template.systemPrompt, templateId: template.id, modelTier: template.modelTier },
    (failure) => logger.warn({ generationId: pending.id, ...failure }, "Generation strategy failed"),
  );

  // Re-encoding also proves the provider actually returned an image.
  const result = await sharp(output.buffer).webp({ quality: RESULT_WEBP_QUALITY }).toBuffer();
  const stored = await storage.put(`generations/${user.id}/${randomUUID()}.webp`, result, "image/webp");

  return GenerationsRepository.update(pending.id, {
    status: "completed",
    strategy: output.strategy,
    resultUrl: stored.url,
    resultStorageKey: stored.key,
    costUsd: output.costUsd,
    completedAt: new Date(),
  });
};

export class GenerationsService {
  static async getQuotaStatus(user: AuthUser, now = new Date()): Promise<QuotaStatus> {
    const usage = await GenerationsRepository.usageSince(user.id, windowStart(now));
    return evaluateQuota({
      role: user.role,
      limit: env.GENERATION_DAILY_LIMIT,
      usedInWindow: usage.used,
      oldestInWindow: usage.oldest,
      now,
    });
  }

  static async create(user: AuthUser, imageId: string, templateId: string, client: ClientInfo): Promise<GenerationResult> {
    const image = await ImagesService.getOwned(user.id, imageId);
    const template = TemplatesService.getForGeneration(templateId);

    const quota = await GenerationsService.getQuotaStatus(user);
    if (!quota.allowed && quota.limit !== null) throw new QuotaExceededError(quota.limit, quota.resetsAt);

    const cacheKey = buildCacheKey({
      contentHash: image.contentHash,
      templateId: template.id,
      promptVersion: template.promptVersion,
      modelTier: template.modelTier,
    });
    const base = { imageId: image.id, userId: user.id, templateId: template.id, modelTier: template.modelTier, cacheKey };

    const hit = await GenerationsRepository.findCompletedByCacheKey(user.id, cacheKey);
    if (hit) {
      // One clock for both stamps; the DB default for createdAt could land after a JS completedAt.
      const now = new Date();
      const generation = await GenerationsRepository.insert({
        ...base,
        status: "completed",
        strategy: "cache",
        cached: true,
        costUsd: 0,
        resultUrl: hit.resultUrl,
        resultStorageKey: hit.resultStorageKey,
        createdAt: now,
        completedAt: now,
      });
      GenerationsService.audit(user, generation, client);
      return { generation, cached: true };
    }

    const pending = await GenerationsRepository.insert({ ...base, status: "pending" });
    try {
      const generation = await render(user, image, template, pending);
      GenerationsService.audit(user, generation, client);
      return { generation, cached: false };
    } catch (error) {
      await GenerationsService.markFailed(user, pending, error, client);
      throw new GenerationFailedError();
    }
  }

  private static async markFailed(user: AuthUser, pending: GenerationRow, error: unknown, client: ClientInfo) {
    logger.error({ err: error, generationId: pending.id }, "Generation failed");
    // Provider messages can leak internals, so users only see which strategies were tried.
    const errorMessage =
      error instanceof GenerationChainError
        ? `Every strategy failed (${error.failures.map((failure) => failure.strategy).join(", ")})`
        : "Generation failed unexpectedly";

    await GenerationsRepository.update(pending.id, { status: "failed", errorMessage, completedAt: new Date() });
    AuditService.record({
      actorId: user.id,
      action: AUDIT_ACTIONS.imageGenerationFailed,
      metadata: { generationId: pending.id, imageId: pending.imageId, templateId: pending.templateId },
      ipAddress: client.ipAddress,
    });
  }

  private static audit(user: AuthUser, generation: GenerationRow, client: ClientInfo): void {
    AuditService.record({
      actorId: user.id,
      action: AUDIT_ACTIONS.imageGenerated,
      metadata: {
        generationId: generation.id,
        imageId: generation.imageId,
        templateId: generation.templateId,
        strategy: generation.strategy,
        cached: generation.cached,
        costUsd: Number(generation.costUsd),
      },
      ipAddress: client.ipAddress,
    });
  }
}
