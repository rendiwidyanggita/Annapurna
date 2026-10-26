import { Prisma, PrismaClient } from "@prisma/client";

export interface LogActivityParams {
  userId?: string | null;
  action: string;
  entityName: string;
  entityId?: string | null;
  oldValue?: unknown;
  newValue?: unknown;
  description?: string | null;
}

/**
 * Centralized audit trail helper.
 * Accepts both the root PrismaClient and a transaction client
 * so callers can atomically log within `prisma.$transaction()`.
 */
export async function logActivity(
  db: PrismaClient | Prisma.TransactionClient,
  params: LogActivityParams,
) {
  return await db.activityLog.create({
    data: {
      userId: params.userId || null,
      action: params.action,
      entityName: params.entityName,
      entityId: params.entityId || null,
      oldValue: params.oldValue ? JSON.stringify(params.oldValue) : null,
      newValue: params.newValue ? JSON.stringify(params.newValue) : null,
      description: params.description || null,
    },
  });
}
