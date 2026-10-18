/**
 * Molecules — components composed from atoms.
 * These have some internal logic but remain presentational.
 */

export { ProductCard } from "./product-card";
export type { ProductCardProps } from "./product-card";

export { CategoryCard } from "./category-card";
export type { CategoryCardProps } from "./category-card";

export { StepCard } from "./step-card";
export type { StepCardProps } from "./step-card";

export { RentalDateGroup, getDurationDays, getDurationLabel } from "./rental-date-group";
export type { DurationScheme } from "./rental-date-group";
