"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Settings, PlusCircle, CheckCircle2 } from "lucide-react";
import type { MarketListResponse } from "@/lib/api";

async function fetchMarkets(): Promise<MarketListResponse> {
  const res = await fetch("/api/markets");
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
}

export default function AdminDashboard() {
  const [question, setQuestion] = useState("");
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState("");
  const [createSuccess, setCreateSuccess] = useState(false);
  const [resolveLoading, setResolveLoading] = useState<string | null>(null);
  const [resolveError, setResolveError] = useState("");
  const { data: session, status } = useSession();
  const queryClient = useQueryClient();

  const { data: me } = useQuery({
    queryKey: ["me"],
    queryFn: () => fetch("/api/me").then((r) => r.json()),
    enabled: status === "authenticated",
  });
  const { data: markets = [], isLoading } = useQuery({
    queryKey: ["markets"],
    queryFn: fetchMarkets,
    enabled: status === "authenticated",
  });
  const isAdmin = me?.role === "admin";

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!question.trim()) return;
    setCreateError("");
    setCreateSuccess(false);
    setCreateLoading(true);
    try {
      const res = await fetch("/api/markets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: question.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setCreateError(data.error ?? "Failed to create market");
        setCreateLoading(false);
        return;
      }
      setCreateSuccess(true);
      setQuestion("");
      queryClient.invalidateQueries({ queryKey: ["markets"] });
    } catch {
      setCreateError("Something went wrong");
    } finally {
      setCreateLoading(false);
    }
  }

  async function handleResolve(marketId: string, outcomeYes: boolean) {
    setResolveError("");
    setResolveLoading(marketId);
    try {
      const res = await fetch(`/api/markets/${marketId}/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ outcomeYes }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setResolveError(data.error ?? "Failed to resolve");
        return;
      }
      queryClient.invalidateQueries({ queryKey: ["markets"] });
      queryClient.invalidateQueries({ queryKey: ["portfolio"] });
    } catch {
      setResolveError("Something went wrong");
    } finally {
      setResolveLoading(null);
    }
  }

  if (status !== "authenticated") {
    return (
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex items-center space-x-3 mb-8">
          <Settings className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          <h1 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white">Admin Dashboard</h1>
        </div>
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-8 text-center">
          <p className="text-amber-800 dark:text-amber-200 font-medium">Sign in to access the admin dashboard.</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex items-center space-x-3 mb-8">
          <Settings className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          <h1 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white">Admin Dashboard</h1>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-8 text-center">
          <p className="text-red-800 dark:text-red-200 font-medium">Only admins can create or resolve markets. Set ADMIN_EMAILS in env.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex items-center space-x-3 mb-8">
        <Settings className="w-8 h-8 text-blue-600 dark:text-blue-400" />
        <h1 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white">Admin Dashboard</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-[#111] border border-gray-200 dark:border-gray-800 rounded-2xl p-8 shadow-sm">
          <h2 className="text-xl font-bold flex items-center mb-6 text-gray-900 dark:text-white">
            <PlusCircle className="w-5 h-5 mr-2 text-green-500" />
            Create New Market
          </h2>
          <form onSubmit={handleCreate} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Question</label>
              <textarea
                rows={3}
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="e.g. Will Ethereum surpass Bitcoin in market cap by 2026?"
                className="w-full bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-gray-700 rounded-xl py-3 px-4 text-gray-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none"
              />
            </div>
            {createError && <p className="text-sm text-red-500">{createError}</p>}
            {createSuccess && <p className="text-sm text-green-500">Market created.</p>}
            <button
              type="submit"
              disabled={!question.trim() || createLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-xl font-bold transition-all shadow-md mt-4 flex items-center justify-center"
            >
              <PlusCircle className="w-5 h-5 mr-2" />
              {createLoading ? "Creating…" : "Create Market"}
            </button>
          </form>
        </div>

        <div className="bg-white dark:bg-[#111] border border-gray-200 dark:border-gray-800 rounded-2xl p-8 h-[600px] overflow-y-auto">
          <h2 className="text-xl font-bold flex items-center mb-6 text-gray-900 dark:text-white sticky top-0 bg-white dark:bg-[#111] py-2 z-10">
            <CheckCircle2 className="w-5 h-5 mr-2 text-orange-500" />
            Resolve Markets
          </h2>
          {resolveError && <p className="text-sm text-red-500 mb-4">{resolveError}</p>}
          {isLoading ? (
            <p className="text-gray-500 text-sm">Loading…</p>
          ) : markets.length === 0 ? (
            <p className="text-gray-500 text-sm">No markets yet. Create one first.</p>
          ) : (
            <div className="space-y-4">
              {markets.map((market) => (
                <div
                  key={market.id}
                  className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#0a0a0a] hover:border-blue-500 dark:hover:border-blue-500 transition-colors"
                >
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      {market.id.slice(0, 8)}…
                    </span>
                    <span
                      className={`text-xs font-bold px-2 py-1 rounded-md ${
                        market.resolved
                          ? "bg-gray-200 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                          : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                      }`}
                    >
                      {market.resolved ? "Resolved" : "Active"}
                    </span>
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-4 text-sm line-clamp-2">
                    {market.question}
                  </h3>
                  {!market.resolved && (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleResolve(market.id, true)}
                        disabled={resolveLoading !== null}
                        className="flex-1 bg-green-100 hover:bg-green-200 dark:bg-green-900/40 dark:hover:bg-green-900/60 text-green-700 dark:text-green-400 py-2 rounded-lg text-sm font-bold transition-all border border-green-200 dark:border-green-800/50 disabled:opacity-50"
                      >
                        Resolve YES
                      </button>
                      <button
                        type="button"
                        onClick={() => handleResolve(market.id, false)}
                        disabled={resolveLoading !== null}
                        className="flex-1 bg-red-100 hover:bg-red-200 dark:bg-red-900/40 dark:hover:bg-red-900/60 text-red-700 dark:text-red-400 py-2 rounded-lg text-sm font-bold transition-all border border-red-200 dark:border-red-800/50 disabled:opacity-50"
                      >
                        Resolve NO
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
