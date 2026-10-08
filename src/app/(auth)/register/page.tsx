"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { register, signInWithGoogle, type ActionState } from "../actions";
import { Eye, EyeOff, Loader2, CheckCircle } from "lucide-react";

const initialState: ActionState = {};

export default function RegisterPage() {
  const [state, formAction, isPending] = useActionState(
    async (_prev: ActionState, formData: FormData) => {
      const result = await register(formData);
      return result ?? initialState;
    },
    initialState
  );

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isGooglePending, setIsGooglePending] = useState(false);

  async function handleGoogleLogin() {
    setIsGooglePending(true);
    await signInWithGoogle();
  }

  // Jika sukses, tampilkan halaman konfirmasi email
  if (state?.success) {
    return (
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[#e7f3ee] mb-4">
          <CheckCircle size={28} className="text-[#16624b]" />
        </div>
        <h1 className="text-xl font-bold text-[#111827] mb-2">Cek Email Anda</h1>
        <p className="text-sm text-[#6b7280] mb-6">{state.success}</p>
        <Link
          href="/login"
          className="inline-block text-sm font-medium text-[#16624b] hover:underline"
        >
          ← Kembali ke halaman Login
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#111827] mb-1">Buat Akun Baru</h1>
        <p className="text-sm text-[#6b7280]">
          Sudah punya akun?{" "}
          <Link href="/login" className="text-[#16624b] font-medium hover:underline">
            Masuk di sini
          </Link>
        </p>
      </div>

      {/* Error global */}
      {state?.error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      )}

      <form action={formAction} className="space-y-4">
        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-[#111827] mb-1.5">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="nama@email.com"
            className="w-full rounded-lg border border-[#e5e7eb] bg-white px-3.5 py-2.5 text-sm text-[#111827] placeholder-[#9ca3af] outline-none transition focus:border-[#16624b] focus:ring-2 focus:ring-[#16624b]/20 disabled:opacity-50"
            disabled={isPending}
          />
        </div>

        {/* Password */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-[#111827] mb-1.5">
            Password
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

        {/* Confirm Password */}
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-[#111827] mb-1.5">
            Konfirmasi Password
          </label>
          <div className="relative">
            <input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirm ? "text" : "password"}
              autoComplete="new-password"
              required
              placeholder="Ulangi password"
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
          className="w-full rounded-lg bg-[#16624b] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0f4f3c] focus:outline-none focus:ring-2 focus:ring-[#16624b]/40 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isPending && <Loader2 size={16} className="animate-spin" />}
          {isPending ? "Mendaftarkan..." : "Daftar"}
        </button>
      </form>

      {/* Divider */}
      <div className="my-5 flex items-center gap-3">
        <div className="flex-1 h-px bg-[#e5e7eb]" />
        <span className="text-xs text-[#6b7280]">atau</span>
        <div className="flex-1 h-px bg-[#e5e7eb]" />
      </div>

      {/* Google Login */}
      <button
        type="button"
        onClick={handleGoogleLogin}
        disabled={isGooglePending || isPending}
        className="w-full rounded-lg border border-[#e5e7eb] bg-white px-4 py-2.5 text-sm font-medium text-[#111827] transition hover:bg-[#f9fafb] focus:outline-none focus:ring-2 focus:ring-[#16624b]/20 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2.5"
      >
        {isGooglePending ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
        )}
        {isGooglePending ? "Menghubungkan..." : "Daftar dengan Google"}
      </button>

      <p className="mt-5 text-center text-xs text-[#6b7280]">
        Dengan mendaftar, Anda menyetujui{" "}
        <Link href="/terms" className="text-[#16624b] hover:underline">
          Syarat & Ketentuan
        </Link>{" "}
        kami.
      </p>
    </div>
  );
}
