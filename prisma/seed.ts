import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Mulai seeding database ANNAPURNA...");

  // 1. Roles
  console.log("-> Seeding Roles...");
  const roles = [
    {
      name: "CUSTOMER",
      description: "Pelanggan penyewaan alat outdoor",
    },
    {
      name: "ADMIN",
      description: "Staff operasional pengelolaan inventaris dan transaksi",
    },
    {
      name: "OWNER",
      description: "Pemilik usaha dengan akses penuh laporan dan manajemen",
    },
  ];

  for (const role of roles) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: { description: role.description },
      create: {
        name: role.name,
        description: role.description,
      },
    });
  }

  // 2. Kategori Produk
  console.log("-> Seeding Kategori...");
  const categories = [
    { name: "Tenda & Shelter", description: "Tenda dome, flysheet, tarp tent, pasak & tali" },
    { name: "Carrier & Tas", description: "Tas carrier 40L - 80L, daypack, drybag" },
    { name: "Sleeping Gear", description: "Sleeping bag, matras angin, matras foil, bantal tiup" },
    { name: "Cooking & Dining", description: "Nesting, kompor portable, gas kaleng, cutlery" },
    { name: "Penerangan & Elektronik", description: "Headlamp, lentera tenda, powerbank outdoor" },
    { name: "Trekking & Navigation", description: "Trekking pole, kompas, gaiter" },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { name: cat.name },
      update: { description: cat.description },
      create: {
        name: cat.name,
        description: cat.description,
        isActive: true,
      },
    });
  }

  // 3. Terms & Conditions
  console.log("-> Seeding Syarat & Ketentuan...");
  const defaultTerms = `1. Penyewa wajib menyerahkan identitas asli yang masih berlaku (KTP / SIM / Kartu Pelajar) sebagai jaminan.
2. Pembayaran DP (Down Payment) sebesar 50% wajib dibayarkan saat reservasi, dan pelunasan dilakukan saat pengambilan alat.
3. Waktu pengambilan dan pengembalian alat disesuaikan dengan tanggal yang tertera pada invoice sewa.
4. Keterlambatan pengembalian dikenakan denda sesuai tarif harian alat yang disewa.
5. Penyewa bertanggung jawab penuh atas keutuhan dan kebersihan alat outdoor yang disewa.
6. Kerusakan atau kehilangan unit sewa akan dikenakan denda penggantian sesuai nilai perbaikan atau harga baru unit.`;

  await prisma.termsCondition.upsert({
    where: { version: "v1.0" },
    update: { content: defaultTerms, isActive: true },
    create: {
      version: "v1.0",
      content: defaultTerms,
      isActive: true,
    },
  });

  // 4. Chatbot Knowledge Base Dasar
  console.log("-> Seeding FAQ Chatbot...");
  const faqs = [
    {
      topic: "Cara Sewa",
      questionPattern: "bagaimana cara sewa|cara rental|alur pemesanan",
      answer: "Pilih alat atau paket di katalog, tentukan tanggal mulai dan selesai, lalu selesaikan pembayaran DP 50% via Midtrans. Ambil alat di toko dengan membawa KTP/SIM asli sebagai jaminan.",
    },
    {
      topic: "Jaminan Sewa",
      questionPattern: "apa jaminannya|jaminan sewa apa|syarat jaminan",
      answer: "Jaminan yang diperlukan adalah kartu identitas asli yang sah dan masih berlaku, seperti E-KTP atau SIM.",
    },
    {
      topic: "Pembayaran & DP",
      questionPattern: "apakah bisa dp|cara bayar|metode pembayaran",
      answer: "Bisa, Anda cukup membayar DP 50% secara online melalui sistem kami (QRIS, VA, Transfer Bank). Pelunasan dapat dilakukan saat pengambilan alat di outlet.",
    },
  ];

  for (const faq of faqs) {
    const existing = await prisma.chatbotKnowledgeBase.findFirst({
      where: { topic: faq.topic },
    });

    if (!existing) {
      await prisma.chatbotKnowledgeBase.create({
        data: {
          topic: faq.topic,
          questionPattern: faq.questionPattern,
          answer: faq.answer,
          isActive: true,
        },
      });
    }
  }

  console.log("✅ Seeding selesai dengan sukses!");
}

main()
  .catch((e) => {
    console.error("❌ Error saat seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
