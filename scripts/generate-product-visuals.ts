import fs from "fs";
import path from "path";
import { PrismaClient, MediaType } from "@prisma/client";

const prisma = new PrismaClient();

interface ProductSpec {
  name: string;
  brand: string;
  category: string;
  slug: string;
  iconType: "tent" | "carrier" | "sleeping_bag" | "stove" | "light" | "pole" | "shoe" | "flysheet" | "mat";
  specs: [string, string, string];
  tagline: string;
  secondaryPhotoUrl?: string;
}

const PRODUCTS_DATA: ProductSpec[] = [
  {
    name: "Tenda Dome Eiger Shira 4P",
    brand: "EIGER ADVENTURE",
    category: "Tenda & Shelter",
    slug: "tenda-eiger-shira-4p",
    iconType: "tent",
    specs: ["Kapasitas 4 Orang", "Waterproof 3000mm", "Frame Alloy Duralumin"],
    tagline: "Tenda dome double layer tangguh cuaca ekstrem",
    secondaryPhotoUrl: "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=800&auto=format&fit=crop&q=80",
  },
  {
    name: "Tenda Arei Eliot 2P Ultralight",
    brand: "AREI OUTDOOR GEAR",
    category: "Tenda & Shelter",
    slug: "tenda-arei-eliot-2p",
    iconType: "tent",
    specs: ["Kapasitas 2 Orang", "Bobot 1.8 kg Ultralight", "Vestibule Luas"],
    tagline: "Tenda ultralight ringkas untuk duo pendaki",
    secondaryPhotoUrl: "https://images.unsplash.com/photo-1510312305653-8ed496efae75?w=800&auto=format&fit=crop&q=80",
  },
  {
    name: "Flysheet Waterproof Consina 3x4",
    brand: "CONSINA THE OUTDOOR LIFESTYLE",
    category: "Tenda & Shelter",
    slug: "flysheet-consina-3x4",
    iconType: "flysheet",
    specs: ["Ukuran 3 x 4 Meter", "Bahan Taslan Coating", "19 Titik Loop Pengikat"],
    tagline: "Pelindung shelter anti rembes dan angin",
    secondaryPhotoUrl: "https://images.unsplash.com/photo-1478860409698-8707f313ee8b?w=800&auto=format&fit=crop&q=80",
  },
  {
    name: "Carrier Cozmeed",
    brand: "COZMEED OUTDOOR",
    category: "Carrier & Tas",
    slug: "carrier-cozmeed",
    iconType: "carrier",
    specs: ["Kapasitas 60 Liter", "Ergonomic Backsystem", "Bahan Cordura Ripstop"],
    tagline: "Carrier nyaman dengan sirkulasi udara optimal",
    secondaryPhotoUrl: "https://images.unsplash.com/photo-1551632811-561732d1e306?w=800&auto=format&fit=crop&q=80",
  },
  {
    name: "Carrier Deuter Aircontact 65+10L",
    brand: "DEUTER GERMANY",
    category: "Carrier & Tas",
    slug: "carrier-deuter-aircontact-65",
    iconType: "carrier",
    specs: ["Kapasitas 65+10L", "Aircontact Suspension", "Distribusi Beban Pinggul"],
    tagline: "Ransel ekspedisi heavy-duty teruji dunia",
    secondaryPhotoUrl: "https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?w=800&auto=format&fit=crop&q=80",
  },
  {
    name: "Carrier Osprey Atmos AG 50L",
    brand: "OSPREY PACKS",
    category: "Carrier & Tas",
    slug: "carrier-osprey-atmos-ag-50",
    iconType: "carrier",
    specs: ["Kapasitas 50 Liter", "Anti-Gravity Mesh 3D", "Fit-on-the-Fly Hipbelt"],
    tagline: "Kenyamanan suspensi jaring anti gerah nomor 1",
    secondaryPhotoUrl: "https://images.unsplash.com/photo-1581605405669-fcdf81165afa?w=800&auto=format&fit=crop&q=80",
  },
  {
    name: "Daypack Eiger Rhinos 35L",
    brand: "EIGER ADVENTURE",
    category: "Carrier & Tas",
    slug: "daypack-eiger-rhinos-35",
    iconType: "carrier",
    specs: ["Kapasitas 35 Liter", "Rain Cover Included", "Water Bladder Pocket"],
    tagline: "Ransel lincah pendakian tektok & summit attack",
    secondaryPhotoUrl: "https://images.unsplash.com/photo-1546938576-6e6a64f317cc?w=800&auto=format&fit=crop&q=80",
  },
  {
    name: "Sleeping Bag Bulu Angsa Naturehike CW280",
    brand: "NATUREHIKE OUTDOORS",
    category: "Sleeping Gear",
    slug: "sb-naturehike-cw280-goose-down",
    iconType: "sleeping_bag",
    specs: ["Isi Bulu Angsa Asli", "Bobot Ultra 570 Gram", "Comfort 11°C / Limit 5°C"],
    tagline: "Kantong tidur bulu angsa ultra hangat & compact",
    secondaryPhotoUrl: "https://images.unsplash.com/photo-1517824806704-9040b037703b?w=800&auto=format&fit=crop&q=80",
  },
  {
    name: "Sleeping Bag Polar Dacron Eiger Peak",
    brand: "EIGER ADVENTURE",
    category: "Sleeping Gear",
    slug: "sb-eiger-peak-polar-dacron",
    iconType: "sleeping_bag",
    specs: ["Lapisan Dacron 6oz Tebal", "Inner Polar Fleece Lembut", "Model Mummy Hangat"],
    tagline: "Insulasi ganda menjaga tidur lelap di gunung",
    secondaryPhotoUrl: "https://images.unsplash.com/photo-1517824806704-9040b037703b?w=800&auto=format&fit=crop&q=80",
  },
  {
    name: "Matras Angin Naturehike R-Value 3.5",
    brand: "NATUREHIKE OUTDOORS",
    category: "Sleeping Gear",
    slug: "matras-naturehike-rvalue-35",
    iconType: "mat",
    specs: ["Tebal Nyaman 7.5 cm", "Insulasi R-Value 3.5", "Bahan Nylon TPU Kuat"],
    tagline: "Isolasi thermal tanah berbatu dingin anti pegal",
    secondaryPhotoUrl: "https://images.unsplash.com/photo-1587547131116-a0655a526190?w=800&auto=format&fit=crop&q=80",
  },
  {
    name: "Nesting Cooking Set DS-308 (4 in 1)",
    brand: "ALOCS / DS OUTDOOR",
    category: "Cooking & Dining",
    slug: "nesting-set-ds308-4in1",
    iconType: "stove",
    specs: ["2 Panci + 1 Wajan + Teko", "Hard-Anodized Aluminium", "Handle Lipat Tahan Panas"],
    tagline: "Paket lengkap masak outdoor anti lengket",
    secondaryPhotoUrl: "https://images.unsplash.com/photo-1526772662000-3f88f10405ff?w=800&auto=format&fit=crop&q=80",
  },
  {
    name: "Kompor Portable Ultralight Kovar Windproof",
    brand: "KOVAR STOVES",
    category: "Cooking & Dining",
    slug: "kompor-kovar-windproof",
    iconType: "stove",
    specs: ["Pelindung Api Bunga Mawar", "Pemantik Piezo Elektrik", "Bisa Tabung Gas Kaleng"],
    tagline: "Api stabil tahan hembusan angin kencang",
    secondaryPhotoUrl: "https://images.unsplash.com/photo-1525811902-f2342640856e?w=800&auto=format&fit=crop&q=80",
  },
  {
    name: "Set Alat Makan & Cangkir Stainless Camping",
    brand: "DHAULAGIRI GEAR",
    category: "Cooking & Dining",
    slug: "alat-makan-stainless-dhaulagiri",
    iconType: "stove",
    specs: ["Food Grade Stainless 304", "Carabiner Handle Cangkir", "Pouch Jaring Praktis"],
    tagline: "Peralatan makan camping higienis anti karat",
    secondaryPhotoUrl: "https://images.unsplash.com/photo-1533240332313-0db49b459ad6?w=800&auto=format&fit=crop&q=80",
  },
  {
    name: "Headlamp Rechargeable Naturehike 220 Lumens",
    brand: "NATUREHIKE OUTDOORS",
    category: "Penerangan & Elektronik",
    slug: "headlamp-naturehike-220lm",
    iconType: "light",
    specs: ["Output 220 Lumens", "Smart Wave Gesture Sensor", "USB Rechargeable Li-ion"],
    tagline: "Senter kepala sensor tangan bebas sentuh",
    secondaryPhotoUrl: "https://images.unsplash.com/photo-1517411032315-54ef2cb783bb?w=800&auto=format&fit=crop&q=80",
  },
  {
    name: "Lentera Tenda LED Retro Camping Lamp",
    brand: "BAREBONES STYLE",
    category: "Penerangan & Elektronik",
    slug: "lentera-tenda-led-retro",
    iconType: "light",
    specs: ["Cahaya Warm White Hangat", "Stepless Dimmer Putar", "Tahan 15 Jam Pemakaian"],
    tagline: "Lampu gantung antik pencipta suasana syahdu",
    secondaryPhotoUrl: "https://images.unsplash.com/photo-1517411032315-54ef2cb783bb?w=800&auto=format&fit=crop&q=80",
  },
  {
    name: "Powerbank Outdoor Solar 20.000 mAh Waterproof",
    brand: "AUKEY RUGGED",
    category: "Penerangan & Elektronik",
    slug: "powerbank-solar-20000mah",
    iconType: "light",
    specs: ["Kapasitas 20.000 mAh", "Solar Cell Darurat", "Waterproof IP65 + Dual LED"],
    tagline: "Cadangan daya badak tahan benturan dan hujan",
    secondaryPhotoUrl: "https://images.unsplash.com/photo-1517411032315-54ef2cb783bb?w=800&auto=format&fit=crop&q=80",
  },
  {
    name: "Trekking Pole Antishock Dhaulagiri TP-101",
    brand: "DHAULAGIRI GEAR",
    category: "Trekking & Navigation",
    slug: "trekking-pole-dhaulagiri-tp101",
    iconType: "pole",
    specs: ["Duralumin Alloy 7075", "Antishock Spring Redam Lutut", "Pegangan Gabus Ergonomis"],
    tagline: "Menjaga stabilitas lutut saat turunan curam",
    secondaryPhotoUrl: "https://images.unsplash.com/photo-1501555088652-021faa106b9b?w=800&auto=format&fit=crop&q=80",
  },
  {
    name: "Trekking Pole Carbon Ultralight Arei",
    brand: "AREI OUTDOOR GEAR",
    category: "Trekking & Navigation",
    slug: "trekking-pole-arei-carbon",
    iconType: "pole",
    specs: ["100% Serat Karbon", "Bobot Enteng 190 Gram", "External Quick-Lock"],
    tagline: "Tongkat daki carbon ultra kuat dan ringan",
    secondaryPhotoUrl: "https://images.unsplash.com/photo-1501555088652-021faa106b9b?w=800&auto=format&fit=crop&q=80",
  },
  {
    name: "Gaiter Pelindung Kaki Waterproof Consina",
    brand: "CONSINA THE OUTDOOR LIFESTYLE",
    category: "Trekking & Navigation",
    slug: "gaiter-consina-waterproof",
    iconType: "shoe",
    specs: ["Bahan Oxford Waterproof", "Tali Pengait Sol Baja", "Velcro & Karet Rapat"],
    tagline: "Lindungi kaki dari kerikil, debu, pacet & ranting",
    secondaryPhotoUrl: "https://images.unsplash.com/photo-1551107696-a4b085a6d966?w=800&auto=format&fit=crop&q=80",
  },
  {
    name: "Sepatu Gunung Eiger Pollock Low Cut",
    brand: "EIGER ADVENTURE",
    category: "Shoes",
    slug: "sepatu-eiger-pollock-low",
    iconType: "shoe",
    specs: ["Model Low Cut Fleksibel", "Outsole Vibram Grip Kasar", "Upper Breathable Mesh"],
    tagline: "Sepatu trail ringan dengan cengkeraman maksimal",
    secondaryPhotoUrl: "https://images.unsplash.com/photo-1551107696-a4b085a6d966?w=800&auto=format&fit=crop&q=80",
  },
  {
    name: "Sepatu Gunung SNTA 490 Mid Cut Waterproof",
    brand: "SNTA FOOTWEAR",
    category: "Shoes",
    slug: "sepatu-snta-490-mid",
    iconType: "shoe",
    specs: ["Model Mid Cut Pelindung Engkel", "Waterproof Membrane", "Toe Cap Pelindung Jari"],
    tagline: "Perlindungan kokoh untuk medan berbatu dan licin",
    secondaryPhotoUrl: "https://images.unsplash.com/photo-1551107696-a4b085a6d966?w=800&auto=format&fit=crop&q=80",
  },
  {
    name: "Sepatu Gunung Salomon X Ultra 4 Gore-Tex",
    brand: "SALOMON OUTDOOR",
    category: "Shoes",
    slug: "sepatu-salomon-xultra4-gtx",
    iconType: "shoe",
    specs: ["Gore-Tex Waterproof Asli", "Contagrip MA Sole", "ADV-C Chassis Stabilitas"],
    tagline: "Sepatu gunung kasta tertinggi kenyamanan ekstrem",
    secondaryPhotoUrl: "https://images.unsplash.com/photo-1551107696-a4b085a6d966?w=800&auto=format&fit=crop&q=80",
  },
];

