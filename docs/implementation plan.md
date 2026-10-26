Berikut adalah **Rencana Implementasi (Implementation Plan)** untuk fitur AI Chatbot ANNAPURNA Adventure. Anda dapat langsung memberikan dokumen *Markdown* ini kepada *developer* atau "agent" Anda sebagai panduan *coding* yang komprehensif.

```markdown
# Rencana Implementasi Fitur AI Chatbot (Production-Ready)
**Fase:** Sprint 3 (Sesuai PRD AA-100+)
**Target:** Chatbot AI interaktif dengan efek *streaming*, RAG (*In-Context*), perlindungan *Rate Limit*, dan *Fallback* Anti-Down.

---

## Tahap 1: Instalasi Dependencies (Vercel AI SDK)
Sistem tidak menggunakan `fetch` manual. Kita akan menggunakan infrastruktur Vercel AI SDK untuk menangani *streaming* dan koneksi LLM.

**Perintah Instalasi:**
```bash
npm install ai @ai-sdk/react @openrouter/ai-sdk-provider

```

*Catatan: Pastikan `OPENROUTER_API_KEY` sudah terpasang di `.env.local`.*

---

## Tahap 2: RAG & System Prompt (Service Layer)

**File:** `src/lib/services/chatbot-service.ts`

Buat fungsi untuk menarik data dari *database* (Prisma) dan merangkainya menjadi *System Prompt* yang cerdas dan aman.

**Langkah Pengerjaan:**

1. **Fetch Data:** Lakukan *query* ke `prisma.product.findMany` (aktif), `prisma.rentalPackage.findMany` (aktif), dan `prisma.chatbotKnowledgeBase.findMany` (aktif).
2. **Format Teks:** Ubah hasil *query* menjadi *string* sederhana (misal: `- Tenda 2P: Rp 35.000/malam`).
3. **Inject Prompt:** Buat variabel `systemPrompt` sesuai aturan baru:
* **Boleh** merekomendasikan alat dari katalog berdasarkan lokasi (contoh: Prau = butuh jaket tebal).
* **Dilarang** memberikan data sensitif atau menjawab di luar konteks *outdoor* / penyewaan.
* Sisipkan string data katalog dan *knowledge base* di bagian bawah *prompt*.



---

## Tahap 3: API Route & Rate Limiting (Controller Layer)

**File:** `src/app/api/chatbot/route.ts` (Gunakan metode `POST`)

Ini adalah *endpoint* yang akan dipanggil oleh *browser*. Wajib memiliki perlindungan dan penanganan *error*.

**Langkah Pengerjaan:**

1. **Rate Limiting (Upstash):**
* Terapkan pembatasan maksimal **10 request / IP / menit**.
* Jika melebihi batas, kembalikan HTTP `429 Too Many Requests`.


2. **Inisialisasi OpenRouter:**
* Gunakan `createOpenRouter` dari `@openrouter/ai-sdk-provider`.
* Model yang digunakan: `'meta-llama/llama-3.1-8b-instruct:free'` (atau model gratis setara di OpenRouter).


3. **Execute Stream:**
* Panggil fungsi `streamText({ model, system, messages })`.
* `messages` diambil langsung dari *body request* (berisi riwayat obrolan dari *frontend*).


4. **Database Persistence (onFinish):**
* Gunakan *callback* `onFinish` dari `streamText` untuk menyimpan *chat history* (Pesan User & Balasan AI) ke tabel `chat_messages` di database (sesuai schema PRD).


5. **Fallback Error Handling:**
* Bungkus dengan `try-catch`. Jika OpenRouter *timeout*/error, *return Response* berisi pesan teks statis: *"Maaf, asisten kami sedang sibuk melayani pendaki lain. Silakan coba beberapa saat lagi atau hubungi WhatsApp Admin."*



---

## Tahap 4: Frontend UI & State Management

**File:** `src/components/organisms/customer-chat-widget.tsx`

Tinggalkan cara manual mengelola *state* obrolan. Gunakan *hooks* bawaan Vercel AI SDK.

**Langkah Pengerjaan:**

1. **Gunakan Hooks `useChat`:**

```tsx
   import { useChat } from '@ai-sdk/react';
   const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
     api: '/api/chatbot',
     onError: (error) => { /* Handle error gracefully */ }
   });
   

```

2. **Render UI:**
* *Map* array `messages` menjadi *chat bubble* (Kiri untuk asisten, Kanan untuk *user*).
* Tampilkan indikator mengetik (bisa memanfaatkan variabel `isLoading` dari *hooks*) saat AI sedang mulai merespons.


3. **Form Input:**
* Sambungkan elemen `<input>` dengan `value={input}` dan `onChange={handleInputChange}`.
* Sambungkan tag `<form>` dengan `onSubmit={handleSubmit}`.



---

## Tahap 5: Checklist Acceptance Criteria (DoD)

* [ ] Fitur *chatbot* memberikan teks secara mengalir (*streaming*), bukan *loading* panjang lalu muncul sekaligus.
* [ ] Jika ditanya "Rekomendasi tenda untuk di Gunung Prau", AI menjawab menggunakan data barang dari *database*.
* [ ] Jika ditanya tentang resep masakan atau politik, AI menolak dengan sopan dan mengarahkan ke layanan rental.
* [ ] Jika *user* melakukan *spam* (lebih dari 10 kali/menit), sistem menolak dan menjaga kuota OpenRouter agar tidak terblokir.
* [ ] Riwayat percakapan tersimpan di tabel `chat_messages` untuk keperluan audit (OQ-12).

```

```
