import { PrismaClient, MediaType } from "@prisma/client";

const prisma = new PrismaClient();

const PRODUCT_IMAGE_MAP: Record<string, string> = {
  "Tenda Dome Eiger Shira 4P":
    "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=800&auto=format&fit=crop&q=80",
  "Tenda Arei Eliot 2P Ultralight":
    "https://images.unsplash.com/photo-1510312305653-8ed496efae75?w=800&auto=format&fit=crop&q=80",
  "Flysheet Waterproof Consina 3x4":
    "https://images.unsplash.com/photo-1478860409698-8707f313ee8b?w=800&auto=format&fit=crop&q=80",
  "Carrier Cozmeed":
    "https://images.unsplash.com/photo-1551632811-561732d1e306?w=800&auto=format&fit=crop&q=80",
  "Carrier Deuter Aircontact 65+10L":
    "https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?w=800&auto=format&fit=crop&q=80",
  "Carrier Osprey Atmos AG 50L":
    "https://images.unsplash.com/photo-1581605405669-fcdf81165afa?w=800&auto=format&fit=crop&q=80",
  "Daypack Eiger Rhinos 35L":
    "https://images.unsplash.com/photo-1546938576-6e6a64f317cc?w=800&auto=format&fit=crop&q=80",
  "Sleeping Bag Bulu Angsa Naturehike CW280":
    "https://images.unsplash.com/photo-1520072959219-c595dc870360?w=800&auto=format&fit=crop&q=80",
  "Sleeping Bag Polar Dacron Eiger Peak":
    "https://images.unsplash.com/photo-1517824806704-9040b037703b?w=800&auto=format&fit=crop&q=80",
  "Matras Angin Naturehike R-Value 3.5":
    "https://images.unsplash.com/photo-1587547131116-a0655a526190?w=800&auto=format&fit=crop&q=80",
  "Nesting Cooking Set DS-308 (4 in 1)":
    "https://images.unsplash.com/photo-1526772662000-3f88f10405ff?w=800&auto=format&fit=crop&q=80",
  "Kompor Portable Ultralight Kovar Windproof":
    "https://images.unsplash.com/photo-1525811902-f2342640856e?w=800&auto=format&fit=crop&q=80",
  "Set Alat Makan & Cangkir Stainless Camping":
    "https://images.unsplash.com/photo-1533240332313-0db49b459ad6?w=800&auto=format&fit=crop&q=80",
  "Headlamp Rechargeable Naturehike 220 Lumens":
    "https://images.unsplash.com/photo-1508873696983-2df5293cb39f?w=800&auto=format&fit=crop&q=80",
  "Lentera Tenda LED Retro Camping Lamp":
    "https://images.unsplash.com/photo-1517411032315-54ef2cb783bb?w=800&auto=format&fit=crop&q=80",
  "Powerbank Outdoor Solar 20.000 mAh Waterproof":
    "https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=800&auto=format&fit=crop&q=80",
  "Trekking Pole Antishock Dhaulagiri TP-101":
    "https://images.unsplash.com/photo-1501555088652-021faa106b9b?w=800&auto=format&fit=crop&q=80",
  "Trekking Pole Carbon Ultralight Arei":
    "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&auto=format&fit=crop&q=80",
  "Gaiter Pelindung Kaki Waterproof Consina":
    "https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99?w=800&auto=format&fit=crop&q=80",
  "Sepatu Gunung Eiger Pollock Low Cut":
    "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&auto=format&fit=crop&q=80",
  "Sepatu Gunung SNTA 490 Mid Cut Waterproof":
    "https://images.unsplash.com/photo-1520639888713-7851133b1ed0?w=800&auto=format&fit=crop&q=80",
  "Sepatu Gunung Salomon X Ultra 4 Gore-Tex":
    "https://images.unsplash.com/photo-1551107696-a4b085a6d966?w=800&auto=format&fit=crop&q=80",
};

