"use client";

import { useActionState, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { resetPassword, type ActionState } from "../actions";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ViewIcon,
  ViewOffIcon,
  Loading03Icon,
  CheckmarkCircle02Icon,
} from "@hugeicons/core-free-icons";

const initialState: ActionState = {};

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const code = searchParams.get("code") || "";

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
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-brand-50 mb-4 border border-brand-200">
          <HugeiconsIcon icon={CheckmarkCircle02Icon} size={28} className="text-brand-600" />
        </div>
        <h1 className="text-xl font-bold text-slate-900 mb-2">Password Berhasil Diubah</h1>
        <p className="text-sm text-slate-600 mb-6">{state.success}</p>
        <Link
          href="/login"
          className="inline-block rounded-xl bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-600/40"
        >
          Kembali ke Login
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-1">Reset Password</h1>
        <p className="text-sm text-slate-600">
          Masukkan password baru Anda di bawah ini.
        </p>
      </div>

      {/* Error global */}
      {state?.error && (
        <div className="mb-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      )}

      <form action={formAction} className="space-y-4">
        {/* Hidden field for auth code (fallback flow) */}
        {code && <input type="hidden" name="code" value={code} />}

        {/* New Password */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-slate-800 mb-1.5">
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
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 pr-10 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20 disabled:opacity-50"
              disabled={isPending}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
              tabIndex={-1}
              aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
            >
              <HugeiconsIcon icon={showPassword ? ViewOffIcon : ViewIcon} size={16} />
            </button>
          </div>
        </div>

        {/* Confirm New Password */}
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-800 mb-1.5">
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
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 pr-10 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20 disabled:opacity-50"
              disabled={isPending}
            />
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
              tabIndex={-1}
              aria-label={showConfirm ? "Sembunyikan password" : "Tampilkan password"}
            >
              <HugeiconsIcon icon={showConfirm ? ViewOffIcon : ViewIcon} size={16} />
            </button>
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-600/40 active:scale-[0.96] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
        >
          {isPending && <HugeiconsIcon icon={Loading03Icon} size={16} className="animate-spin" />}
          {isPending ? "Menyimpan..." : "Simpan Password Baru"}
        </button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="text-center py-8 text-sm text-slate-500">Memuat...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
