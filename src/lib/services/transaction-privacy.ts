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
