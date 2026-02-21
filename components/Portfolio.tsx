"use client";

import { useSession } from "next-auth/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Wallet, CheckCircle } from "lucide-react";
import Link from "next/link";
import type { PortfolioResponse } from "@/lib/api";

export default function Portfolio() {
  const { data: session, status } = useSession();
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useQuery<PortfolioResponse>({
    queryKey: ["portfolio"],
    queryFn: () => fetch("/api/portfolio").then((r) => (r.ok ? r.json() : Promise.reject(new Error("Unauthorized")))),
    enabled: status === "authenticated",
  });

  const positions = data?.positions ?? [];
  const totalStake = positions.reduce((s, p) => s + (p.claimableCents > 0 ? p.claimableCents : p.stakeCents), 0);
  const claimableTotal = positions.reduce((s, p) => s + p.claimableCents, 0);

  async function handleClaim(marketId: string) {
    try {
      const res = await fetch(`/api/markets/${marketId}/claim`, { method: "POST" });
      if (!res.ok) return;
      queryClient.invalidateQueries({ queryKey: ["portfolio"] });
      queryClient.invalidateQueries({ queryKey: ["me"] });
    } catch {
      // ignore
    }
  }

  if (status !== "authenticated") {
    return (
      <div className="max-w-5xl mx-auto space-y-8">
        <h1 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white">Portfolio</h1>
        <div className="bg-gray-50 dark:bg-[#111]/50 border border-gray-200 dark:border-gray-800 rounded-2xl p-12 text-center">
          <p className="text-gray-500 font-medium">Sign in to see your positions.</p>
        </div>
      </div>
    );
  }

  if (error || isLoading) {
    return (
      <div className="max-w-5xl mx-auto space-y-8">
        <h1 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white">Portfolio</h1>
        <div className="bg-gray-50 dark:bg-[#111]/50 border border-gray-200 dark:border-gray-800 rounded-2xl p-12 text-center">
          <p className="text-gray-500 font-medium">{isLoading ? "Loading…" : "Failed to load portfolio."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-white dark:bg-[#111] border border-gray-200 dark:border-gray-800 rounded-2xl p-8 shadow-sm">
        <div className="space-y-2">
          <h1 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Portfolio</h1>
          <div className="text-5xl font-black text-gray-900 dark:text-white tracking-tight">
            ${(totalStake / 100).toFixed(2)}
          </div>
          {claimableTotal > 0 && (
            <div className="flex items-center text-sm font-bold text-green-600 dark:text-green-400 mt-2">
              <CheckCircle className="w-5 h-5 mr-1" />
              ${(claimableTotal / 100).toFixed(2)} ready to claim
            </div>
          )}
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
          <Wallet className="w-6 h-6 mr-3 text-blue-500" />
          Positions
        </h2>

        {positions.length === 0 ? (
          <div className="bg-gray-50 dark:bg-[#111]/50 border border-gray-200 dark:border-gray-800 rounded-2xl p-12 text-center">
            <p className="text-gray-500 font-medium">No positions. Place bets from a market page.</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-[#111] border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 dark:bg-[#0a0a0a] border-b border-gray-200 dark:border-gray-800">
                    <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Market</th>
                    <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Position</th>
                    <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Stake</th>
                    <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Status</th>
                    <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                  {positions.map((pos) => {
                    const won =
                      pos.resolved &&
                      pos.outcomeYes !== null &&
                      ((pos.outcomeYes && pos.outcome === "YES") || (!pos.outcomeYes && pos.outcome === "NO"));
                    return (
                      <tr key={pos.marketId} className="hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-colors">
                        <td className="p-4">
                          <Link
                            href={`/market/${pos.marketId}`}
                            className="font-semibold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 line-clamp-1"
                          >
                            {pos.question}
                          </Link>
                        </td>
                        <td className="p-4">
                          <span
                            className={`inline-flex px-3 py-1 rounded-lg text-xs font-bold ${
                              pos.outcome === "YES"
                                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                            }`}
                          >
                            {pos.outcome}
                          </span>
                        </td>
                        <td className="p-4 text-right font-medium text-gray-900 dark:text-white">
                          ${(pos.stakeCents / 100).toFixed(2)}
                        </td>
                        <td className="p-4 text-right text-sm text-gray-500">
                          {pos.resolved
                            ? won
                              ? pos.hasClaimed
                                ? "Claimed"
                                : "Won"
                              : "Lost"
                            : "Active"}
                        </td>
                        <td className="p-4 text-right">
                          {pos.resolved && won && !pos.hasClaimed && pos.claimableCents > 0 && (
                            <button
                              type="button"
                              onClick={() => handleClaim(pos.marketId)}
                              className="text-sm font-bold text-green-600 dark:text-green-400 hover:underline"
                            >
                              Claim ${(pos.claimableCents / 100).toFixed(2)}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
