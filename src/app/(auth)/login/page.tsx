"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { login, signInWithGoogle, type ActionState } from "../actions";
import { Eye, EyeOff, Loader2 } from "lucide-react";

const initialState: ActionState = {};

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(
    async (_prev: ActionState, formData: FormData) => {
      const result = await login(formData);
      return result ?? initialState;
    },
    initialState
  );

  const [showPassword, setShowPassword] = useState(false);
  const [isGooglePending, setIsGooglePending] = useState(false);

  async function handleGoogleLogin() {
    setIsGooglePending(true);
    await signInWithGoogle();
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#111827] mb-1">Masuk ke Akun</h1>
        <p className="text-sm text-[#6b7280]">
          Belum punya akun?{" "}
          <Link href="/register" className="text-[#16624b] font-medium hover:underline">
            Daftar sekarang
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
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="password" className="block text-sm font-medium text-[#111827]">
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-xs text-[#16624b] hover:underline"
            >
              Lupa password?
            </Link>
          </div>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
              placeholder="••••••••"
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

        {/* Submit */}
        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded-lg bg-[#16624b] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0f4f3c] focus:outline-none focus:ring-2 focus:ring-[#16624b]/40 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isPending && <Loader2 size={16} className="animate-spin" />}
          {isPending ? "Memproses..." : "Masuk"}
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
        {isGooglePending ? "Menghubungkan..." : "Lanjutkan dengan Google"}
      </button>
    </div>
  );
}
