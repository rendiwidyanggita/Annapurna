import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/require-role";
import { getKnowledgeBaseList } from "./actions";
import { ChatbotAdminClient } from "./chatbot-admin-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Knowledge Base Chatbot AI — Admin ANNAPURNA",
};

export default async function ChatbotAdminPage() {
  try {
    await requireRole(["ADMIN", "OWNER"]);
  } catch {
    redirect("/admin/dashboard");
  }

  const items = await getKnowledgeBaseList();

  return <ChatbotAdminClient initialItems={items} />;
}
