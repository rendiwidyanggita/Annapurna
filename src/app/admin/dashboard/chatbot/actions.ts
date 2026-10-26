"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/require-role";
import { logActivity } from "@/lib/services/audit-log";
import { z } from "zod";

const knowledgeBaseSchema = z.object({
  id: z.string().optional(),
  topic: z.string().min(3, "Topik minimal 3 karakter").max(100, "Topik maksimal 100 karakter"),
  questionPattern: z.string().optional().nullable(),
  answer: z.string().min(5, "Jawaban panduan minimal 5 karakter"),
  isActive: z.boolean().default(true),
});

export async function getKnowledgeBaseList() {
  await requireRole(["ADMIN", "OWNER"]);

  return await prisma.chatbotKnowledgeBase.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      _count: {
        select: { messages: true },
      },
    },
  });
}

export async function saveKnowledgeBaseAction(data: z.infer<typeof knowledgeBaseSchema>) {
  const { user } = await requireRole(["ADMIN", "OWNER"]);
  const validated = knowledgeBaseSchema.parse(data);

  if (validated.id) {
    const existing = await prisma.chatbotKnowledgeBase.findUnique({
      where: { id: validated.id },
    });
    if (!existing) throw new Error("Entri Knowledge Base tidak ditemukan.");

    const updated = await prisma.chatbotKnowledgeBase.update({
      where: { id: validated.id },
      data: {
        topic: validated.topic,
        questionPattern: validated.questionPattern,
        answer: validated.answer,
        isActive: validated.isActive,
      },
    });

    await logActivity(prisma, {
      userId: user.id,
      action: "CHATBOT_KB_UPDATED",
      entityName: "ChatbotKnowledgeBase",
      entityId: updated.id,
      oldValue: { topic: existing.topic, answer: existing.answer },
      newValue: { topic: updated.topic, answer: updated.answer },
      description: `Memperbarui Knowledge Base: ${updated.topic}`,
    });

    revalidatePath("/admin/dashboard/chatbot");
    return { success: true, item: updated };
  } else {
    const created = await prisma.chatbotKnowledgeBase.create({
      data: {
        topic: validated.topic,
        questionPattern: validated.questionPattern,
        answer: validated.answer,
        isActive: validated.isActive,
      },
    });

    await logActivity(prisma, {
      userId: user.id,
      action: "CHATBOT_KB_CREATED",
      entityName: "ChatbotKnowledgeBase",
      entityId: created.id,
      newValue: { topic: created.topic, answer: created.answer },
      description: `Membuat Knowledge Base baru: ${created.topic}`,
    });

    revalidatePath("/admin/dashboard/chatbot");
    return { success: true, item: created };
  }
}

export async function toggleKnowledgeBaseStatusAction(id: string) {
  const { user } = await requireRole(["ADMIN", "OWNER"]);

  const existing = await prisma.chatbotKnowledgeBase.findUnique({ where: { id } });
  if (!existing) throw new Error("Entri tidak ditemukan.");

  const updated = await prisma.chatbotKnowledgeBase.update({
    where: { id },
    data: { isActive: !existing.isActive },
  });

  await logActivity(prisma, {
    userId: user.id,
    action: "CHATBOT_KB_STATUS_TOGGLED",
    entityName: "ChatbotKnowledgeBase",
    entityId: id,
    oldValue: { isActive: existing.isActive },
    newValue: { isActive: updated.isActive },
    description: `Ubah status KB ${existing.topic} menjadi ${updated.isActive ? "Aktif" : "Nonaktif"}`,
  });

  revalidatePath("/admin/dashboard/chatbot");
  return { success: true, item: updated };
}

export async function deleteKnowledgeBaseAction(id: string) {
  const { user } = await requireRole(["ADMIN", "OWNER"]);

  const existing = await prisma.chatbotKnowledgeBase.findUnique({ where: { id } });
  if (!existing) throw new Error("Entri tidak ditemukan.");

  await prisma.chatbotKnowledgeBase.delete({ where: { id } });

  await logActivity(prisma, {
    userId: user.id,
    action: "CHATBOT_KB_DELETED",
    entityName: "ChatbotKnowledgeBase",
    entityId: id,
    oldValue: { topic: existing.topic },
    description: `Menghapus KB: ${existing.topic}`,
  });

  revalidatePath("/admin/dashboard/chatbot");
  return { success: true };
}
