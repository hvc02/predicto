"use client";

import { useState } from "react";
import Link from "next/link";
import { LineChart, LogIn, LogOut, User } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import AuthModal from "@/components/AuthModal";

async function fetchMe() {
  const res = await fetch("/api/me");
  if (!res.ok) throw new Error("Not authenticated");
  return res.json() as Promise<{ balance: number; email: string; name: string | null }>;
}

export default function Navbar() {
  const [authOpen, setAuthOpen] = useState(false);
  const { data: session, status } = useSession();
  const { data: me } = useQuery({
    queryKey: ["me"],
    queryFn: fetchMe,
    enabled: status === "authenticated",
  });

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-[#0a0a0a]/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2 text-xl font-bold tracking-tighter">
              <LineChart className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              <span>Predicto</span>
            </Link>
          </div>

          <div className="hidden md:flex items-center space-x-8">
            <Link href="/" className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              Markets
            </Link>
            <Link href="/portfolio" className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              Portfolio
            </Link>
            <Link href="/wallet" className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              Wallet
            </Link>
            <Link href="/admin" className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              Admin
            </Link>
          </div>

          <div className="flex items-center gap-4">
            {status === "loading" ? (
              <span className="text-sm text-gray-500">…</span>
            ) : session ? (
              <>
                <div className="hidden sm:flex items-center gap-2 text-sm">
                  <User className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-700 dark:text-gray-300 truncate max-w-[140px]">
                    {session.user?.email}
                  </span>
                  {me != null && (
                    <span className="font-semibold text-gray-900 dark:text-white">
                      ${(me.balance / 100).toFixed(2)}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => signOut()}
                  className="inline-flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sign out
                </button>
              </>
            ) : (
              <button
                onClick={() => setAuthOpen(true)}
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all"
              >
                <LogIn className="w-4 h-4" />
                Sign in
              </button>
            )}
          </div>
        </div>
      </div>
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </nav>
  );
}
