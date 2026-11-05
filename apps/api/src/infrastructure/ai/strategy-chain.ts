import {
  GenerationChainError,
  type GenerationInput,
  type GenerationOutput,
  type GenerationStrategy,
  type StrategyFailure,
} from "./ai.types";

// Tries each strategy in order and returns the first success; throws with every failure otherwise.
export const runChain = async (
  strategies: readonly GenerationStrategy[],
  input: GenerationInput,
  onFailure?: (failure: StrategyFailure) => void,
): Promise<GenerationOutput> => {
  const failures: StrategyFailure[] = [];

  for (const strategy of strategies) {
    try {
      return await strategy.generate(input);
    } catch (error) {
      const failure = { strategy: strategy.name, message: error instanceof Error ? error.message : String(error) };
      failures.push(failure);
      onFailure?.(failure);
    }
  }

  throw new GenerationChainError(failures);
};