// Returns SVG path string for icon based on type
function getIconSvg(type: ProductSpec["iconType"]): string {
  switch (type) {
    case "tent":
      return `
        <!-- Tent Silhouette -->
        <path d="M400 160 L240 370 L560 370 Z" fill="none" stroke="#25D366" stroke-width="8" stroke-linejoin="round" />
        <path d="M400 160 L400 370" stroke="#10B981" stroke-width="5" stroke-dasharray="8 6" />
        <path d="M340 370 L400 240 L460 370" fill="none" stroke="#6EE7B7" stroke-width="6" stroke-linejoin="round" />
        <circle cx="400" cy="155" r="8" fill="#F59E0B" />
        <line x1="210" y1="370" x2="590" y2="370" stroke="#34D399" stroke-width="6" stroke-linecap="round" />
      `;
    case "carrier":
      return `
        <!-- Backpack Silhouette -->
        <rect x="330" y="170" width="140" height="190" rx="28" fill="none" stroke="#25D366" stroke-width="8" />
        <rect x="345" y="150" width="110" height="40" rx="14" fill="none" stroke="#10B981" stroke-width="6" />
        <rect x="320" y="240" width="160" height="90" rx="18" fill="none" stroke="#6EE7B7" stroke-width="6" />
        <path d="M305 200 C305 200, 280 230, 310 320" stroke="#34D399" stroke-width="7" stroke-linecap="round" fill="none" />
        <path d="M495 200 C495 200, 520 230, 490 320" stroke="#34D399" stroke-width="7" stroke-linecap="round" fill="none" />
        <line x1="360" y1="285" x2="440" y2="285" stroke="#F59E0B" stroke-width="5" stroke-linecap="round" />
      `;
    case "sleeping_bag":
      return `
        <!-- Sleeping Bag Silhouette -->
        <path d="M340 160 C340 140, 460 140, 460 160 L445 350 C445 375, 355 375, 355 350 Z" fill="none" stroke="#25D366" stroke-width="8" stroke-linejoin="round" />
        <ellipse cx="400" cy="175" rx="35" ry="20" fill="none" stroke="#6EE7B7" stroke-width="6" />
        <path d="M352 230 Q400 240 448 230" fill="none" stroke="#10B981" stroke-width="5" />
        <path d="M353 280 Q400 290 447 280" fill="none" stroke="#10B981" stroke-width="5" />
        <path d="M355 330 Q400 340 445 330" fill="none" stroke="#10B981" stroke-width="5" />
        <circle cx="400" cy="175" r="8" fill="#F59E0B" />
      `;
    case "mat":
      return `
        <!-- Air Mat Silhouette -->
        <rect x="310" y="160" width="180" height="210" rx="20" fill="none" stroke="#25D366" stroke-width="8" />
        <line x1="330" y1="205" x2="470" y2="205" stroke="#10B981" stroke-width="6" stroke-linecap="round" />
        <line x1="330" y1="245" x2="470" y2="245" stroke="#6EE7B7" stroke-width="6" stroke-linecap="round" />
        <line x1="330" y1="285" x2="470" y2="285" stroke="#10B981" stroke-width="6" stroke-linecap="round" />
        <line x1="330" y1="325" x2="470" y2="325" stroke="#6EE7B7" stroke-width="6" stroke-linecap="round" />
        <circle cx="460" cy="180" r="7" fill="#F59E0B" />
      `;
    case "flysheet":
      return `
        <!-- Flysheet Silhouette -->
        <polygon points="400,160 560,250 400,340 240,250" fill="none" stroke="#25D366" stroke-width="8" stroke-linejoin="round" />
        <line x1="400" y1="160" x2="400" y2="340" stroke="#F59E0B" stroke-width="6" />
        <line x1="240" y1="250" x2="560" y2="250" stroke="#10B981" stroke-width="5" stroke-dasharray="6 4" />
        <circle cx="400" cy="160" r="6" fill="#6EE7B7" />
        <circle cx="560" cy="250" r="6" fill="#6EE7B7" />
        <circle cx="400" cy="340" r="6" fill="#6EE7B7" />
        <circle cx="240" cy="250" r="6" fill="#6EE7B7" />
      `;
    case "stove":
      return `
        <!-- Cooking Pot / Stove Silhouette -->
        <ellipse cx="400" cy="230" rx="80" ry="25" fill="none" stroke="#25D366" stroke-width="8" />
        <path d="M320 230 L320 310 C320 340, 480 340, 480 310 L480 230" fill="none" stroke="#25D366" stroke-width="8" />
        <line x1="300" y1="240" x2="320" y2="240" stroke="#6EE7B7" stroke-width="7" stroke-linecap="round" />
        <line x1="480" y1="240" x2="500" y2="240" stroke="#6EE7B7" stroke-width="7" stroke-linecap="round" />
        <!-- Fire flame below -->
        <path d="M400 370 Q415 350 400 330 Q385 350 400 370 Z" fill="#F59E0B" stroke="#D97706" stroke-width="2" />
        <path d="M370 370 Q380 355 370 340 Q360 355 370 370 Z" fill="#EF4444" />
        <path d="M430 370 Q440 355 430 340 Q420 355 430 370 Z" fill="#EF4444" />
      `;
    case "light":
      return `
        <!-- Lantern / Headlamp Silhouette -->
        <rect x="340" y="210" width="120" height="110" rx="18" fill="none" stroke="#25D366" stroke-width="8" />
        <path d="M355 210 L370 170 L430 170 L445 210" fill="none" stroke="#6EE7B7" stroke-width="6" />
        <circle cx="400" cy="150" r="16" fill="none" stroke="#F59E0B" stroke-width="6" />
        <circle cx="400" cy="265" r="26" fill="#FEF08A" stroke="#F59E0B" stroke-width="4" />
        <line x1="330" y1="320" x2="470" y2="320" stroke="#10B981" stroke-width="8" stroke-linecap="round" />
      `;
    case "pole":
      return `
        <!-- Trekking Poles Silhouette -->
        <line x1="350" y1="150" x2="385" y2="370" stroke="#25D366" stroke-width="8" stroke-linecap="round" />
        <rect x="338" y="150" width="22" height="60" rx="6" fill="#F59E0B" transform="rotate(9 349 180)" />
        <line x1="450" y1="150" x2="415" y2="370" stroke="#6EE7B7" stroke-width="8" stroke-linecap="round" />
        <rect x="440" y="150" width="22" height="60" rx="6" fill="#F59E0B" transform="rotate(-9 451 180)" />
        <circle cx="385" cy="355" r="14" fill="none" stroke="#10B981" stroke-width="5" />
        <circle cx="415" cy="355" r="14" fill="none" stroke="#10B981" stroke-width="5" />
      `;
    case "shoe":
      return `
        <!-- Hiking Shoe Silhouette -->
        <path d="M300 320 C320 320, 350 250, 410 250 C440 250, 480 270, 500 300 C505 310, 500 340, 480 340 L310 340 C290 340, 280 320, 300 320 Z" fill="none" stroke="#25D366" stroke-width="8" stroke-linejoin="round" />
        <path d="M370 250 L360 210 L420 210 L430 250" fill="none" stroke="#6EE7B7" stroke-width="7" stroke-linecap="round" />
        <line x1="295" y1="352" x2="495" y2="352" stroke="#F59E0B" stroke-width="10" stroke-linecap="round" stroke-dasharray="16 8" />
        <circle cx="385" cy="275" r="5" fill="#34D399" />
        <circle cx="415" cy="285" r="5" fill="#34D399" />
      `;
    default:
      return `<circle cx="400" cy="260" r="60" fill="none" stroke="#25D366" stroke-width="8" />`;
  }
}

