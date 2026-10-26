import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createAdminClient } from "@/lib/supabase/admin";
import { logActivity } from "@/lib/services/audit-log";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  // 1. Authorization — verify CRON_SECRET bearer token
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { error: "Unauthorized: Invalid or missing CRON_SECRET" },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(request.url);
  const isDryRun = searchParams.get("dryRun") === "true";

  const now = new Date();
  // Cutoffs
  const twelveMonthsAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
  const twentyFourMonthsAgo = new Date(now.getTime() - 730 * 24 * 60 * 60 * 1000);

  const stats = {
    chatSessionsPurged: 0,
    chatMessagesPurged: 0,
    activityLogsPurged: 0,
    customersAnonymized: 0,
    archivedFiles: [] as string[],
    dryRun: isDryRun,
  };

  try {
    // ------------------------------------------------------------------------
    // Step 1: Query old chat sessions (> 12 months)
    // ------------------------------------------------------------------------
    const oldSessions = await prisma.chatSession.findMany({
      where: { startedAt: { lte: twelveMonthsAgo } },
      include: { messages: true },
      take: 200,
    });

    if (oldSessions.length > 0) {
      // Archive to Supabase Storage if bucket exists
      const sessionJsonl = oldSessions.map((s) => JSON.stringify(s)).join("\n");
      const filename = `chat-archive-${Date.now()}.jsonl`;

      try {
        const supabaseAdmin = createAdminClient();
        if (supabaseAdmin) {
          const { error: uploadErr } = await supabaseAdmin.storage
            .from("system-archives")
            .upload(`chats/${filename}`, Buffer.from(sessionJsonl), {
              contentType: "application/x-ndjson",
              upsert: true,
            });
          if (!uploadErr) {
            stats.archivedFiles.push(`chats/${filename}`);
          }
        }
      } catch (err) {
        console.warn("[RETENTION] Archive storage upload skipped:", err);
      }

      const sessionIds = oldSessions.map((s) => s.id);
      const totalMessages = oldSessions.reduce((sum, s) => sum + s.messages.length, 0);

      if (!isDryRun) {
        // Cascade delete will delete messages
        await prisma.chatSession.deleteMany({
          where: { id: { in: sessionIds } },
        });
      }

      stats.chatSessionsPurged = sessionIds.length;
      stats.chatMessagesPurged = totalMessages;
    }

    // ------------------------------------------------------------------------
    // Step 2: Query and Purge old Activity Logs (> 12 months) in chunks of 500
    // ------------------------------------------------------------------------
    const oldLogs = await prisma.activityLog.findMany({
      where: { createdAt: { lte: twelveMonthsAgo } },
      take: 500,
      select: { id: true, createdAt: true, action: true, entityName: true },
    });

    if (oldLogs.length > 0) {
      const logJsonl = oldLogs.map((l) => JSON.stringify(l)).join("\n");
      const filename = `logs-archive-${Date.now()}.jsonl`;

      try {
        const supabaseAdmin = createAdminClient();
        if (supabaseAdmin) {
          const { error: uploadErr } = await supabaseAdmin.storage
            .from("system-archives")
            .upload(`logs/${filename}`, Buffer.from(logJsonl), {
              contentType: "application/x-ndjson",
              upsert: true,
            });
          if (!uploadErr) {
            stats.archivedFiles.push(`logs/${filename}`);
          }
        }
      } catch (err) {
        console.warn("[RETENTION] Archive storage upload skipped:", err);
      }

      const logIds = oldLogs.map((l) => l.id);
      if (!isDryRun) {
        await prisma.activityLog.deleteMany({
          where: { id: { in: logIds } },
        });
      }
      stats.activityLogsPurged = logIds.length;
    }

    // ------------------------------------------------------------------------
    // Step 3: Anonymize Inactive Customers (> 24 months no active rentals)
    // ------------------------------------------------------------------------
    const candidateCustomers = await prisma.user.findMany({
      where: {
        role: { name: "CUSTOMER" },
        createdAt: { lte: twentyFourMonthsAgo },
        email: { not: { contains: "@deleted.annapurna" } },
      },
      include: {
        transactions: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { createdAt: true },
        },
      },
      take: 100,
    });

    for (const cust of candidateCustomers) {
      const latestTx = cust.transactions[0];
      // If customer has no transactions OR latest transaction was > 24 months ago
      if (!latestTx || latestTx.createdAt <= twentyFourMonthsAgo) {
        if (!isDryRun) {
          const anonEmail = `anon-${cust.id.slice(0, 8)}@deleted.annapurna`;
          await prisma.$transaction([
            prisma.user.update({
              where: { id: cust.id },
              data: {
                email: anonEmail,
                isActive: false,
              },
            }),
            prisma.profile.updateMany({
              where: { userId: cust.id },
              data: {
                fullName: "Pelanggan Anonim",
                phoneNumber: null,
                address: null,
              },
            }),
          ]);
        }
        stats.customersAnonymized++;
      }
    }

    // Log the retention execution
    if (!isDryRun) {
      await logActivity(prisma, {
        action: "CRON_PURGE_RETENTION",
        entityName: "RetentionPolicy",
        description: `Purged: ${stats.chatSessionsPurged} chat sessions, ${stats.activityLogsPurged} logs. Anonymized: ${stats.customersAnonymized} customers.`,
      });
    }

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      stats,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error purging retention data";
    return NextResponse.json({ error: message, stats }, { status: 500 });
  }
}
