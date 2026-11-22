"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type AuthFormProps = {
  mode: "login" | "register";
};

export default function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const supabase = createSupabaseBrowserClient();
      const result =
        mode === "login"
          ? await supabase.auth.signInWithPassword({ email, password })
          : await supabase.auth.signUp({ email, password });

      if (result.error) {
        setMessage(result.error.message);
        return;
      }

      if (mode === "register" && !result.data.session) {
        setMessage(
          "Email confirmation is enabled in Supabase. Turn it off in Auth settings to sign in immediately, or confirm your email before signing in."
        );
        return;
      }

      router.replace("/");
      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Unable to authenticate."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#100f19] text-white p-6">
      <form
        onSubmit={submit}
        className="w-full max-w-md rounded-2xl border border-white/10 bg-[#171629] p-8"
      >
        <h1 className="text-3xl font-black text-amber-300">
          {mode === "login" ? "Sign in" : "Create account"}
        </h1>
        <p className="mt-2 text-sm text-gray-400">
          {mode === "login"
            ? "Sign in to access your saved adventures."
            : "Create an account to save your adventures across devices."}
        </p>

        <label className="mt-6 block text-sm text-gray-300">
          Email
          <input
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="mt-2 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-3 text-white"
          />
        </label>

        <label className="mt-4 block text-sm text-gray-300">
          Password
          <input
            type="password"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            minLength={6}
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-2 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-3 text-white"
          />
        </label>

        <button
          type="submit"
          disabled={loading}
          className="mt-6 w-full rounded-lg bg-amber-500 py-3 font-bold text-black disabled:opacity-60"
        >
          {loading
            ? "PLEASE WAIT..."
            : mode === "login"
              ? "SIGN IN"
              : "CREATE ACCOUNT"}
        </button>

        {message && (
          <p role="status" className="mt-4 text-sm text-gray-300">
            {message}
          </p>
        )}

        <p className="mt-6 text-center text-sm text-gray-400">
          {mode === "login" ? "Need an account? " : "Already registered? "}
          <Link
            href={mode === "login" ? "/register" : "/login"}
            className="text-amber-300 underline"
          >
            {mode === "login" ? "Register" : "Sign in"}
          </Link>
        </p>
        <Link href="/" className="mt-4 block text-center text-sm text-gray-500 hover:text-white">
          Back to TypeQuest
        </Link>
      </form>
    </main>
  );
}
