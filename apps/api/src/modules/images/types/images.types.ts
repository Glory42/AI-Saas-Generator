import type { GenerationRow } from "../../generations/generations.entity";
import type { ImageRow } from "../images.entity";

export type ImageWithGenerationRows = ImageRow & { generations: GenerationRow[] };
