import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/require-role";
import { prisma } from "@/lib/prisma";
import { wibDayToUtcRange } from "@/lib/date-range";
import { ActivityLogClient } from "./activity-log-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Activity Log & Audit Trail — Admin ANNAPURNA",
};

interface ActivityLogPageProps {
  searchParams: Promise<{
    page?: string;
    entityName?: string;
    action?: string;
    startDate?: string;
    endDate?: string;
  }>;
}

export default async function ActivityLogPage({ searchParams }: ActivityLogPageProps) {
  try {
    await requireRole(["admin", "owner"]);
  } catch {
    redirect("/admin/dashboard");
  }

  const resolved = await searchParams;
  const page = resolved.page ? parseInt(resolved.page, 10) : 1;
  const limit = 20;
  const skip = (page - 1) * limit;
  const entityName = resolved.entityName || "";
  const action = resolved.action || "";
  const startDate = resolved.startDate || "";
  const endDate = resolved.endDate || "";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {};

  if (entityName && entityName !== "ALL") {
    where.entityName = entityName;
  }

  if (action && action.trim().length > 0) {
    where.action = { contains: action.trim(), mode: "insensitive" };
  }

  if (startDate && endDate) {
    try {
      const s = wibDayToUtcRange(startDate);
      const e = wibDayToUtcRange(endDate);
      where.createdAt = {
        gte: s.startUtc,
        lte: e.endUtc,
      };
    } catch {
      // ignore
    }
  }

  const [total, logs, distinctEntities] = await Promise.all([
    prisma.activityLog.count({ where }),
    prisma.activityLog.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            profile: { select: { fullName: true } },
          },
        },
      },
    }),
    prisma.activityLog.findMany({
      distinct: ["entityName"],
      select: { entityName: true },
    }),
  ]);

  return (
    <ActivityLogClient
      logs={logs}
      total={total}
      page={page}
      limit={limit}
      totalPages={Math.ceil(total / limit) || 1}
      currentEntityName={entityName}
      currentAction={action}
      currentStartDate={startDate}
      currentEndDate={endDate}
      availableEntities={distinctEntities.map((e) => e.entityName)}
    />
  );
}
