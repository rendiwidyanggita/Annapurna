export const SITE_CONFIG = {
  name: "ANNAPURNA Adventure",
  description: "Sistem Informasi Penyewaan Alat Outdoor Berbasis Website",
  url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  contact: {
    phone: "081234567890",
    address: "Jl. Adventure Outdoor No. 123",
  },
} as const;
