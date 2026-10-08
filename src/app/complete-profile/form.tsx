"use client";

import { useActionState } from "react";
import { User, Phone, MapPin, Mail, AlertCircle, Loader2, ArrowRight } from "lucide-react";
import { completeProfile, type CompleteProfileActionState } from "./actions";

interface CompleteProfileFormProps {
  email: string;
  initialFullName?: string;
  initialPhone?: string;
  initialAddress?: string;
}

const initialState: CompleteProfileActionState = {};

export function CompleteProfileForm({
  email,
  initialFullName = "",
  initialPhone = "",
  initialAddress = "",
}: CompleteProfileFormProps) {
  const [state, formAction, isPending] = useActionState(completeProfile, initialState);

  return (
    <form action={formAction} className="space-y-5">
      {/* Pesan Error */}
      {state?.error && (
        <div className="flex items-start gap-2.5 p-3.5 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 animate-in fade-in duration-200">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-600" />
          <span>{state.error}</span>
        </div>
      )}

      {/* Email (Read-only) */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-[#6b7280] mb-1.5">
          Email Terdaftar
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
            <Mail className="w-4 h-4" />
          </div>
          <input
            type="email"
            value={email}
            disabled
            className="w-full pl-10 pr-3.5 py-2.5 bg-gray-100 border border-gray-200 rounded-xl text-sm text-gray-500 cursor-not-allowed font-mono"
          />
        </div>
      </div>

      {/* Nama Lengkap */}
      <div>
        <label htmlFor="fullName" className="block text-sm font-semibold text-[#111827] mb-1.5">
          Nama Lengkap <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
            <User className="w-4 h-4" />
          </div>
          <input
            id="fullName"
            name="fullName"
            type="text"
            required
            defaultValue={initialFullName}
            placeholder="Contoh: Rendi Widya Anggita"
            className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-sm text-[#111827] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#16624b]/30 focus:border-[#16624b] transition-all"
          />
        </div>
        <p className="mt-1 text-xs text-[#6b7280]">
          Sesuai dengan KTP / SIM yang akan dijadikan jaminan sewa.
        </p>
      </div>

      {/* Nomor WhatsApp */}
      <div>
        <label htmlFor="phoneNumber" className="block text-sm font-semibold text-[#111827] mb-1.5">
          Nomor WhatsApp Aktif <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
            <Phone className="w-4 h-4" />
          </div>
          <input
            id="phoneNumber"
            name="phoneNumber"
            type="tel"
            required
            defaultValue={initialPhone}
            placeholder="Contoh: 081234567890"
            className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-sm text-[#111827] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#16624b]/30 focus:border-[#16624b] transition-all"
          />
        </div>
        <p className="mt-1 text-xs text-[#6b7280]">
          Digunakan untuk konfirmasi jadwal sewa & notifikasi pengambilan.
        </p>
      </div>

      {/* Alamat Domisili */}
      <div>
        <label htmlFor="address" className="block text-sm font-semibold text-[#111827] mb-1.5">
          Alamat Domisili Lengkap <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <div className="absolute top-3 left-0 pl-3.5 pointer-events-none text-gray-400">
            <MapPin className="w-4 h-4" />
          </div>
          <textarea
            id="address"
            name="address"
            rows={3}
            required
            defaultValue={initialAddress}
            placeholder="Jalan, No. Rumah, RT/RW, Kelurahan, Kecamatan, Kota/Kabupaten"
            className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-sm text-[#111827] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#16624b]/30 focus:border-[#16624b] transition-all resize-none"
          />
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isPending}
        className="w-full mt-2 flex items-center justify-center gap-2 py-3 px-4 bg-[#16624b] hover:bg-[#0f4f3c] text-white font-medium text-sm rounded-xl transition-all shadow-sm shadow-[#16624b]/20 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
      >
        {isPending ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Menyimpan Profil...</span>
          </>
        ) : (
          <>
            <span>Simpan & Mulai Jelajah</span>
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>
    </form>
  );
}
