"use client";

import { useState, useTransition } from "react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Search01Icon,
  ViewIcon,
  Edit02Icon,
  CheckmarkCircle01Icon,
  File01Icon,
  AlertCircleIcon,
} from "@hugeicons/core-free-icons";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { TermsFormModal } from "./terms-form-modal";
import { TermsPreviewModal } from "./terms-preview-modal";
import { activateTermsVersion } from "./actions";

export interface TermsItem {
  id: string;
  version: string;
  content: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  transactionCount: number;
}

interface TermsTableProps {
  terms: TermsItem[];
  addTermsButton?: React.ReactNode;
}

export function TermsTable({ terms, addTermsButton }: TermsTableProps) {
  const [search, setSearch] = useState("");
  const [editingTerms, setEditingTerms] = useState<TermsItem | null>(null);
  const [previewTerms, setPreviewTerms] = useState<TermsItem | null>(null);
  const [isPending, startTransition] = useTransition();
  const [actionMessage, setActionMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const filteredTerms = terms.filter((item) => {
    const q = search.toLowerCase();
    return (
      item.version.toLowerCase().includes(q) ||
      item.content.toLowerCase().includes(q)
    );
  });

  const handleActivate = (id: string, version: string) => {
    if (
      !confirm(
        `Jadikan versi "${version}" sebagai acuan Syarat & Ketentuan aktif? Versi aktif lainnya akan dinonaktifkan.`
      )
    ) {
      return;
    }

    setActionMessage(null);
    startTransition(async () => {
      const res = await activateTermsVersion(id);
      if (res.error) {
        setActionMessage({ type: "error", text: res.error });
      } else if (res.success) {
        setActionMessage({ type: "success", text: res.success });
      }
    });
  };

  return (
    <div className="space-y-4">
      {/* Alert message */}
      {actionMessage && (
        <div
          role="alert"
          className={`rounded-xl p-3.5 text-xs sm:text-sm font-medium flex items-center justify-between border ${
            actionMessage.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-red-50 text-red-800 border-red-200"
          }`}
        >
          <div className="flex items-center gap-2">
            <HugeiconsIcon
              icon={
                actionMessage.type === "success"
                  ? CheckmarkCircle01Icon
                  : AlertCircleIcon
              }
              size={16}
            />
            <span>{actionMessage.text}</span>
          </div>
          <button
            onClick={() => setActionMessage(null)}
            className="text-xs opacity-70 hover:opacity-100"
          >
            ✕
          </button>
        </div>
      )}

      {/* Toolbar: Search & Action Button */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <HugeiconsIcon
            icon={Search01Icon}
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari versi atau teks S&K..."
            className="pl-9 h-9 text-xs"
          />
        </div>

        <div className="flex items-center gap-2">
          {addTermsButton}
        </div>
      </div>

      {/* Table Card */}
      <div className="rounded-xl border border-neutral-200/80 bg-white shadow-xs dark:border-neutral-800 dark:bg-neutral-900 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-neutral-50/70 hover:bg-neutral-50/70 dark:bg-neutral-800/40 dark:hover:bg-neutral-800/40">
              <TableHead className="w-[120px] font-semibold text-xs">Versi</TableHead>
              <TableHead className="w-[110px] font-semibold text-xs">Status</TableHead>
              <TableHead className="font-semibold text-xs">Isi Ringkas</TableHead>
              <TableHead className="w-[130px] font-semibold text-xs text-center">
                Transaksi Terkait
              </TableHead>
              <TableHead className="w-[160px] font-semibold text-xs">
                Tanggal Dibuat
              </TableHead>
              <TableHead className="w-[160px] font-semibold text-xs text-right">
                Aksi
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTerms.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="h-32 text-center text-xs text-muted-foreground"
                >
                  <div className="flex flex-col items-center justify-center gap-1.5">
                    <HugeiconsIcon
                      icon={File01Icon}
                      size={24}
                      className="text-neutral-400"
                    />
                    <p className="font-medium text-neutral-700 dark:text-neutral-300">
                      {search ? "Versi tidak ditemukan" : "Belum ada data Syarat & Ketentuan"}
                    </p>
                    <p className="text-[11px] text-neutral-400">
                      {search
                        ? "Gunakan kata kunci pencarian yang lain."
                        : "Klik tombol 'Buat Versi Baru' untuk menambahkan aturan sewa pertama."}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredTerms.map((item) => {
                const firstLine = item.content.split("\n")[0] || "";
                const previewText =
                  item.content.length > 110
                    ? `${item.content.slice(0, 110)}...`
                    : item.content;

                return (
                  <TableRow
                    key={item.id}
                    className={`text-xs ${
                      item.isActive
                        ? "bg-brand-50/30 dark:bg-brand-950/20"
                        : ""
                    }`}
                  >
                    <TableCell className="font-mono font-bold text-neutral-900 dark:text-white">
                      <div className="flex items-center gap-1.5">
                        <span>{item.version}</span>
                        {item.isActive && (
                          <span
                            className="size-1.5 rounded-full bg-emerald-500 animate-pulse"
                            title="Aktif Saat Ini"
                          />
                        )}
                      </div>
                    </TableCell>

                    <TableCell>
                      {item.isActive ? (
                        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50 text-[10px] font-bold">
                          Aktif
                        </Badge>
                      ) : (
                        <Badge
                          variant="secondary"
                          className="bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400 text-[10px]"
                        >
                          Arsip
                        </Badge>
                      )}
                    </TableCell>

                    <TableCell className="max-w-[340px]">
                      <p className="text-neutral-700 dark:text-neutral-300 truncate font-mono text-[11px]">
                        {firstLine}
                      </p>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {previewText}
                      </p>
                    </TableCell>

                    <TableCell className="text-center">
                      <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 font-medium text-[11px] text-neutral-700 dark:text-neutral-300">
                        {item.transactionCount} order
                      </span>
                    </TableCell>

                    <TableCell className="text-muted-foreground text-[11px]">
                      <div>
                        {format(new Date(item.createdAt), "dd MMM yyyy, HH:mm", {
                          locale: localeId,
                        })}
                      </div>
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-neutral-600 hover:text-neutral-900 dark:text-neutral-400"
                          onClick={() => setPreviewTerms(item)}
                          title="Lihat Pratinjau Teks Lengkap"
                        >
                          <HugeiconsIcon icon={ViewIcon} size={14} />
                          <span className="sr-only">Pratinjau</span>
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-neutral-600 hover:text-neutral-900 dark:text-neutral-400"
                          onClick={() => setEditingTerms(item)}
                          title="Edit Versi Ini"
                        >
                          <HugeiconsIcon icon={Edit02Icon} size={14} />
                          <span className="sr-only">Edit</span>
                        </Button>

                        {!item.isActive && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 px-2 text-[10px] font-semibold text-emerald-700 border-emerald-200 hover:bg-emerald-50 dark:text-emerald-400 dark:border-emerald-900"
                            onClick={() => handleActivate(item.id, item.version)}
                            disabled={isPending}
                          >
                            <HugeiconsIcon
                              icon={CheckmarkCircle01Icon}
                              size={12}
                              className="mr-1"
                            />
                            <span>Aktifkan</span>
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Edit Form Modal */}
      {editingTerms && (
        <TermsFormModal
          open={!!editingTerms}
          onOpenChange={(open) => !open && setEditingTerms(null)}
          terms={editingTerms}
        />
      )}

      {/* Preview Modal */}
      {previewTerms && (
        <TermsPreviewModal
          open={!!previewTerms}
          onOpenChange={(open) => !open && setPreviewTerms(null)}
          terms={previewTerms}
        />
      )}
    </div>
  );
}
