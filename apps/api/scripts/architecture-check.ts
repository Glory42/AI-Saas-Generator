import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

type Violation = { file: string; message: string };

type Rule = {
  appliesTo: (file: string) => boolean;
  forbids: (specifier: string) => boolean;
  message: string;
};

const projectRoot = path.resolve(import.meta.dir, "..");
const sourceRoot = path.join(projectRoot, "src");

const isRepository = (specifier: string) => specifier.includes("/repositories/") || specifier.endsWith(".repository");
const isService = (specifier: string) => specifier.includes("/services/") || specifier.endsWith(".service");
const isController = (specifier: string) => specifier.endsWith(".controller");
const isDatabase = (specifier: string) => specifier.includes("infrastructure/database");

const RULES: Rule[] = [
  {
    appliesTo: (file) => file.endsWith(".controller.ts"),
    forbids: (specifier) => isRepository(specifier) || isDatabase(specifier),
    message: "controller imports a repository or the database directly",
  },
  {
    appliesTo: (file) => file.includes("/repositories/"),
    forbids: (specifier) => isService(specifier) || isController(specifier),
    message: "repository imports a service or controller",
  },
  {
    appliesTo: (file) => file.endsWith(".service.ts") || file.includes("/services/"),
    forbids: isController,
    message: "service imports a controller",
  },
  {
    appliesTo: (file) => ["/dto/", "/policies/", "/helpers/"].some((folder) => file.includes(folder)),
    forbids: (specifier) => isService(specifier) || isRepository(specifier) || isController(specifier),
    message: "dto/policy/helper imports a service, repository or controller",
  },
];

const collectTypeScriptFiles = async (directory: string): Promise<string[]> => {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const absolute = path.join(directory, entry.name);
      if (entry.isDirectory()) return collectTypeScriptFiles(absolute);
      return entry.name.endsWith(".ts") && !entry.name.endsWith(".d.ts") ? [absolute] : [];
    }),
  );
  return nested.flat();
};

const importSpecifiers = (source: string): string[] =>
  [...source.matchAll(/from\s+["']([^"']+)["']/g)].flatMap((match) => (match[1] ? [match[1]] : []));

const checkFile = async (absolutePath: string): Promise<Violation[]> => {
  const file = path.relative(projectRoot, absolutePath).split(path.sep).join("/");
  const specifiers = importSpecifiers(await readFile(absolutePath, "utf8"));

  return RULES.filter((rule) => rule.appliesTo(file)).flatMap((rule) =>
    specifiers.filter(rule.forbids).map((specifier) => ({ file, message: `${rule.message} (${specifier})` })),
  );
};

const files = await collectTypeScriptFiles(sourceRoot);
const violations = (await Promise.all(files.map(checkFile))).flat();

if (violations.length > 0) {
  console.error("Architecture check failed:");
  for (const violation of violations) console.error(`  - ${violation.file}: ${violation.message}`);
  process.exit(1);
}

console.info(`Architecture check passed (${files.length} files).`);
