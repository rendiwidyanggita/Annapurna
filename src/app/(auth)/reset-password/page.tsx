"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { resetPassword, type ActionState } from "../actions";
import { Eye, EyeOff, Loader2, CheckCircle } from "lucide-react";

const initialState: ActionState = {};

export default function ResetPasswordPage() {
  const [state, formAction, isPending] = useActionState(
    async (_prev: ActionState, formData: FormData) => {
      const result = await resetPassword(formData);
      return result ?? initialState;
    },
    initialState
  );

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Jika sukses, tampilkan halaman konfirmasi
  if (state?.success) {
    return (
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[#e7f3ee] mb-4">
          <CheckCircle size={28} className="text-[#16624b]" />
        </div>
        <h1 className="text-xl font-bold text-[#111827] mb-2">Password Berhasil Diubah</h1>
        <p className="text-sm text-[#6b7280] mb-6">{state.success}</p>
        <Link
          href="/login"
          className="inline-block rounded-lg bg-[#16624b] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0f4f3c] focus:outline-none focus:ring-2 focus:ring-[#16624b]/40"
        >
          Kembali ke Login
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#111827] mb-1">Reset Password</h1>
        <p className="text-sm text-[#6b7280]">
          Masukkan password baru Anda di bawah ini.
        </p>
      </div>

      {/* Error global */}
      {state?.error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      )}

      <form action={formAction} className="space-y-4">
        {/* New Password */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-[#111827] mb-1.5">
            Password Baru
          </label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              required
              placeholder="Min. 8 karakter"
              className="w-full rounded-lg border border-[#e5e7eb] bg-white px-3.5 py-2.5 pr-10 text-sm text-[#111827] placeholder-[#9ca3af] outline-none transition focus:border-[#16624b] focus:ring-2 focus:ring-[#16624b]/20 disabled:opacity-50"
              disabled={isPending}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6b7280] hover:text-[#111827]"
              tabIndex={-1}
              aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {/* Confirm New Password */}
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-[#111827] mb-1.5">
            Konfirmasi Password Baru
          </label>
          <div className="relative">
            <input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirm ? "text" : "password"}
              autoComplete="new-password"
              required
              placeholder="Ulangi password baru"
              className="w-full rounded-lg border border-[#e5e7eb] bg-white px-3.5 py-2.5 pr-10 text-sm text-[#111827] placeholder-[#9ca3af] outline-none transition focus:border-[#16624b] focus:ring-2 focus:ring-[#16624b]/20 disabled:opacity-50"
              disabled={isPending}
            />
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6b7280] hover:text-[#111827]"
              tabIndex={-1}
              aria-label={showConfirm ? "Sembunyikan password" : "Tampilkan password"}
            >
              {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded-lg bg-[#16624b] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0f4f3c] focus:outline-none focus:ring-2 focus:ring-[#16624b]/40 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
        >
          {isPending && <Loader2 size={16} className="animate-spin" />}
          {isPending ? "Menyimpan..." : "Simpan Password Baru"}
        </button>
      </form>
    </div>
  );
}
