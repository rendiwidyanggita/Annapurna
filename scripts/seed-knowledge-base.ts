import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const KNOWLEDGE_BASE_ITEMS = [
  {
    topic: "Jam Operasional & Alamat Toko",
    questionPattern: "jam buka|alamat|lokasi toko|buka jam berapa|operasional",
    answer:
      "Toko ANNAPURNA Adventure buka setiap hari Senin - Minggu pukul 08:00 - 21:00 WIB. Alamat kami berlokasi di Jl. Raya Pendaki No. 12, Wonosobo, Jawa Tengah (dekat basecamp pendakian).",
    isActive: true,
  },
  {
    topic: "Syarat & Dokumen Jaminan Sewa",
    questionPattern: "syarat sewa|dokumen jaminan|identitas|ktp|sim|kartu pelajar|jaminan",
    answer:
      "Syarat jaminan sewa fisik wajib diserahkan saat pengambilan barang di toko. Anda dapat memilih salah satu identitas asli yang masih berlaku: KTP Asli, SIM Asli, atau Kartu Mahasiswa/Pelajar Asli. Jaminan akan disimpan aman di toko dan dikembalikan utuh saat barang kembali dalam kondisi baik.",
    isActive: true,
  },
  {
    topic: "Pembayaran DP & Pelunasan",
    questionPattern: "cara bayar|dp|down payment|pelunasan|midtrans|qris|transfer",
    answer:
      "Untuk mengamankan booking unit sewa, Anda wajib membayar Down Payment (DP) sebesar 30% dari total sewa secara online via Midtrans (QRIS, VA Bank, GoPay) dalam waktu 60 menit. Sisa pelunasan dibayarkan langsung di kasir toko saat serah terima/pickup barang.",
    isActive: true,
  },
  {
    topic: "Denda Keterlambatan Pengembalian",
    questionPattern: "denda|terlambat|telat|denda telat|biaya overtime",
    answer:
      "Barang wajib dikembalikan paling lambat pada pukul 20:00 WIB di hari terakhir periode sewa. Keterlambatan dikenakan denda per jam atau per hari sesuai tarif sewa harian barang tersebut.",
    isActive: true,
  },
  {
    topic: "Kerusakan & Kehilangan Barang",
    questionPattern: "rusak|robek|patah|hilang|tenda bolong|ganti rugi",
    answer:
      "Penyewa bertanggung jawab atas keutuhan peralatan selama masa sewa. Kerusakan minor dikenakan biaya reparasi aktual. Kerusakan fatal atau unit hilang wajib diganti sesuai harga pasar unit baru yang setara.",
    isActive: true,
  },
  {
    topic: "Cek Status Pesanan Sewa",
    questionPattern: "cek pesanan|status booking|kode transaksi|cek status sewa|pesanan saya",
    answer:
      "Anda dapat mengecek status pesanan sewa Anda dengan memasukkan kode transaksi (contoh: TRX-20261026-XXXX) langsung pada chat ini jika sudah login ke akun penyewa Anda, atau melalui menu 'Pesanan Saya' di navigasi utama.",
    isActive: true,
  },
  {
    topic: "Kebijakan Pembatalan & Refund",
    questionPattern: "batal sewa|cancel|refund|kembalikan dp",
    answer:
      "Pembatalan transaksi rental sebelum status 'Sedang Disewa' dapat dilakukan melalui admin kasir atau riwayat pesanan. Kebijakan pengembalian DP mengacu pada S&K Annapurna Adventure (pembatalan H-2 atau lebih awal dapat memenuhi syarat refund sesuai evaluasi admin).",
    isActive: true,
  },
];

async function main() {
  console.log("Seeding Chatbot Knowledge Base...");
  for (const item of KNOWLEDGE_BASE_ITEMS) {
    const existing = await prisma.chatbotKnowledgeBase.findFirst({
      where: { topic: item.topic },
    });
    if (!existing) {
      await prisma.chatbotKnowledgeBase.create({ data: item });
      console.log(`Created: ${item.topic}`);
    } else {
      await prisma.chatbotKnowledgeBase.update({
        where: { id: existing.id },
        data: item,
      });
      console.log(`Updated: ${item.topic}`);
    }
  }
  console.log("Knowledge Base seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