const PACKAGES_SEED = [
  {
    name: "Paket Tenda & Camping Ceria",
    description:
      "Paket lengkap berkemah santai untuk 4 orang. Termasuk tenda dome 4P tahan badai, 2 sleeping bag dacron hangat, 2 matras angin empuk, serta lentera LED retro untuk suasana hangat malam hari.",
    bannerUrl: "/images/package/paket-tenda.png",
    pricePermalam: 120000,
    pricePerkegiatan1: 280000,
    pricePerkegiatan2: 420000,
    itemNames: [
      { name: "Tenda Dome Eiger Shira 4P", quantity: 1 },
      { name: "Sleeping Bag Polar Dacron Eiger Peak", quantity: 2 },
      { name: "Matras Angin Naturehike R-Value 3.5", quantity: 2 },
      { name: "Lentera Tenda LED Retro Camping Lamp", quantity: 1 },
    ],
  },
  {
    name: "Paket Masak & Barbeque",
    description:
      "Paket perlengkapan kuliner outdoor lengkap. Dilengkapi nesting set 4 in 1 anti lengket, kompor portable kovar windproof anti angin kencang, dan tableware stainless steel higienis.",
    bannerUrl: "/images/package/paket-barbeque.png",
    pricePermalam: 40000,
    pricePerkegiatan1: 95000,
    pricePerkegiatan2: 140000,
    itemNames: [
      { name: "Nesting Cooking Set DS-308 (4 in 1)", quantity: 1 },
      { name: "Kompor Portable Ultralight Kovar Windproof", quantity: 1 },
      { name: "Set Alat Makan & Cangkir Stainless Camping", quantity: 2 },
    ],
  },
  {
    name: "Paket Tektok Standar",
    description:
      "Paket ringkas dan lincah untuk pendakian tektok (1 hari / tanpa menginap). Termasuk daypack 35L ergonomis, trekking pole duralumin antishock, dan headlamp 220 lumens.",
    bannerUrl: "/images/package/paket-tektok-standar.png",
    pricePermalam: 50000,
    pricePerkegiatan1: 115000,
    pricePerkegiatan2: 165000,
    itemNames: [
      { name: "Daypack Eiger Rhinos 35L", quantity: 1 },
      { name: "Trekking Pole Antishock Dhaulagiri TP-101", quantity: 1 },
      { name: "Headlamp Rechargeable Naturehike 220 Lumens", quantity: 1 },
    ],
  },
  {
    name: "Paket Tektok Premium",
    description:
      "Paket tektok kelas atas dengan perlengkapan ultralight. Dilengkapi daypack 35L, trekking pole 100% serat karbon ultra ringan, headlamp USB rechargeable, dan powerbank waterproof 20.000 mAh.",
    bannerUrl: "/images/package/paket-tektok-premium.png",
    pricePermalam: 80000,
    pricePerkegiatan1: 190000,
    pricePerkegiatan2: 275000,
    itemNames: [
      { name: "Daypack Eiger Rhinos 35L", quantity: 1 },
      { name: "Trekking Pole Carbon Ultralight Arei", quantity: 1 },
      { name: "Headlamp Rechargeable Naturehike 220 Lumens", quantity: 1 },
      { name: "Powerbank Outdoor Solar 20.000 mAh Waterproof", quantity: 1 },
    ],
  },
];

async function main() {
  console.log("🌱 Starting homepage dummy seeding...");

  // 1. Seed ProductMedia
  const products = await prisma.product.findMany({
    include: { media: true },
  });

  console.log(`Found ${products.length} products to check for media.`);

  let createdMediaCount = 0;
  for (const product of products) {
    const imageUrl =
      PRODUCT_IMAGE_MAP[product.name] ||
      "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=800&auto=format&fit=crop&q=80";

    const hasPrimary = product.media.some((m) => m.isPrimary);
    if (!hasPrimary) {
      await prisma.productMedia.create({
        data: {
          productId: product.id,
          mediaType: MediaType.image,
          mediaUrl: imageUrl,
          storagePath: `dummy/${product.id}`,
          thumbnailUrl: imageUrl,
          altText: product.name,
          sortOrder: 0,
          isPrimary: true,
        },
      });
      createdMediaCount++;
    }
  }
  console.log(`✅ Created ${createdMediaCount} primary product media records.`);

  // 2. Seed Packages and PackageItems
  const productMap = new Map<string, string>();
  for (const p of products) {
    productMap.set(p.name, p.id);
  }

  for (const pkgData of PACKAGES_SEED) {
    const pkg = await prisma.package.upsert({
      where: { name: pkgData.name },
      update: {
        description: pkgData.description,
        bannerUrl: pkgData.bannerUrl,
        pricePermalam: pkgData.pricePermalam,
        pricePerkegiatan1: pkgData.pricePerkegiatan1,
        pricePerkegiatan2: pkgData.pricePerkegiatan2,
        isActive: true,
        deletedAt: null,
      },
      create: {
        name: pkgData.name,
        description: pkgData.description,
        bannerUrl: pkgData.bannerUrl,
        pricePermalam: pkgData.pricePermalam,
        pricePerkegiatan1: pkgData.pricePerkegiatan1,
        pricePerkegiatan2: pkgData.pricePerkegiatan2,
        isActive: true,
      },
    });

    // Replace package items
    await prisma.packageItem.deleteMany({
      where: { packageId: pkg.id },
    });

    for (const item of pkgData.itemNames) {
      const productId = productMap.get(item.name);
      if (productId) {
        await prisma.packageItem.create({
          data: {
            packageId: pkg.id,
            productId: productId,
            quantity: item.quantity,
          },
        });
      } else {
        console.warn(`Product not found for package item: ${item.name}`);
      }
    }

    // Upsert package media
    const existingMedia = await prisma.packageMedia.findFirst({
      where: { packageId: pkg.id, isPrimary: true },
    });

    if (!existingMedia) {
      await prisma.packageMedia.create({
        data: {
          packageId: pkg.id,
          mediaType: MediaType.image,
          mediaUrl: pkgData.bannerUrl,
          storagePath: pkgData.bannerUrl,
          altText: pkgData.name,
          sortOrder: 0,
          isPrimary: true,
        },
      });
    }

    console.log(`✅ Seeded package: ${pkg.name}`);
  }

  console.log("🎉 Seeding homepage dummy completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
