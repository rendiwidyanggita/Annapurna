import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserProfile } from "@/lib/auth/profile";
import { processChatbotMessage, getChatSessionHistory } from "@/lib/services/chatbot-service";
import { z } from "zod";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

const chatRequestSchema = z.object({
  message: z.string().min(1, "Pesan tidak boleh kosong").max(1000, "Pesan maksimal 1000 karakter"),
  sessionId: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const rl = await checkRateLimit(ip, "chatbot");
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Terlalu banyak permintaan pesan. Silakan tunggu sebentar." },
        { status: 429 }
      );
    }

    const profile = await getCurrentUserProfile();
    const userId = profile.isAuthenticated && profile.user ? profile.user.id : null;

    const body = await request.json();
    const validated = chatRequestSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.errors[0]?.message || "Format pesan tidak valid" },
        { status: 400 }
      );
    }

    const result = await processChatbotMessage({
      userId,
      sessionId: validated.data.sessionId,
      message: validated.data.message,
    });

    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error("[CHATBOT API ERROR]", error);
    const message = error instanceof Error ? error.message : "Terjadi kesalahan internal";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");

    if (!sessionId) {
      return NextResponse.json({ error: "sessionId diperlukan" }, { status: 400 });
    }

    const profile = await getCurrentUserProfile();
    const userId = profile.isAuthenticated && profile.user ? profile.user.id : null;

    const session = await getChatSessionHistory(sessionId, userId);

    if (!session) {
      return NextResponse.json({ error: "Sesi tidak ditemukan atau akses ditolak" }, { status: 404 });
    }

    return NextResponse.json({ session });
  } catch (error: unknown) {
    console.error("[CHATBOT GET HISTORY ERROR]", error);
    return NextResponse.json({ error: "Gagal memuat riwayat" }, { status: 500 });
  }
}
