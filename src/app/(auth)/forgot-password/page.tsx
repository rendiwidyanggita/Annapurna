"use client";

import { useActionState, startTransition } from "react";
import Link from "next/link";
import { forgotPassword, type ActionState } from "../actions";
import { Loader2, CheckCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { forgotPasswordSchema, type ForgotPasswordInput } from "@/schemas/auth";

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

export default function ForgotPasswordPage() {
  const [state, formAction, isPending] = useActionState(
    async (_prev: ActionState, formData: FormData) => {
      const result = await forgotPassword(formData);
      return result ?? initialState;
    },
    initialState
  );

  const form = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

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

          <Button
            type="submit"
            disabled={isPending}
            className="w-full bg-[#16624b] hover:bg-[#0f4f3c] text-white focus-visible:ring-[#16624b]/40 mt-2"
          >
            {isPending && <Loader2 size={16} className="animate-spin mr-2" />}
            {isPending ? "Mengirim Link..." : "Kirim Link Reset"}
          </Button>
        </form>
      </Form>

      <p className="mt-6 text-center text-sm text-[#6b7280]">
        Ingat password Anda?{" "}
        <Link href="/login" className="text-[#16624b] font-medium hover:underline">
          Masuk di sini
        </Link>
      </p>
    </div>
  );
}
