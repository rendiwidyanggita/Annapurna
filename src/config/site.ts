export const SITE_CONFIG = {
  name: "ANNAPURNA Adventure",
  description: "Sistem Informasi Penyewaan Alat Outdoor Berbasis Website",
  url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  contact: {
    phone: "+6289634696969",
    whatsapp: "+6289634696969",
    whatsappUrl: "https://wa.me/6289634696969",
    instagram: "annapurna_rent",
    instagramUrl: "https://www.instagram.com/annapurna_rent/",
    address:
      "Jl. Kampus No 8-9, Grendeng, Purwokerto Utara, Purwokerto, Jawa Tengah 53122",
  },
} as const;
