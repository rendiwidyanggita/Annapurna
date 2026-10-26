/**
 * Privacy & Security utilities for Guarantee Identity Documents (PRD 30 & Technical Spec)
 *
 * Enforces client masking of sensitive NIK / SIM / KTM numbers by default
 * and provides secure helpers to prevent identity leakage in public queries.
 */

/**
 * Masks an identity number for display:
 * - 16-digit NIK: "3273 •••• •••• 1234"
 * - Shorter IDs (SIM/KTM): "12 •••• 78"
 */
export function maskIdentityNumber(rawId: string | null | undefined): string {
  if (!rawId) return "-";
  const trimmed = rawId.trim();
  if (trimmed.length <= 4) {
    return "••••";
  }

  if (trimmed.length >= 12) {
    const prefix = trimmed.slice(0, 4);
    const suffix = trimmed.slice(-4);
    return `${prefix} •••• •••• ${suffix}`;
  }

  const prefix = trimmed.slice(0, 2);
  const suffix = trimmed.slice(-2);
  return `${prefix} •••• ${suffix}`;
}

/**
 * Strips sensitive guarantee identity fields from customer-facing transaction objects.
 */
export function sanitizeTransactionForCustomer<T extends Record<string, unknown>>(
  transaction: T
): Omit<T, "guaranteeIdNumber" | "guaranteeNotes"> {
  const { guaranteeIdNumber: _id, guaranteeNotes: _notes, ...safeFields } = transaction as Record<string, unknown> & {
    guaranteeIdNumber?: unknown;
    guaranteeNotes?: unknown;
  };
  return safeFields as Omit<T, "guaranteeIdNumber" | "guaranteeNotes">;
}

/**
 * Masks customer full name (e.g., "Budi Santoso" -> "B*** S******")
 */
export function maskCustomerName(name: string | null | undefined): string {
  if (!name) return "-";
  const parts = name.trim().split(/\s+/);
  return parts
    .map((p) => (p.length > 1 ? `${p[0]}${"*".repeat(p.length - 1)}` : p))
    .join(" ");
}

/**
 * Masks phone number (e.g., "081234567890" -> "0812••••7890")
 */
export function maskPhoneNumber(phone: string | null | undefined): string {
  if (!phone) return "-";
  const trimmed = phone.trim();
  if (trimmed.length <= 6) return "••••••";
  const start = trimmed.slice(0, 4);
  const end = trimmed.slice(-4);
  return `${start}••••${end}`;
}
