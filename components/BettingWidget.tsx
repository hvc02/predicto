"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useQueryClient } from "@tanstack/react-query";
import { Market } from "@/types";

interface BettingWidgetProps {
  market: Market;
  marketId: string;
}

export default function BettingWidget({ market, marketId }: BettingWidgetProps) {
  const [outcome, setOutcome] = useState<"YES" | "NO">("YES");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const { data: session, status } = useSession();
  const queryClient = useQueryClient();

  const yesProb = Math.round(market.yesPrice * 100);
  const currentPrice = outcome === "YES" ? market.yesPrice : market.noPrice;
  const amountNum = amount ? parseFloat(amount) : 0;
  const amountCents = Math.round(amountNum * 100); // dollars -> cents
  const numShares = currentPrice > 0 ? amountNum / currentPrice : 0;
  const potentialReturn = numShares * 1;

  const canPlaceBet =
    status === "authenticated" &&
    !market.isResolved &&
    amountCents > 0;

  async function handleBet() {
    if (!canPlaceBet || amountCents <= 0) return;
    setError("");
    setSuccess(false);
    setLoading(true);
    try {
      const res = await fetch(`/api/markets/${marketId}/bet`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          side: outcome.toLowerCase(),
          amount: amountCents,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Failed to place bet");
        setLoading(false);
        return;
      }
      setSuccess(true);
      setAmount("");
      queryClient.invalidateQueries({ queryKey: ["market", marketId] });
      queryClient.invalidateQueries({ queryKey: ["markets"] });
      queryClient.invalidateQueries({ queryKey: ["me"] });
      queryClient.invalidateQueries({ queryKey: ["portfolio"] });
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  if (status !== "authenticated") {
    return (
      <div className="bg-white dark:bg-[#111] border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm sticky top-24">
        <h3 className="text-xl font-bold mb-6 text-gray-900 dark:text-white">
          Place Prediction
        </h3>
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          Sign in to place a bet. Your balance is in dollars (e.g. 10 = $10).
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-[#111] border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm sticky top-24">
      <h3 className="text-xl font-bold mb-6 flex justify-between items-end text-gray-900 dark:text-white">
        Place Prediction
        <span className="text-sm font-medium text-gray-500">Current: {yesProb}%</span>
      </h3>

      <div className="flex gap-2 mb-6">
        <button
          type="button"
          onClick={() => setOutcome("YES")}
          className={`flex-1 py-3 rounded-xl font-bold transition-all border-2 ${
            outcome === "YES"
              ? "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 border-green-500/50"
              : "bg-gray-100 dark:bg-gray-800 text-gray-500 hover:text-green-700 border-transparent hover:border-green-500/50"
          }`}
        >
          YES {(market.yesPrice * 100).toFixed(0)}¢
        </button>
        <button
          type="button"
          onClick={() => setOutcome("NO")}
          className={`flex-1 py-3 rounded-xl font-bold transition-all border-2 ${
            outcome === "NO"
              ? "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400 border-red-500/50"
              : "bg-gray-100 dark:bg-gray-800 text-gray-500 hover:text-red-700 border-transparent hover:border-red-500/50"
          }`}
        >
          NO {(market.noPrice * 100).toFixed(0)}¢
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Amount ($)
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">$</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-gray-700 rounded-xl py-3 pl-8 pr-4 text-gray-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
            />
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-[#0a0a0a] rounded-xl p-4 space-y-3 border border-gray-200 dark:border-gray-800">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400">Avg Price</span>
            <span className="font-medium text-gray-900 dark:text-white">{(currentPrice * 100).toFixed(0)}¢</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400">Estimated Shares</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {amountNum > 0 ? numShares.toFixed(2) : "0.00"}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400">Potential Return</span>
            <span className="font-medium text-green-600 dark:text-green-400">
              {amountNum > 0 ? `$${potentialReturn.toFixed(2)}` : "---"}
            </span>
          </div>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}
        {success && <p className="text-sm text-green-500">Bet placed successfully.</p>}
        <button
          type="button"
          onClick={handleBet}
          disabled={!canPlaceBet || loading || market.isResolved}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-4 rounded-xl font-bold text-lg transition-all shadow-lg hover:shadow-blue-500/25"
        >
          {loading ? "Placing…" : market.isResolved ? "Resolved" : "Place Bet"}
        </button>
      </div>
    </div>
  );
}
