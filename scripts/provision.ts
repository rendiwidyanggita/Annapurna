import { createClient } from "@supabase/supabase-js";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("❌ NEXT_PUBLIC_SUPABASE_URL atau SUPABASE_SERVICE_ROLE_KEY tidak ditemukan!");
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const accountsToProvision = [
  {
    email: "gptgacor1@gmail.com",
    roleName: "OWNER",
    roleMetadata: "owner",
    fullName: "Owner ANNAPURNA",
    phoneNumber: "081200000001",
    address: "Kantor Pusat ANNAPURNA Adventure",
    defaultPassword: "AnnapurnaOwner2026!",
  },
  {
    email: "noname12345445@gmail.com",
    roleName: "ADMIN",
    roleMetadata: "admin",
    fullName: "Staff Admin ANNAPURNA",
    phoneNumber: "081200000002",
    address: "Operasional Toko ANNAPURNA Adventure",
    defaultPassword: "AnnapurnaAdmin2026!",
  },
];

async function main() {
  console.log("🚀 Memulai provisioning akun Owner & Admin...");

  // 1. Ambil role dari database
  const roles = await prisma.role.findMany();
  const roleMap = new Map(roles.map((r) => [r.name.toUpperCase(), r.id]));

  for (const account of accountsToProvision) {
    console.log(`\n--- Memproses ${account.roleName} (${account.email}) ---`);

    const roleId = roleMap.get(account.roleName);
    if (!roleId) {
      console.error(`❌ Role ${account.roleName} tidak ditemukan di tabel roles!`);
      continue;
    }

    // 2. Cek apakah user sudah ada di Supabase Auth
    let authUserId: string | null = null;
    const { data: listData, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listError) {
      console.error(`❌ Gagal mengambil daftar user Supabase:`, listError.message);
      continue;
    }

    const existingAuthUser = listData.users.find((u) => u.email === account.email);

    if (existingAuthUser) {
      console.log(`ℹ️ User ${account.email} sudah ada di Supabase Auth (ID: ${existingAuthUser.id})`);
      authUserId = existingAuthUser.id;

      // Update metadata role jika belum sesuai
      await supabaseAdmin.auth.admin.updateUserById(authUserId, {
        user_metadata: { role: account.roleMetadata },
        email_confirm: true,
      });
    } else {
      console.log(`➕ Membuat user baru di Supabase Auth untuk ${account.email}...`);
      const { data: createData, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: account.email,
        password: account.defaultPassword,
        email_confirm: true,
        user_metadata: { role: account.roleMetadata },
      });

      if (createError) {
        console.error(`❌ Gagal membuat user di Supabase Auth:`, createError.message);
        continue;
      }

      authUserId = createData.user.id;
      console.log(`✅ Berhasil membuat akun Supabase Auth dengan ID: ${authUserId}`);
      console.log(`🔑 Password Default: ${account.defaultPassword}`);
    }

    // 3. Upsert ke tabel `users` Prisma
    console.log(`💾 Sinkronisasi ke tabel users Prisma...`);
    const dbUser = await prisma.user.upsert({
      where: { id: authUserId },
      update: {
        email: account.email,
        roleId: roleId,
        isActive: true,
      },
      create: {
        id: authUserId,
        email: account.email,
        roleId: roleId,
        authProvider: "email",
        isActive: true,
      },
    });

    // 4. Upsert ke tabel `profiles` Prisma (langsung diset isProfileComplete: true)
    console.log(`👤 Sinkronisasi ke tabel profiles Prisma (isProfileComplete: true)...`);
    await prisma.profile.upsert({
      where: { userId: dbUser.id },
      update: {
        fullName: account.fullName,
        phoneNumber: account.phoneNumber,
        address: account.address,
        isProfileComplete: true,
      },
      create: {
        userId: dbUser.id,
        fullName: account.fullName,
        phoneNumber: account.phoneNumber,
        address: account.address,
        isProfileComplete: true,
      },
    });

    console.log(`✨ Selesai provisioning untuk ${account.email}!`);
  }

  console.log("\n🎉 Seluruh provisioning berhasil!");
}

main()
  .catch((e) => {
    console.error("❌ Fatal error saat provisioning:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
