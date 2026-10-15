import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  DashboardBrowsingIcon,
  ShoppingBagIcon,
  Tag01Icon,
  TransactionIcon,
  UserIcon,
  TrendingUpIcon,
  CalendarIcon,
  MoneyBag02Icon,
} from "@hugeicons/core-free-icons";

export default async function AdminDashboardPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard Admin</h1>
        <p className="text-gray-600 mt-1">
          Selamat datang! Monitor performa dan kelola operasional ANNAPURNA Adventure
        </p>
      </div>

      {/* KPI Cards */}
      <Suspense fallback={
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-3">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
            </Card>
          ))}
        </div>
      }>
        <KPICardsWrapper />
      </Suspense>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recent Transactions */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <HugeiconsIcon icon={TransactionIcon} size={20} />
                    Transaksi Terbaru
                  </CardTitle>
                  <CardDescription>
                    Aktivitas transaksi penyewaan terkini
                  </CardDescription>
                </div>
                <Badge variant="secondary" className="text-xs">Coming Soon</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <HugeiconsIcon
                  icon={TransactionIcon}
                  size={48}
                  className="mx-auto text-gray-400 mb-3"
                />
                <p className="font-medium">Fitur Transaksi</p>
                <p className="text-sm">Akan tersedia di Sprint 3</p>
              </div>
            </CardContent>
          </Card>

          {/* Inventory Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HugeiconsIcon icon={ShoppingBagIcon} size={20} />
                Status Unit Inventaris
              </CardTitle>
              <CardDescription>
                Ringkasan kondisi unit rental saat ini
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <HugeiconsIcon
                  icon={ShoppingBagIcon}
                  size={48}
                  className="mx-auto text-gray-400 mb-3"
                />
                <p className="font-medium">Manajemen Unit</p>
                <p className="text-sm">Akan tersedia setelah produk dan kategori selesai</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HugeiconsIcon icon={DashboardBrowsingIcon} size={20} />
                Aksi Cepat
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 gap-3">
                <div className="p-3 border border-dashed border-gray-300 rounded-lg text-center text-sm text-gray-500">
                  <HugeiconsIcon icon={TransactionIcon} size={24} className="mx-auto text-gray-400 mb-1" />
                  <div>Proses Pengambilan</div>
                  <Badge variant="secondary" className="text-xs mt-1">Sprint 3</Badge>
                </div>
                <div className="p-3 border border-dashed border-gray-300 rounded-lg text-center text-sm text-gray-500">
                  <HugeiconsIcon icon={CalendarIcon} size={24} className="mx-auto text-gray-400 mb-1" />
                  <div>Jadwal Hari Ini</div>
                  <Badge variant="secondary" className="text-xs mt-1">Sprint 3</Badge>
                </div>
                <div className="p-3 border border-dashed border-gray-300 rounded-lg text-center text-sm text-gray-500">
                  <HugeiconsIcon icon={MoneyBag02Icon} size={24} className="mx-auto text-gray-400 mb-1" />
                  <div>Laporan Harian</div>
                  <Badge variant="secondary" className="text-xs mt-1">Sprint 4</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* System Status */}
          <Card>
            <CardHeader>
              <CardTitle>Status Sistem</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Database</span>
                <Badge variant="default" className="text-xs">Online</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Auth Service</span>
                <Badge variant="default" className="text-xs">Active</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Payment Gateway</span>
                <Badge variant="secondary" className="text-xs">Not Configured</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">File Storage</span>
                <Badge variant="default" className="text-xs">Ready</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Development Progress */}
          <Card>
            <CardHeader>
              <CardTitle>Progress Development</CardTitle>
              <CardDescription>Sprint 1 - Admin CRUD Foundation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>CRUD Kategori</span>
                  <Badge variant="default" className="text-xs">✓ Done</Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span>CRUD Produk</span>
                  <Badge variant="default" className="text-xs">✓ Done</Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Admin Layout</span>
                  <Badge variant="default" className="text-xs">✓ Done</Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Form Validasi</span>
                  <Badge variant="default" className="text-xs">✓ Done</Badge>
                </div>
              </div>
              <div className="pt-2 border-t">
                <div className="flex justify-between text-sm font-medium">
                  <span>Sprint 1 Progress</span>
                  <span className="text-green-600">100%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                  <div className="bg-green-600 h-2 rounded-full" style={{ width: "100%" }}></div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

async function KPICardsWrapper() {
  const [categoryCount, productCount, activeProductCount] = await Promise.all([
    prisma.category.count({ where: { isActive: true } }),
    prisma.product.count({ where: { deletedAt: null } }),
    prisma.product.count({ where: { deletedAt: null, isActive: true } }),
  ]);

  const kpiData = [
    {
      title: "Total Kategori",
      value: categoryCount.toString(),
      description: "Kategori aktif",
      icon: Tag01Icon,
      trend: "+0% dari bulan lalu",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Total Produk",
      value: productCount.toString(),
      description: "Semua produk",
      icon: ShoppingBagIcon,
      trend: "+0% dari bulan lalu",
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Produk Aktif",
      value: activeProductCount.toString(),
      description: "Tersedia untuk sewa",
      icon: TrendingUpIcon,
      trend: "+0% dari bulan lalu",
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "Transaksi Aktif",
      value: "0",
      description: "Sedang berlangsung",
      icon: TransactionIcon,
      trend: "Fitur belum tersedia",
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {kpiData.map((kpi, index) => (
        <Card key={index}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardDescription className="text-xs font-medium uppercase tracking-wide">
                {kpi.title}
              </CardDescription>
              <div className={`p-2 rounded-lg ${kpi.bgColor}`}>
                <HugeiconsIcon icon={kpi.icon} size={16} className={kpi.color} />
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {kpi.value}
            </div>
            <div className="text-xs text-gray-600">
              {kpi.description}
            </div>
            <div className="text-xs text-gray-500 mt-2">
              {kpi.trend}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
