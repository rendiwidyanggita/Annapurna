/**
 * Atoms — smallest reusable building blocks (Atomic Design).
 * These components have no dependencies on other custom components.
 */

export { StatusBadge } from "./status-badge";
export type { StatusBadgeProps, StatusBadgeVariant } from "./status-badge";

export { TabSwitcher } from "./tab-switcher";
export type { TabSwitcherProps, TabItem } from "./tab-switcher";

export { WhatsAppIcon, InstagramIcon, LocationIcon } from "./brand-icons";
export type { IconProps as BrandIconProps } from "./brand-icons";

export { QuantityStepper } from "./quantity-stepper";
export type { QuantityStepperProps } from "./quantity-stepper";
