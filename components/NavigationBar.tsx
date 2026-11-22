"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { activateSaveUser } from "@/game/engine/SaveEngine";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function NavigationBar() {
  const [email, setEmail] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let active = true;
    const supabase = createSupabaseBrowserClient();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      activateSaveUser(session?.user.id ?? null);
      setEmail(session?.user.email ?? null);
      setLoaded(true);
    });

    void supabase.auth.getUser().then(({ data, error }) => {
      if (!active) return;

      if (error) {
        console.error("Failed to load navigation auth state:", error);
      }

      activateSaveUser(data.user?.id ?? null);
      setEmail(data.user?.email ?? null);
      setLoaded(true);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  async function logOut() {
    setLoggingOut(true);
    setErrorMessage("");

    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
      setErrorMessage(error.message);
    }

    setLoggingOut(false);
  }

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#100f19]/95 text-white backdrop-blur">
      <nav
        aria-label="Main navigation"
        className="mx-auto flex min-h-16 max-w-6xl items-center justify-between gap-4 px-5"
      >
        <Link
          href="/"
          className="shrink-0 text-lg font-black tracking-[0.2em] text-amber-300"
        >
          TYPEQUEST
        </Link>

        <div className="flex items-center gap-2 sm:gap-4">
          {!loaded ? (
            <span className="h-9 w-28 animate-pulse rounded-lg bg-white/10" />
          ) : email ? (
            <>
              <span className="hidden max-w-56 truncate text-sm text-gray-300 sm:block">
                {email}
              </span>
              <Link
                href="/admin"
                className="rounded-lg border border-white/20 px-3 py-2 text-xs font-bold tracking-wide hover:bg-white/10 sm:text-sm"
              >
                ADMIN
              </Link>
              <button
                type="button"
                onClick={() => void logOut()}
                disabled={loggingOut}
                className="rounded-lg bg-amber-500 px-3 py-2 text-xs font-bold tracking-wide text-black hover:bg-amber-400 disabled:opacity-60 sm:text-sm"
              >
                {loggingOut ? "SIGNING OUT..." : "LOG OUT"}
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-lg border border-white/20 px-3 py-2 text-xs font-bold tracking-wide hover:bg-white/10 sm:text-sm"
              >
                LOG IN
              </Link>
              <Link
                href="/register"
                className="rounded-lg bg-amber-500 px-3 py-2 text-xs font-bold tracking-wide text-black hover:bg-amber-400 sm:text-sm"
              >
                REGISTER
              </Link>
            </>
          )}
        </div>
      </nav>
      {errorMessage && (
        <p role="alert" className="border-t border-red-400/20 px-5 py-2 text-center text-xs text-red-300">
          Sign out failed: {errorMessage}
        </p>
      )}
    </header>
  );
}
