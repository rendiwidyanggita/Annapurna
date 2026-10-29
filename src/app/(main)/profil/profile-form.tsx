"use client";

import { useActionState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  User02Icon,
  Call02Icon,
  Location01Icon,
  Mail01Icon,
  CheckmarkCircle02Icon,
  AlertCircleIcon,
  Loading03Icon,
  FloppyDiskIcon,
} from "@hugeicons/core-free-icons";
import { updateCustomerProfile, ActionState } from "./actions";

interface ProfileFormProps {
  user: {
    id: string;
    email: string;
    authProvider: string;
    createdAt?: string;
  };
  profile: {
    fullName: string | null;
    phoneNumber: string | null;
    address: string | null;
  } | null;
}

const initialState: ActionState = {};

export function ProfileForm({ user, profile }: ProfileFormProps) {
  const [state, formAction, isPending] = useActionState(
    updateCustomerProfile,
    initialState
  );

  return (
    <form action={formAction} className="space-y-6">
      {/* Alert Error / Sukses */}
      {state.error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50/70 p-4 text-sm text-red-700"
        >
          <HugeiconsIcon
            icon={AlertCircleIcon}
            size={20}
            className="shrink-0 text-red-600 mt-0.5"
          />
          <div className="flex-1">
            <p className="font-semibold">{state.error}</p>
          </div>
        </div>
      )}

      {state.success && (
        <div
          role="status"
          className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 text-sm text-emerald-800"
        >
          <HugeiconsIcon
            icon={CheckmarkCircle02Icon}
            size={20}
            className="shrink-0 text-emerald-600 mt-0.5"
          />
          <div className="flex-1">
            <p className="font-semibold">{state.success}</p>
            <p className="text-xs text-emerald-700/80 mt-0.5">
              Perubahan identitas telah tersimpan ke sistem.
            </p>
          </div>
        </div>
      )}

      {/* Field: Email (Read Only) */}
      <div className="space-y-1.5">
        <label
          htmlFor="email"
          className="block text-xs font-semibold uppercase tracking-wider text-neutral-600"
        >
          Email Akun
        </label>
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-neutral-400">
            <HugeiconsIcon icon={Mail01Icon} size={18} />
          </div>
          <input
            id="email"
            type="email"
            disabled
            value={user.email}
            className="w-full rounded-xl border border-neutral-200 bg-neutral-100/70 py-2.5 pl-11 pr-24 text-sm text-neutral-600 cursor-not-allowed select-all"
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            <span className="inline-flex items-center rounded-md bg-neutral-200/70 px-2 py-0.5 text-xs font-medium text-neutral-700 capitalize">
              {user.authProvider === "google" ? "Google" : "Email"}
            </span>
          </div>
        </div>
        <p className="text-xs text-neutral-500">
          Email terikat dengan identitas autentikasi akun Anda dan tidak dapat diubah.
        </p>
      </div>

      {/* Field: Nama Lengkap */}
      <div className="space-y-1.5">
        <label
          htmlFor="fullName"
          className="block text-xs font-semibold uppercase tracking-wider text-neutral-700"
        >
          Nama Lengkap <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-neutral-400">
            <HugeiconsIcon icon={User02Icon} size={18} />
          </div>
          <input
            id="fullName"
            name="fullName"
            type="text"
            required
            defaultValue={profile?.fullName ?? ""}
            placeholder="Sesuai KTP / SIM"
            disabled={isPending}
            className="w-full rounded-xl border border-neutral-300 bg-white py-2.5 pl-11 pr-4 text-sm text-neutral-900 shadow-xs transition-colors placeholder:text-neutral-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:opacity-75"
          />
        </div>
        {state.fieldErrors?.fullName ? (
          <p className="text-xs text-red-600">
            {state.fieldErrors.fullName[0]}
          </p>
        ) : (
          <p className="text-xs text-neutral-500">
            Nama resmi untuk penjaminan dan verifikasi penyewaan alat outdoor.
          </p>
        )}
      </div>

      {/* Field: Nomor WhatsApp */}
      <div className="space-y-1.5">
        <label
          htmlFor="phoneNumber"
          className="block text-xs font-semibold uppercase tracking-wider text-neutral-700"
        >
          Nomor WhatsApp Aktif <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-neutral-400">
            <HugeiconsIcon icon={Call02Icon} size={18} />
          </div>
          <input
            id="phoneNumber"
            name="phoneNumber"
            type="tel"
            required
            defaultValue={profile?.phoneNumber ?? ""}
            placeholder="081234567890 atau +6281234567890"
            disabled={isPending}
            className="w-full rounded-xl border border-neutral-300 bg-white py-2.5 pl-11 pr-4 text-sm text-neutral-900 shadow-xs transition-colors placeholder:text-neutral-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:opacity-75"
          />
        </div>
        {state.fieldErrors?.phoneNumber ? (
          <p className="text-xs text-red-600">
            {state.fieldErrors.phoneNumber[0]}
          </p>
        ) : (
          <p className="text-xs text-neutral-500">
            Digunakan untuk konfirmasi pesanan, bukti transfer, dan status sewa.
          </p>
        )}
      </div>

      {/* Field: Alamat Domisili */}
      <div className="space-y-1.5">
        <label
          htmlFor="address"
          className="block text-xs font-semibold uppercase tracking-wider text-neutral-700"
        >
          Alamat Domisili Lengkap <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <div className="pointer-events-none absolute top-3 left-0 flex items-start pl-3.5 text-neutral-400">
            <HugeiconsIcon icon={Location01Icon} size={18} />
          </div>
          <textarea
            id="address"
            name="address"
            rows={3}
            required
            defaultValue={profile?.address ?? ""}
            placeholder="Nama jalan, nomor rumah, RT/RW, kelurahan, kecamatan, kota/kabupaten..."
            disabled={isPending}
            className="w-full rounded-xl border border-neutral-300 bg-white py-2.5 pl-11 pr-4 text-sm text-neutral-900 shadow-xs transition-colors placeholder:text-neutral-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:opacity-75"
          />
        </div>
        {state.fieldErrors?.address ? (
          <p className="text-xs text-red-600">
            {state.fieldErrors.address[0]}
          </p>
        ) : (
          <p className="text-xs text-neutral-500">
            Alamat tempat tinggal saat ini untuk verifikasi kartu identitas penjamin.
          </p>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white shadow-xs transition-all hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isPending ? (
            <>
              <HugeiconsIcon icon={Loading03Icon} size={18} className="animate-spin" />
              <span>Menyimpan...</span>
            </>
          ) : (
            <>
              <HugeiconsIcon icon={FloppyDiskIcon} size={18} />
              <span>Simpan Perubahan</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
