import { PrismaClient, ItemType, UnitStatus } from "@prisma/client";

const prisma = new PrismaClient();

interface VariantSeed {
  variantName: string;
  size?: string;
  color?: string;
  brand?: string;
  unitCodes: string[];
}

interface ProductSeed {
  name: string;
  description: string;
  itemType: ItemType;
  pricePermalam: number;
  pricePerkegiatan1: number;
  pricePerkegiatan2: number;
  variants: VariantSeed[];
}

interface CategoryProductsSeed {
  categoryName: string;
  products: ProductSeed[];
}

const dummyCatalogData: CategoryProductsSeed[] = [
  // 1. Tenda & Shelter
  {
    categoryName: "Tenda & Shelter",
    products: [
      {
        name: "Tenda Dome Eiger Shira 4P",
        description:
          "Tenda dome double-layer kapasitas 4 orang dengan frame alloy kokoh dan water-column 3000mm. Sangat tahan terhadap terpaan angin dan hujan deras di pegunungan tinggi.",
        itemType: ItemType.rental_unit,
        pricePermalam: 50000,
        pricePerkegiatan1: 120000,
        pricePerkegiatan2: 180000,
        variants: [
          {
            variantName: "Orange Flame (4P)",
            size: "4P (210x210x130 cm)",
            color: "Orange",
            brand: "Eiger",
            unitCodes: ["TND-ES4-01", "TND-ES4-02", "TND-ES4-03"],
          },
          {
            variantName: "Hijau Army (4P)",
            size: "4P (210x210x130 cm)",
            color: "Hijau Army",
            brand: "Eiger",
            unitCodes: ["TND-ES4-04", "TND-ES4-05", "TND-ES4-06"],
          },
          {
            variantName: "Kuning Gold (4P)",
            size: "4P (210x210x130 cm)",
            color: "Kuning Gold",
            brand: "Eiger",
            unitCodes: ["TND-ES4-07", "TND-ES4-08", "TND-ES4-09"],
          },
        ],
      },
      {
        name: "Tenda Arei Eliot 2P Ultralight",
        description:
          "Tenda ultralight 2 orang dengan bobot ringan hanya 1.8 kg. Cocok untuk pendakian solo atau duo bertipe fast and light. Dilengkapi vestibule luas untuk menaruh carrier.",
        itemType: ItemType.rental_unit,
        pricePermalam: 35000,
        pricePerkegiatan1: 85000,
        pricePerkegiatan2: 130000,
        variants: [
          {
            variantName: "Biru Langit (2P)",
            size: "2P (210x140x110 cm)",
            color: "Biru",
            brand: "Arei",
            unitCodes: ["TND-AE2-01", "TND-AE2-02", "TND-AE2-03"],
          },
          {
            variantName: "Merah Cabe (2P)",
            size: "2P (210x140x110 cm)",
            color: "Merah",
            brand: "Arei",
            unitCodes: ["TND-AE2-04", "TND-AE2-05", "TND-AE2-06"],
          },
          {
            variantName: "Abu Slate (2P)",
            size: "2P (210x140x110 cm)",
            color: "Abu-abu",
            brand: "Arei",
            unitCodes: ["TND-AE2-07", "TND-AE2-08", "TND-AE2-09"],
          },
        ],
      },
      {
        name: "Flysheet Waterproof Consina 3x4",
        description:
          "Flysheet pelindung tenda atau shelter darurat berukuran 3x4 meter berbahan taslan coating anti bocor dengan 19 titik loop pengikat tali.",
        itemType: ItemType.rental_unit,
        pricePermalam: 20000,
        pricePerkegiatan1: 50000,
        pricePerkegiatan2: 75000,
        variants: [
          {
            variantName: "Ukuran 3x4m - Hijau Lumut",
            size: "3 x 4 Meter",
            color: "Hijau",
            brand: "Consina",
            unitCodes: ["FS-CS3-01", "FS-CS3-02", "FS-CS3-03"],
          },
          {
            variantName: "Ukuran 3x4m - Hitam Pekat",
            size: "3 x 4 Meter",
            color: "Hitam",
            brand: "Consina",
            unitCodes: ["FS-CS3-04", "FS-CS3-05", "FS-CS3-06"],
          },
          {
            variantName: "Ukuran 3x4m - Navy Blue",
            size: "3 x 4 Meter",
            color: "Navy",
            brand: "Consina",
            unitCodes: ["FS-CS3-07", "FS-CS3-08", "FS-CS3-09"],
          },
        ],
      },
    ],
  },

  // 2. Carrier & Tas
  {
    categoryName: "Carrier & Tas",
    products: [
      {
        name: "Carrier Deuter Aircontact 65+10L",
        description:
          "Ransel gunung kapasitas besar dengan backsystem Aircontact yang empuk dan mendistribusikan beban secara merata ke pinggul. Ideal untuk ekspedisi 4-7 hari.",
        itemType: ItemType.rental_unit,
        pricePermalam: 55000,
        pricePerkegiatan1: 130000,
        pricePerkegiatan2: 195000,
        variants: [
          {
            variantName: "Midnight Navy (65+10L)",
            size: "75 Liter",
            color: "Navy",
            brand: "Deuter",
            unitCodes: ["CR-DA65-01", "CR-DA65-02", "CR-DA65-03"],
          },
          {
            variantName: "Forest Green (65+10L)",
            size: "75 Liter",
            color: "Hijau Forest",
            brand: "Deuter",
            unitCodes: ["CR-DA65-04", "CR-DA65-05", "CR-DA65-06"],
          },
          {
            variantName: "Graphite Black (65+10L)",
            size: "75 Liter",
            color: "Hitam Graphite",
            brand: "Deuter",
            unitCodes: ["CR-DA65-07", "CR-DA65-08", "CR-DA65-09"],
          },
        ],
      },
      {
        name: "Carrier Osprey Atmos AG 50L",
        description:
          "Carrier ergonomis dengan Anti-Gravity suspension system berpori jaring penuh dari punggung hingga hipbelt. Memberikan kenyamanan ventilasi maksimal di cuaca tropis.",
        itemType: ItemType.rental_unit,
        pricePermalam: 60000,
        pricePerkegiatan1: 145000,
        pricePerkegiatan2: 220000,
        variants: [
          {
            variantName: "Abyss Grey (50L)",
            size: "50 Liter",
            color: "Abu-abu",
            brand: "Osprey",
            unitCodes: ["CR-OA50-01", "CR-OA50-02", "CR-OA50-03"],
          },
          {
            variantName: "Venturi Blue (50L)",
            size: "50 Liter",
            color: "Biru Venturi",
            brand: "Osprey",
            unitCodes: ["CR-OA50-04", "CR-OA50-05", "CR-OA50-06"],
          },
          {
            variantName: "Mythical Green (50L)",
            size: "50 Liter",
            color: "Hijau Mythical",
            brand: "Osprey",
            unitCodes: ["CR-OA50-07", "CR-OA50-08", "CR-OA50-09"],
          },
        ],
      },
      {
        name: "Daypack Eiger Rhinos 35L",
        description:
          "Ransel semi-carrier 35L yang lincah untuk pendakian tektok (1 hari) atau summit attack. Sudah dilengkapi rain cover bawaan dan kompartemen water bladder.",
        itemType: ItemType.rental_unit,
        pricePermalam: 25000,
        pricePerkegiatan1: 60000,
        pricePerkegiatan2: 90000,
        variants: [
          {
            variantName: "Hitam Solid (35L)",
            size: "35 Liter",
            color: "Hitam",
            brand: "Eiger",
            unitCodes: ["DP-ER35-01", "DP-ER35-02", "DP-ER35-03"],
          },
          {
            variantName: "Terracotta Orange (35L)",
            size: "35 Liter",
            color: "Orange",
            brand: "Eiger",
            unitCodes: ["DP-ER35-04", "DP-ER35-05", "DP-ER35-06"],
          },
          {
            variantName: "Dark Teal (35L)",
            size: "35 Liter",
            color: "Teal",
            brand: "Eiger",
            unitCodes: ["DP-ER35-07", "DP-ER35-08", "DP-ER35-09"],
          },
        ],
      },
    ],
  },

  // 3. Sleeping Gear
  {
    categoryName: "Sleeping Gear",
    products: [
      {
        name: "Sleeping Bag Bulu Angsa Naturehike CW280",
        description:
          "Kantong tidur bulu angsa ultra hangat dengan rasio kehangatan terhadap bobot terbaik (hanya 570 gram). Suhu kenyamanan 11°C dan batas ekstrem hingga 5°C.",
        itemType: ItemType.rental_unit,
        pricePermalam: 30000,
        pricePerkegiatan1: 75000,
        pricePerkegiatan2: 110000,
        variants: [
          {
            variantName: "Kuning Mustard (M)",
            size: "M (190x72 cm)",
            color: "Kuning",
            brand: "Naturehike",
            unitCodes: ["SB-NC28-01", "SB-NC28-02", "SB-NC28-03"],
          },
          {
            variantName: "Navy Dark (M)",
            size: "M (190x72 cm)",
            color: "Navy",
            brand: "Naturehike",
            unitCodes: ["SB-NC28-04", "SB-NC28-05", "SB-NC28-06"],
          },
          {
            variantName: "Khaki Army (L)",
            size: "L (200x80 cm)",
            color: "Khaki",
            brand: "Naturehike",
            unitCodes: ["SB-NC28-07", "SB-NC28-08", "SB-NC28-09"],
          },
        ],
      },
      {
        name: "Sleeping Bag Polar Dacron Eiger Peak",
        description:
          "Sleeping bag model mummy berlapis dacron 6oz tebal dengan inner polar fleece halus. Menjaga tubuh tetap hangat dan nyaman di perkemahan pegunungan dingin.",
        itemType: ItemType.rental_unit,
        pricePermalam: 20000,
        pricePerkegiatan1: 50000,
        pricePerkegiatan2: 75000,
        variants: [
          {
            variantName: "Merah Maroon",
            size: "All Size (205x75 cm)",
            color: "Merah Maroon",
            brand: "Eiger",
            unitCodes: ["SB-EP-01", "SB-EP-02", "SB-EP-03"],
          },
          {
            variantName: "Biru Dongker",
            size: "All Size (205x75 cm)",
            color: "Biru Dongker",
            brand: "Eiger",
            unitCodes: ["SB-EP-04", "SB-EP-05", "SB-EP-06"],
          },
          {
            variantName: "Charcoal Grey",
            size: "All Size (205x75 cm)",
            color: "Abu Charcoal",
            brand: "Eiger",
            unitCodes: ["SB-EP-07", "SB-EP-08", "SB-EP-09"],
          },
        ],
      },
      {
        name: "Matras Angin Naturehike R-Value 3.5",
        description:
          "Kasur angin tiup tebal 7 cm dengan insulasi thermal R-Value 3.5 untuk menahan dinginnya permukaan tanah berbatu. Dilengkapi pompa kantong tiup praktis.",
        itemType: ItemType.rental_unit,
        pricePermalam: 25000,
        pricePerkegiatan1: 60000,
        pricePerkegiatan2: 90000,
        variants: [
          {
            variantName: "Standard Rectangular - Orange",
            size: "185 x 60 x 7.5 cm",
            color: "Orange",
            brand: "Naturehike",
            unitCodes: ["MA-NH-01", "MA-NH-02", "MA-NH-03"],
          },
          {
            variantName: "Standard Rectangular - Biru",
            size: "185 x 60 x 7.5 cm",
            color: "Biru",
            brand: "Naturehike",
            unitCodes: ["MA-NH-04", "MA-NH-05", "MA-NH-06"],
          },
          {
            variantName: "Mummy Ultralight - Abu",
            size: "180 x 55 x 7.5 cm",
            color: "Abu-abu",
            brand: "Naturehike",
            unitCodes: ["MA-NH-07", "MA-NH-08", "MA-NH-09"],
          },
        ],
      },
    ],
  },

  // 4. Cooking & Dining
  {
    categoryName: "Cooking & Dining",
    products: [
      {
        name: "Nesting Cooking Set DS-308 (4 in 1)",
        description:
          "Set panci dan wajan aluminium anodized anti lengket dengan pegangan tahan panas yang bisa dilipat. Terdiri dari 2 panci, 1 wajan, dan teko air mini.",
        itemType: ItemType.rental_unit,
        pricePermalam: 20000,
        pricePerkegiatan1: 50000,
        pricePerkegiatan2: 75000,
        variants: [
          {
            variantName: "Hitam Anodized (Standar)",
            size: "3-4 Orang",
            color: "Hitam",
            brand: "Alocs/DS",
            unitCodes: ["CK-DS3-01", "CK-DS3-02", "CK-DS3-03"],
          },
          {
            variantName: "Cover Hijau Army",
            size: "3-4 Orang",
            color: "Hijau",
            brand: "Alocs/DS",
            unitCodes: ["CK-DS3-04", "CK-DS3-05", "CK-DS3-06"],
          },
          {
            variantName: "Cover Orange Outdoor",
            size: "3-4 Orang",
            color: "Orange",
            brand: "Alocs/DS",
            unitCodes: ["CK-DS3-07", "CK-DS3-08", "CK-DS3-09"],
          },
        ],
      },
      {
        name: "Kompor Portable Ultralight Kovar Windproof",
        description:
          "Kompor gas camping portabel dengan pelindung api model kelopak bunga yang dapat disesuaikan untuk menahan terpaan angin gunung saat memasak.",
        itemType: ItemType.rental_unit,
        pricePermalam: 15000,
        pricePerkegiatan1: 35000,
        pricePerkegiatan2: 50000,
        variants: [
          {
            variantName: "Model Mawar Pelindung Angin",
            size: "Compact (Kelopak Bunga)",
            color: "Stainless",
            brand: "Kovar",
            unitCodes: ["KP-KV-01", "KP-KV-02", "KP-KV-03"],
          },
          {
            variantName: "Model Kotak Lipat Mini",
            size: "Pocket (Kotak)",
            color: "Merah",
            brand: "Kovar",
            unitCodes: ["KP-KV-04", "KP-KV-05", "KP-KV-06"],
          },
          {
            variantName: "Model Selang Terpisah (Spider)",
            size: "Spider Low Gravity",
            color: "Silver",
            brand: "Kovar",
            unitCodes: ["KP-KV-07", "KP-KV-08", "KP-KV-09"],
          },
        ],
      },
      {
        name: "Set Alat Makan & Cangkir Stainless Camping",
        description:
          "Paket cangkir stainless steel anti karat dengan carabiner handle, piring saji, serta set sendok garpu lipat higienis dalam pouch jaring.",
        itemType: ItemType.rental_unit,
        pricePermalam: 10000,
        pricePerkegiatan1: 25000,
        pricePerkegiatan2: 35000,
        variants: [
          {
            variantName: "Set 2 Person (Cangkir + Sendok Garpu)",
            size: "2 Orang",
            color: "Silver",
            brand: "Dhaulagiri",
            unitCodes: ["DK-DH-01", "DK-DH-02", "DK-DH-03"],
          },
          {
            variantName: "Set 4 Person (Cangkir + Piring + Sendok)",
            size: "4 Orang",
            color: "Silver",
            brand: "Dhaulagiri",
            unitCodes: ["DK-DH-04", "DK-DH-05", "DK-DH-06"],
          },
          {
            variantName: "Set Enamel Vintage Retro",
            size: "2 Orang",
            color: "Putih Motif",
            brand: "Dhaulagiri",
            unitCodes: ["DK-DH-07", "DK-DH-08", "DK-DH-09"],
          },
        ],
      },
    ],
  },

  // 5. Penerangan & Elektronik
  {
    categoryName: "Penerangan & Elektronik",
    products: [
      {
        name: "Headlamp Rechargeable Naturehike 220 Lumens",
        description:
          "Senter kepala LED waterproof IPX4 dengan output 220 lumens dan baterai litium USB rechargeable. Dilengkapi sensor gerak pintar untuk menyalakan lampu tanpa menyentuh tombol.",
        itemType: ItemType.rental_unit,
        pricePermalam: 15000,
        pricePerkegiatan1: 35000,
        pricePerkegiatan2: 50000,
        variants: [
          {
            variantName: "Hitam Solid (Sensor Gerak)",
            size: "Compact (48 gram)",
            color: "Hitam",
            brand: "Naturehike",
            unitCodes: ["HL-NH-01", "HL-NH-02", "HL-NH-03"],
          },
          {
            variantName: "Orange Outdoor (Sensor Gerak)",
            size: "Compact (48 gram)",
            color: "Orange",
            brand: "Naturehike",
            unitCodes: ["HL-NH-04", "HL-NH-05", "HL-NH-06"],
          },
          {
            variantName: "Putih Gading (Sensor Gerak)",
            size: "Compact (48 gram)",
            color: "Putih",
            brand: "Naturehike",
            unitCodes: ["HL-NH-07", "HL-NH-08", "HL-NH-09"],
          },
        ],
      },
      {
        name: "Lentera Tenda LED Retro Camping Lamp",
        description:
          "Lampu lentera gantung bergaya vintage dengan cahaya warm white yang hangat dan dimmer putar. Tahan hingga 15 jam pemakaian nonstop untuk menerangi bagian dalam tenda.",
        itemType: ItemType.rental_unit,
        pricePermalam: 20000,
        pricePerkegiatan1: 45000,
        pricePerkegiatan2: 65000,
        variants: [
          {
            variantName: "Vintage Bronze",
            size: "Tinggi 18 cm",
            color: "Bronze",
            brand: "Barebones Style",
            unitCodes: ["LT-BB-01", "LT-BB-02", "LT-BB-03"],
          },
          {
            variantName: "Army Green Matt",
            size: "Tinggi 18 cm",
            color: "Hijau",
            brand: "Barebones Style",
            unitCodes: ["LT-BB-04", "LT-BB-05", "LT-BB-06"],
          },
          {
            variantName: "Ivory White",
            size: "Tinggi 18 cm",
            color: "Putih",
            brand: "Barebones Style",
            unitCodes: ["LT-BB-07", "LT-BB-08", "LT-BB-09"],
          },
        ],
      },
      {
        name: "Powerbank Outdoor Solar 20.000 mAh Waterproof",
        description:
          "Pengisi daya portabel berkapasitas 20.000 mAh dengan casing tahan banting, panel surya cadangan darurat, dual senter LED, dan port charging tahan percikan air.",
        itemType: ItemType.rental_unit,
        pricePermalam: 25000,
        pricePerkegiatan1: 60000,
        pricePerkegiatan2: 90000,
        variants: [
          {
            variantName: "Hitam Orange (Dual USB)",
            size: "20.000 mAh",
            color: "Orange",
            brand: "Aukey Outdoor",
            unitCodes: ["PB-AK-01", "PB-AK-02", "PB-AK-03"],
          },
          {
            variantName: "Hitam Hijau (Dual USB)",
            size: "20.000 mAh",
            color: "Hijau",
            brand: "Aukey Outdoor",
            unitCodes: ["PB-AK-04", "PB-AK-05", "PB-AK-06"],
          },
          {
            variantName: "Full Black Rugged Armour",
            size: "20.000 mAh",
            color: "Hitam",
            brand: "Aukey Outdoor",
            unitCodes: ["PB-AK-07", "PB-AK-08", "PB-AK-09"],
          },
        ],
      },
    ],
  },

  // 6. Trekking & Navigation
  {
    categoryName: "Trekking & Navigation",
    products: [
      {
        name: "Trekking Pole Antishock Dhaulagiri TP-101",
        description:
          "Tongkat pendakian teleskopik 3 seksi berbahan duralumin alloy 7075 dengan pegangan gabus ergonomis dan peredam kejut antishock untuk melindungi lutut saat turunan curam.",
        itemType: ItemType.rental_unit,
        pricePermalam: 15000,
        pricePerkegiatan1: 35000,
        pricePerkegiatan2: 50000,
        variants: [
          {
            variantName: "Merah Marun Antishock",
            size: "Panjang 65-135 cm",
            color: "Merah",
            brand: "Dhaulagiri",
            unitCodes: ["TP-DH-01", "TP-DH-02", "TP-DH-03"],
          },
          {
            variantName: "Biru Metalik Antishock",
            size: "Panjang 65-135 cm",
            color: "Biru",
            brand: "Dhaulagiri",
            unitCodes: ["TP-DH-04", "TP-DH-05", "TP-DH-06"],
          },
          {
            variantName: "Hitam Doff Antishock",
            size: "Panjang 65-135 cm",
            color: "Hitam",
            brand: "Dhaulagiri",
            unitCodes: ["TP-DH-07", "TP-DH-08", "TP-DH-09"],
          },
        ],
      },
      {
        name: "Trekking Pole Carbon Ultralight Arei",
        description:
          "Tongkat daki premium berbahan 100% serat karbon super enteng (hanya 190 gram per pole) dengan sistem pengunci quick-lock eksternal yang cepat disesuaikan.",
        itemType: ItemType.rental_unit,
        pricePermalam: 25000,
        pricePerkegiatan1: 60000,
        pricePerkegiatan2: 90000,
        variants: [
          {
            variantName: "Carbon Black-Red",
            size: "Panjang 62-135 cm",
            color: "Hitam-Merah",
            brand: "Arei",
            unitCodes: ["TP-AR-01", "TP-AR-02", "TP-AR-03"],
          },
          {
            variantName: "Carbon Black-Blue",
            size: "Panjang 62-135 cm",
            color: "Hitam-Biru",
            brand: "Arei",
            unitCodes: ["TP-AR-04", "TP-AR-05", "TP-AR-06"],
          },
          {
            variantName: "Carbon Black-Gold",
            size: "Panjang 62-135 cm",
            color: "Hitam-Gold",
            brand: "Arei",
            unitCodes: ["TP-AR-07", "TP-AR-08", "TP-AR-09"],
          },
        ],
      },
      {
        name: "Gaiter Pelindung Kaki Waterproof Consina",
        description:
          "Gaiter pelindung betis dan pergelangan kaki dari debu pasir, kerikil tajam, pacet, ranting, dan basah air saat menjelajahi jalur pendakian berat.",
        itemType: ItemType.rental_unit,
        pricePermalam: 10000,
        pricePerkegiatan1: 25000,
        pricePerkegiatan2: 35000,
        variants: [
          {
            variantName: "Hitam Polos",
            size: "All Size (Tinggi 40 cm)",
            color: "Hitam",
            brand: "Consina",
            unitCodes: ["GT-CS-01", "GT-CS-02", "GT-CS-03"],
          },
          {
            variantName: "Kombinasi Hitam Merah",
            size: "All Size (Tinggi 40 cm)",
            color: "Merah",
            brand: "Consina",
            unitCodes: ["GT-CS-04", "GT-CS-05", "GT-CS-06"],
          },
          {
            variantName: "Kombinasi Hitam Biru",
            size: "All Size (Tinggi 40 cm)",
            color: "Biru",
            brand: "Consina",
            unitCodes: ["GT-CS-07", "GT-CS-08", "GT-CS-09"],
          },
        ],
      },
    ],
  },

  // 7. Shoes
  {
    categoryName: "Shoes",
    products: [
      {
        name: "Sepatu Gunung Eiger Pollock Low Cut",
        description:
          "Sepatu trekking bertipe low cut dengan outsole Vibram yang memiliki daya cengkeram optimal pada medan tanah becek, licin, dan batuan terjal.",
        itemType: ItemType.rental_unit,
        pricePermalam: 35000,
        pricePerkegiatan1: 85000,
        pricePerkegiatan2: 130000,
        variants: [
          {
            variantName: "Ukuran 40 (Brown/Black)",
            size: "40",
            color: "Coklat",
            brand: "Eiger",
            unitCodes: ["SH-EP40-01", "SH-EP40-02", "SH-EP40-03"],
          },
          {
            variantName: "Ukuran 41 (Brown/Black)",
            size: "41",
            color: "Coklat",
            brand: "Eiger",
            unitCodes: ["SH-EP41-01", "SH-EP41-02", "SH-EP41-03"],
          },
          {
            variantName: "Ukuran 42 (Brown/Black)",
            size: "42",
            color: "Coklat",
            brand: "Eiger",
            unitCodes: ["SH-EP42-01", "SH-EP42-02", "SH-EP42-03"],
          },
        ],
      },
      {
        name: "Sepatu Gunung SNTA 490 Mid Cut Waterproof",
        description:
          "Sepatu gunung mid cut penopang pergelangan kaki anti terkilir. Dilengkapi membran waterproof tahan basah embun pagi dan bantalan EVA empuk.",
        itemType: ItemType.rental_unit,
        pricePermalam: 30000,
        pricePerkegiatan1: 75000,
        pricePerkegiatan2: 110000,
        variants: [
          {
            variantName: "Ukuran 41 (Grey/Green)",
            size: "41",
            color: "Abu-Hijau",
            brand: "SNTA",
            unitCodes: ["SH-SN41-01", "SH-SN41-02", "SH-SN41-03"],
          },
          {
            variantName: "Ukuran 42 (Grey/Green)",
            size: "42",
            color: "Abu-Hijau",
            brand: "SNTA",
            unitCodes: ["SH-SN42-01", "SH-SN42-02", "SH-SN42-03"],
          },
          {
            variantName: "Ukuran 43 (Grey/Green)",
            size: "43",
            color: "Abu-Hijau",
            brand: "SNTA",
            unitCodes: ["SH-SN43-01", "SH-SN43-02", "SH-SN43-03"],
          },
        ],
      },
      {
        name: "Sepatu Gunung Salomon X Ultra 4 Gore-Tex",
        description:
          "Sepatu hiking kasta tertinggi dengan membran GORE-TEX tahan air 100% dan Advanced Chassis yang memberikan stabilitas superior tanpa membatasi kelenturan kaki.",
        itemType: ItemType.rental_unit,
        pricePermalam: 55000,
        pricePerkegiatan1: 135000,
        pricePerkegiatan2: 200000,
        variants: [
          {
            variantName: "Ukuran 41 (Black/Magnet)",
            size: "41",
            color: "Hitam",
            brand: "Salomon",
            unitCodes: ["SH-SL41-01", "SH-SL41-02", "SH-SL41-03"],
          },
          {
            variantName: "Ukuran 42 (Black/Magnet)",
            size: "42",
            color: "Hitam",
            brand: "Salomon",
            unitCodes: ["SH-SL42-01", "SH-SL42-02", "SH-SL42-03"],
          },
          {
            variantName: "Ukuran 43 (Black/Magnet)",
            size: "43",
            color: "Hitam",
            brand: "Salomon",
            unitCodes: ["SH-SL43-01", "SH-SL43-02", "SH-SL43-03"],
          },
        ],
      },
    ],
  },
];