function generateSvgCard(product: ProductSpec): string {
  const iconMarkup = getIconSvg(product.iconType);

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="800" height="600" viewBox="0 0 800 600" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- Background Gradient -->
    <linearGradient id="bgGrad" x1="0" y1="0" x2="800" y2="600" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#071913"/>
      <stop offset="60%" stop-color="#0D2E24"/>
      <stop offset="100%" stop-color="#144637"/>
    </linearGradient>

    <!-- Radial Center Glow -->
    <radialGradient id="centerGlow" cx="400" cy="260" r="220" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#10B981" stop-opacity="0.22"/>
      <stop offset="60%" stop-color="#059669" stop-opacity="0.08"/>
      <stop offset="100%" stop-color="#059669" stop-opacity="0"/>
    </radialGradient>

    <!-- Card Glass Border Gradient -->
    <linearGradient id="cardBorder" x1="0" y1="0" x2="800" y2="600" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#34D399" stop-opacity="0.6"/>
      <stop offset="100%" stop-color="#064E3B" stop-opacity="0.2"/>
    </linearGradient>
  </defs>

  <!-- Background Base -->
  <rect width="800" height="600" fill="url(#bgGrad)"/>

  <!-- Topographic Contour Lines -->
  <g opacity="0.18" stroke="#34D399" stroke-width="1.5" fill="none">
    <ellipse cx="400" cy="260" rx="360" ry="210" />
    <ellipse cx="400" cy="260" rx="290" ry="165" />
    <ellipse cx="400" cy="260" rx="220" ry="120" />
    <path d="M-50 150 Q200 80 400 130 T850 90" />
    <path d="M-50 480 Q200 420 400 460 T850 430" />
    <path d="M-50 530 Q250 490 450 520 T850 500" />
  </g>

  <!-- Mountain Silhouette in Lower Area -->
  <polygon points="-50,560 120,440 280,560" fill="#0A231C" opacity="0.6" />
  <polygon points="520,560 680,420 850,560" fill="#0A231C" opacity="0.6" />

  <!-- Center Ambient Glow -->
  <circle cx="400" cy="260" r="200" fill="url(#centerGlow)"/>

  <!-- Outer Rounded Border Frame -->
  <rect x="16" y="16" width="768" height="568" rx="24" fill="none" stroke="url(#cardBorder)" stroke-width="2"/>

  <!-- ── TOP BAR: Brand & Category ── -->
  <!-- Brand Badge Left -->
  <g transform="translate(48, 48)">
    <rect width="260" height="38" rx="10" fill="#064E3B" fill-opacity="0.8" stroke="#10B981" stroke-width="1"/>
    <circle cx="20" cy="19" r="5" fill="#F59E0B"/>
    <text x="36" y="24" fill="#E7F3EE" font-family="system-ui, -apple-system, sans-serif" font-size="12" font-weight="700" letter-spacing="1.5">${escapeXml(product.brand)}</text>
  </g>

  <!-- Category Badge Right -->
  <g transform="translate(520, 48)">
    <rect width="232" height="38" rx="10" fill="#052E24" fill-opacity="0.9" stroke="#34D399" stroke-width="1"/>
    <text x="116" y="24" fill="#A7F3D0" font-family="system-ui, -apple-system, sans-serif" font-size="12" font-weight="600" text-anchor="middle" letter-spacing="1">${escapeXml(product.category.toUpperCase())}</text>
  </g>

  <!-- ── CENTER: Equipment Icon & Visual ── -->
  <g id="gearIcon">
    ${iconMarkup}
  </g>

  <!-- ── BOTTOM: Product Details Box ── -->
  <g transform="translate(48, 400)">
    <!-- Bottom Container Card -->
    <rect width="704" height="152" rx="18" fill="#062820" fill-opacity="0.85" stroke="#10B981" stroke-width="1.2"/>

    <!-- Product Name (Bold, High Contrast) -->
    <text x="24" y="40" fill="#FFFFFF" font-family="system-ui, -apple-system, sans-serif" font-size="22" font-weight="800" letter-spacing="0.2">
      ${escapeXml(product.name)}
    </text>

    <!-- Tagline -->
    <text x="24" y="66" fill="#9CA3AF" font-family="system-ui, -apple-system, sans-serif" font-size="13" font-weight="500">
      ${escapeXml(product.tagline)}
    </text>

    <!-- 3 Specs Badges -->
    <g transform="translate(24, 88)">
      <!-- Spec 1 -->
      <g>
        <rect width="190" height="28" rx="7" fill="#0B382C" stroke="#22543D" stroke-width="1"/>
        <text x="95" y="18" fill="#E2E8F0" font-family="system-ui, -apple-system, sans-serif" font-size="11" font-weight="600" text-anchor="middle">
          ${escapeXml(product.specs[0])}
        </text>
      </g>
      <!-- Spec 2 -->
      <g transform="translate(202, 0)">
        <rect width="220" height="28" rx="7" fill="#0B382C" stroke="#22543D" stroke-width="1"/>
        <text x="110" y="18" fill="#E2E8F0" font-family="system-ui, -apple-system, sans-serif" font-size="11" font-weight="600" text-anchor="middle">
          ${escapeXml(product.specs[1])}
        </text>
      </g>
      <!-- Spec 3 -->
      <g transform="translate(434, 0)">
        <rect width="222" height="28" rx="7" fill="#0B382C" stroke="#22543D" stroke-width="1"/>
        <text x="111" y="18" fill="#E2E8F0" font-family="system-ui, -apple-system, sans-serif" font-size="11" font-weight="600" text-anchor="middle">
          ${escapeXml(product.specs[2])}
        </text>
      </g>
    </g>

    <!-- Footer Watermark inside card -->
    <text x="680" y="136" fill="#10B981" font-family="system-ui, -apple-system, sans-serif" font-size="9" font-weight="700" text-anchor="end" letter-spacing="1" opacity="0.8">
      ANNAPURNA ADVENTURE · SEWA ALAT OUTDOOR
    </text>
  </g>
</svg>
`;
}

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

async function main() {
  console.log("🎨 Starting dedicated product visuals generation...");

  const outputDir = path.join(process.cwd(), "public", "images", "products");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // 1. Generate SVGs on disk
  for (const item of PRODUCTS_DATA) {
    const svgContent = generateSvgCard(item);
    const filePath = path.join(outputDir, `${item.slug}.svg`);
    fs.writeFileSync(filePath, svgContent, "utf-8");
    console.log(`✅ Generated SVG: ${item.slug}.svg`);
  }

  // 2. Fetch all products from DB and attach media
  const dbProducts = await prisma.product.findMany();
  console.log(`Found ${dbProducts.length} products in DB.`);

  for (const dbProduct of dbProducts) {
    // Find matching spec
    const spec = PRODUCTS_DATA.find(
      (p) =>
        p.name.toLowerCase().trim() === dbProduct.name.toLowerCase().trim() ||
        dbProduct.name.toLowerCase().includes(p.name.toLowerCase()) ||
        p.name.toLowerCase().includes(dbProduct.name.toLowerCase())
    );

    if (!spec) {
      console.warn(`No visual spec found for product: ${dbProduct.name}`);
      continue;
    }

    // Clear existing media to eliminate incorrect dummy pictures (e.g. burger)
    await prisma.productMedia.deleteMany({
      where: { productId: dbProduct.id },
    });

    const primarySvgUrl = `/images/products/${spec.slug}.svg`;

    // 1st Media: Branded Visual Card (Primary)
    await prisma.productMedia.create({
      data: {
        productId: dbProduct.id,
        mediaType: MediaType.image,
        mediaUrl: primarySvgUrl,
        storagePath: `products/${spec.slug}.svg`,
        altText: `${dbProduct.name} - ${spec.brand}`,
        sortOrder: 0,
        isPrimary: true,
      },
    });

    // 2nd Media: Verified Outdoor Photo (if available)
    if (spec.secondaryPhotoUrl) {
      await prisma.productMedia.create({
        data: {
          productId: dbProduct.id,
          mediaType: MediaType.image,
          mediaUrl: spec.secondaryPhotoUrl,
          storagePath: `products/${spec.slug}-outdoor.jpg`,
          altText: `Foto Pemakaian Outdoor ${dbProduct.name}`,
          sortOrder: 1,
          isPrimary: false,
        },
      });
    }

    // 3rd Media: Detail Card Angle
    await prisma.productMedia.create({
      data: {
        productId: dbProduct.id,
        mediaType: MediaType.image,
        mediaUrl: primarySvgUrl,
        storagePath: `products/${spec.slug}-detail.svg`,
        altText: `Spesifikasi Unit ${dbProduct.name}`,
        sortOrder: 2,
        isPrimary: false,
      },
    });

    console.log(`✅ Seeded 3 clean media items for: ${dbProduct.name}`);
  }

  console.log("🎉 All product visuals generated and seeded successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Error generating product visuals:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
