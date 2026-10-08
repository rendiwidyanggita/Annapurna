"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { forgotPassword, type ActionState } from "../actions";
import { Loader2, CheckCircle } from "lucide-react";

const initialState: ActionState = {};

export default function ForgotPasswordPage() {
  const [state, formAction, isPending] = useActionState(
    async (_prev: ActionState, formData: FormData) => {
      const result = await forgotPassword(formData);
      return result ?? initialState;
    },
    initialState
  );

  // Jika sukses, tampilkan pesan sukses
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
        <h1 className="text-2xl font-bold text-[#111827] mb-1">Lupa Password?</h1>
        <p className="text-sm text-[#6b7280]">
          Masukkan email yang terdaftar, kami akan mengirimkan link untuk mereset password Anda.
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

        {/* Submit */}
        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded-lg bg-[#16624b] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0f4f3c] focus:outline-none focus:ring-2 focus:ring-[#16624b]/40 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
        >
          {isPending && <Loader2 size={16} className="animate-spin" />}
          {isPending ? "Mengirim Link..." : "Kirim Link Reset"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-[#6b7280]">
        Ingat password Anda?{" "}
        <Link href="/login" className="text-[#16624b] font-medium hover:underline">
          Masuk di sini
        </Link>
      </p>
    </div>
  );
}