async function seedDummyCatalog() {
  console.log("🏔️ Mulai pembuatan dummy produk untuk seluruh kategori...");

  const existingCategories = await prisma.category.findMany();
  const categoryMap = new Map(existingCategories.map((c) => [c.name, c.id]));

  let totalProductsCreated = 0;
  let totalVariantsCreated = 0;
  let totalUnitsCreated = 0;

  for (const group of dummyCatalogData) {
    const categoryId = categoryMap.get(group.categoryName);
    if (!categoryId) {
      console.warn(`⚠️ Kategori "${group.categoryName}" tidak ditemukan di database. Dilewati.`);
      continue;
    }

    console.log(`\n📂 Memproses Kategori: ${group.categoryName}...`);

    for (const prodData of group.products) {
      // Cek apakah produk dengan nama serupa sudah ada
      let product = await prisma.product.findFirst({
        where: {
          name: prodData.name,
          categoryId,
          deletedAt: null,
        },
      });

      if (!product) {
        product = await prisma.product.create({
          data: {
            name: prodData.name,
            categoryId,
            description: prodData.description,
            itemType: prodData.itemType,
            pricePermalam: prodData.pricePermalam,
            pricePerkegiatan1: prodData.pricePerkegiatan1,
            pricePerkegiatan2: prodData.pricePerkegiatan2,
            consumableStock: 0,
            isReusable: true,
            isActive: true,
          },
        });
        totalProductsCreated++;
        console.log(`  ➕ Produk dibuat: "${product.name}"`);
      } else {
        console.log(`  ℹ️ Produk sudah ada: "${product.name}"`);
      }

      // Buat varian untuk produk ini
      for (const variantData of prodData.variants) {
        let variant = await prisma.productVariant.findFirst({
          where: {
            productId: product.id,
            variantName: variantData.variantName,
            deletedAt: null,
          },
        });

        if (!variant) {
          variant = await prisma.productVariant.create({
            data: {
              productId: product.id,
              variantName: variantData.variantName,
              size: variantData.size,
              color: variantData.color,
              brand: variantData.brand,
              isActive: true,
            },
          });
          totalVariantsCreated++;
          console.log(`     🔹 Varian dibuat: "${variant.variantName}"`);
        } else {
          console.log(`     ℹ️ Varian sudah ada: "${variant.variantName}"`);
        }

        // Buat inventory unit untuk varian ini
        for (const unitCode of variantData.unitCodes) {
          const existingUnit = await prisma.inventoryUnit.findUnique({
            where: { inventoryCode: unitCode },
          });

          if (!existingUnit) {
            await prisma.inventoryUnit.create({
              data: {
                variantId: variant.id,
                inventoryCode: unitCode,
                unitStatus: UnitStatus.Available,
                conditionNotes: "Kondisi fisik 95% bagus, bersih dan siap pakai.",
                isActive: true,
              },
            });
            totalUnitsCreated++;
          }
        }
      }
    }
  }

  console.log("\n========================================================");
  console.log("✅ SEEDING DUMMY PRODUK SELESAI!");
  console.log(`📦 Produk Baru Dibuat  : ${totalProductsCreated}`);
  console.log(`🏷️ Varian Baru Dibuat  : ${totalVariantsCreated}`);
  console.log(`🔢 Unit Fisik Dibuat   : ${totalUnitsCreated}`);
  console.log("========================================================");
}

seedDummyCatalog()
  .catch((e) => {
    console.error("❌ Error saat seeding dummy catalog:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
