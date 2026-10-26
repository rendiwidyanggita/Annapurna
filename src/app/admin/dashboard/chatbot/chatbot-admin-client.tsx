"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { AdminKpiCard } from "@/components/molecules/admin-kpi-card";
import {
  saveKnowledgeBaseAction,
  toggleKnowledgeBaseStatusAction,
  deleteKnowledgeBaseAction,
} from "./actions";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  BubbleChatIcon,
  CheckmarkCircle01Icon,
  Cancel01Icon,
  FilterIcon,
  Search01Icon,
  PlusSignIcon,
  AlertCircleIcon,
  Edit01Icon,
  Delete02Icon,
} from "@hugeicons/core-free-icons";
import { toast } from "sonner";

interface KBItem {
  id: string;
  topic: string;
  questionPattern: string | null;
  answer: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  _count: {
    messages: number;
  };
}

interface ChatbotAdminClientProps {
  initialItems: KBItem[];
}

export function ChatbotAdminClient({ initialItems }: ChatbotAdminClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [search, setSearch] = useState("");
  const [editingItem, setEditingItem] = useState<KBItem | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Form states
  const [topic, setTopic] = useState("");
  const [questionPattern, setQuestionPattern] = useState("");
  const [answer, setAnswer] = useState("");
  const [isActive, setIsActive] = useState(true);

  // Pattern tester state
  const [testQuery, setTestQuery] = useState("");
  const [testResult, setTestResult] = useState<boolean | null>(null);

  const filteredItems = initialItems.filter((item) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      item.topic.toLowerCase().includes(q) ||
      (item.questionPattern && item.questionPattern.toLowerCase().includes(q)) ||
      item.answer.toLowerCase().includes(q)
    );
  });

  const totalActive = initialItems.filter((i) => i.isActive).length;
  const totalReferences = initialItems.reduce((acc, i) => acc + i._count.messages, 0);

  const openCreateModal = () => {
    setEditingItem(null);
    setTopic("");
    setQuestionPattern("");
    setAnswer("");
    setIsActive(true);
    setTestQuery("");
    setTestResult(null);
    setIsCreating(true);
  };

  const openEditModal = (item: KBItem) => {
    setEditingItem(item);
    setTopic(item.topic);
    setQuestionPattern(item.questionPattern || "");
    setAnswer(item.answer);
    setIsActive(item.isActive);
    setTestQuery("");
    setTestResult(null);
    setIsCreating(true);
  };

  const closeModal = () => {
    setIsCreating(false);
    setEditingItem(null);
  };

  const handleTestPattern = () => {
    if (!questionPattern.trim() || !testQuery.trim()) {
      setTestResult(null);
      return;
    }
    try {
      const regex = new RegExp(questionPattern, "i");
      setTestResult(regex.test(testQuery));
    } catch {
      toast.error("Format regex tidak valid.");
      setTestResult(false);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) {
      toast.error("Topik wajib diisi.");
      return;
    }
    if (!answer.trim()) {
      toast.error("Jawaban panduan wajib diisi.");
      return;
    }

    startTransition(async () => {
      try {
        await saveKnowledgeBaseAction({
          id: editingItem?.id,
          topic: topic.trim(),
          questionPattern: questionPattern.trim() || null,
          answer: answer.trim(),
          isActive,
        });
        toast.success(
          editingItem ? "Knowledge Base berhasil diperbarui" : "Knowledge Base berhasil dibuat"
        );
        closeModal();
        router.refresh();
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Gagal menyimpan entri.";
        toast.error(msg);
      }
    });
  };

  const handleToggleStatus = (id: string, currentStatus: boolean, topicName: string) => {
    startTransition(async () => {
      try {
        await toggleKnowledgeBaseStatusAction(id);
        toast.success(`Status ${topicName} berhasil diubah.`);
        router.refresh();
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Gagal mengubah status.";
        toast.error(msg);
      }
    });
  };

  const handleDelete = (id: string, topicName: string) => {
    if (!confirm(`Hapus entri "${topicName}" dari Knowledge Base?`)) return;

    startTransition(async () => {
      try {
        await deleteKnowledgeBaseAction(id);
        toast.success(`Entri "${topicName}" berhasil dihapus.`);
        router.refresh();
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Gagal menghapus entri.";
        toast.error(msg);
      }
    });
  };

  return (
    <div className="space-y-6 pb-12">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
            Knowledge Base Chatbot AI (AA-99)
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            Kelola rujukan jawaban resmi, pola regex pertanyaan, dan panduan AI Customer Service.
          </p>
        </div>

        <Button
          onClick={openCreateModal}
          size="sm"
          className="h-9 text-xs bg-[#16624B] hover:bg-[#0F4F3C] text-white font-semibold flex items-center gap-2 shrink-0"
        >
          <HugeiconsIcon icon={PlusSignIcon} size={15} />
          <span>Tambah Entri KB</span>
        </Button>
      </div>

      {/* ── KPI Strip ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <AdminKpiCard
          label="Total Topik KB"
          value={initialItems.length}
          icon={BubbleChatIcon}
          iconColorVariant="neutral"
          subtext="Entri informasi terdaftar"
        />
        <AdminKpiCard
          label="Topik Aktif"
          value={totalActive}
          icon={CheckmarkCircle01Icon}
          iconColorVariant="emerald"
          subtext="Siap disajikan oleh AI"
        />
        <AdminKpiCard
          label="Total Rujukan Pesan"
          value={totalReferences}
          icon={BubbleChatIcon}
          iconColorVariant="blue"
          subtext="Jawaban dipakai dalam percakapan"
        />
      </div>

      {/* ── Search & Filter Bar ── */}
      <div className="bg-white p-3.5 rounded-xl border border-[#E5E7EB] shadow-2xs flex items-center gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Cari topik, pola regex kata kunci, atau teks jawaban..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs pl-8 pr-3 py-1.5 rounded-lg border border-gray-300 focus:outline-none focus:border-[#16624B]"
          />
          <HugeiconsIcon
            icon={Search01Icon}
            size={14}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"
          />
        </div>
        {search && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setSearch("")}
            className="h-8 text-xs border-gray-300 text-gray-600"
          >
            Reset
          </Button>
        )}
      </div>

      {/* ── Knowledge Base Table ── */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#F9FAFB] border-b border-[#E5E7EB] text-gray-600 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4 w-1/4">Topik & Pola Kata Kunci</th>
                <th className="py-3 px-4 w-1/2">Jawaban Panduan Resmi</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Rujukan</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gray-400">
                    <p className="font-semibold text-gray-700 mb-1">Tidak ada entri ditemukan</p>
                    <p className="text-[11px]">Tambahkan topik baru atau sesuaikan pencarian.</p>
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="py-3 px-4 align-top">
                      <p className="font-bold text-gray-900">{item.topic}</p>
                      {item.questionPattern ? (
                        <p className="text-[10px] text-gray-500 font-mono mt-1 bg-gray-100 p-1 rounded inline-block">
                          {item.questionPattern}
                        </p>
                      ) : (
                        <span className="text-[10px] text-gray-400 italic">Tanpa pola regex</span>
                      )}
                    </td>
                    <td className="py-3 px-4 align-top">
                      <p className="text-gray-700 leading-relaxed line-clamp-3">{item.answer}</p>
                    </td>
                    <td className="py-3 px-4 text-center align-top">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(item.id, item.isActive, item.topic)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold transition-colors ${
                          item.isActive
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                            : "bg-gray-100 text-gray-500 border border-gray-200 hover:bg-gray-200"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            item.isActive ? "bg-emerald-500" : "bg-gray-400"
                          }`}
                        />
                        {item.isActive ? "Aktif" : "Non-aktif"}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-center align-top font-mono font-semibold text-gray-700 tabular-nums">
                      {item._count.messages}x
                    </td>
                    <td className="py-3 px-4 text-right align-top">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditModal(item)}
                          disabled={isPending}
                          className="h-7 w-7 p-0 text-gray-600 hover:text-gray-900 border-gray-300"
                          title="Edit"
                        >
                          <HugeiconsIcon icon={Edit01Icon} size={14} />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(item.id, item.topic)}
                          disabled={isPending}
                          className="h-7 w-7 p-0 text-rose-600 hover:text-rose-700 border-rose-200 hover:bg-rose-50"
                          title="Hapus"
                        >
                          <HugeiconsIcon icon={Delete02Icon} size={14} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Create / Edit Modal Dialog ── */}
      {isCreating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-xl shadow-xl border border-gray-200 w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
              <h3 className="text-sm font-bold text-gray-900">
                {editingItem ? "Edit Knowledge Base" : "Tambah Entri Knowledge Base"}
              </h3>
              <button
                type="button"
                onClick={closeModal}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-700"
              >
                <HugeiconsIcon icon={Cancel01Icon} size={16} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-4 overflow-y-auto text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                  Topik Pertanyaan <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Jam Operasional & Alamat Toko"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:border-[#16624B]"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                  Pola Regex / Kata Kunci (Dipisahkan tanda |)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: jam buka|alamat|lokasi toko|buka jam berapa"
                  value={questionPattern}
                  onChange={(e) => {
                    setQuestionPattern(e.target.value);
                    setTestResult(null);
                  }}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-gray-300 font-mono focus:outline-none focus:border-[#16624B]"
                />
                <p className="text-[10px] text-gray-500 mt-1">
                  Kata kunci yang akan memicu rujukan ini diprioritaskan oleh AI.
                </p>

                {/* Tester */}
                {questionPattern && (
                  <div className="mt-2.5 p-2.5 bg-gray-50 rounded-lg border border-gray-200 space-y-2">
                    <p className="text-[10px] font-bold text-gray-600">Uji Kecocokan Pola:</p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Ketik kalimat simulasi customer..."
                        value={testQuery}
                        onChange={(e) => {
                          setTestQuery(e.target.value);
                          setTestResult(null);
                        }}
                        className="flex-1 text-xs px-2.5 py-1 rounded border border-gray-300 bg-white"
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={handleTestPattern}
                        className="h-7 text-[11px]"
                      >
                        Uji Pola
                      </Button>
                    </div>
                    {testResult !== null && (
                      <p
                        className={`text-[11px] font-bold ${
                          testResult ? "text-emerald-700" : "text-rose-600"
                        }`}
                      >
                        {testResult ? "✓ Cocok! Pola mendeteksi kalimat ini." : "✗ Tidak cocok."}
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                  Jawaban Panduan Resmi <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={5}
                  placeholder="Tuliskan jawaban yang akurat, jelas, dan santun..."
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:border-[#16624B]"
                  required
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActiveCheck"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="rounded border-gray-300 text-[#16624B] focus:ring-[#16624B]"
                />
                <label htmlFor="isActiveCheck" className="text-xs font-semibold text-gray-700">
                  Aktifkan entri ini dalam respon AI
                </label>
              </div>

              <div className="p-3 border-t border-gray-200 bg-gray-50 -mx-5 -mb-5 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={closeModal}
                  className="h-8 text-xs"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={isPending}
                  size="sm"
                  className="h-8 text-xs bg-[#16624B] hover:bg-[#0F4F3C] text-white font-semibold"
                >
                  {isPending ? "Menyimpan..." : "Simpan Entri"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
