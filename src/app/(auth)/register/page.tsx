"use client";

import { useActionState, useState, startTransition } from "react";
import Link from "next/link";
import { register, signInWithGoogle, type ActionState } from "../actions";
import { Eye, EyeOff, Loader2, CheckCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, type RegisterInput } from "@/schemas/auth";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

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

  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

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

      <Form {...form}>
        <form 
          action={formAction}
          onSubmit={form.handleSubmit((data) => {
            startTransition(() => {
              const formData = new FormData();
              formData.append("email", data.email);
              formData.append("password", data.password);
              formData.append("confirmPassword", data.confirmPassword);
              formAction(formData);
            });
          })}
          className="space-y-4"
        >
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[#111827]">Email</FormLabel>
                <FormControl>
                  <Input 
                    type="email" 
                    placeholder="nama@email.com" 
                    autoComplete="email"
                    disabled={isPending}
                    className="focus-visible:ring-[#16624b]/20 focus-visible:border-[#16624b]"
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[#111827]">Password</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Min. 8 karakter"
                      autoComplete="new-password"
                      disabled={isPending}
                      className="pr-10 focus-visible:ring-[#16624b]/20 focus-visible:border-[#16624b]"
                      {...field}
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
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[#111827]">Konfirmasi Password</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type={showConfirm ? "text" : "password"}
                      placeholder="Ulangi password"
                      autoComplete="new-password"
                      disabled={isPending}
                      className="pr-10 focus-visible:ring-[#16624b]/20 focus-visible:border-[#16624b]"
                      {...field}
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
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            disabled={isPending}
            className="w-full bg-[#16624b] hover:bg-[#0f4f3c] text-white focus-visible:ring-[#16624b]/40 mt-6"
          >
            {isPending && <Loader2 size={16} className="animate-spin mr-2" />}
            {isPending ? "Mendaftarkan..." : "Daftar"}
          </Button>
        </form>
      </Form>

      {/* Divider */}
      <div className="my-5 flex items-center gap-3">
        <div className="flex-1 h-px bg-[#e5e7eb]" />
        <span className="text-xs text-[#6b7280]">atau</span>
        <div className="flex-1 h-px bg-[#e5e7eb]" />
      </div>

      {/* Google Login */}
      <Button
        type="button"
        variant="outline"
        onClick={handleGoogleLogin}
        disabled={isGooglePending || isPending}
        className="w-full text-[#111827] hover:bg-[#f9fafb] focus-visible:ring-[#16624b]/20 gap-2.5"
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
      </Button>

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
