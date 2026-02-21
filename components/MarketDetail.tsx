"use client";

import Link from "next/link";
import { ArrowLeft, TrendingUp, Clock } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import BettingWidget from "@/components/BettingWidget";
import type { Market } from "@/types";
import type { MarketDetailResponse } from "@/lib/api";

function mapToMarket(res: MarketDetailResponse): Market {
  const volumeDollars = (res.totalYes + res.totalNo) / 100;
  return {
    id: res.id,
    question: res.question,
    category: "Market",
    volume: volumeDollars * 1000,
    endDate: new Date().toISOString(),
    yesPrice: res.yesPrice,
    noPrice: res.noPrice,
    isResolved: res.resolved,
    winningOutcome: res.resolved && res.outcomeYes !== null ? (res.outcomeYes ? "YES" : "NO") : undefined,
  };
}

export default function MarketDetail({ marketId }: { marketId: string }) {
  const { data, isLoading, error } = useQuery<MarketDetailResponse>({
    queryKey: ["market", marketId],
    queryFn: () => fetch(`/api/markets/${marketId}`).then((r) => (r.ok ? r.json() : Promise.reject(new Error("Not found")))),
    enabled: !!marketId,
  });

  if (error || (!isLoading && !data)) {
    return (
      <div className="max-w-4xl mx-auto space-y-8">
        <Link href="/" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 dark:hover:text-white">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Markets
        </Link>
        <p className="text-gray-500">Market not found.</p>
      </div>
    );
  }

  if (isLoading || !data) {
    return (
      <div className="max-w-4xl mx-auto space-y-8">
        <Link href="/" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 dark:hover:text-white">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Markets
        </Link>
        <p className="text-gray-500">Loading market…</p>
      </div>
    );
  }

  const market = mapToMarket(data);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <Link href="/" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 dark:hover:text-white">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Markets
      </Link>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="space-y-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-3 py-1 rounded-full">
              {market.category}
            </span>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white leading-tight">
              {market.question}
            </h1>
            <div className="flex flex-wrap gap-6 pt-4 border-t border-gray-200 dark:border-gray-800">
              <div className="flex items-center text-gray-500 dark:text-gray-400">
                <TrendingUp className="w-5 h-5 mr-2 text-green-500" />
                <span className="font-medium">${(market.volume / 1000).toFixed(1)}k Vol</span>
              </div>
              <div className="flex items-center text-gray-500 dark:text-gray-400">
                <Clock className="w-5 h-5 mr-2 text-orange-500" />
                <span className="font-medium">Resolves by admin</span>
              </div>
            </div>
          </div>
          <div className="h-[400px] w-full bg-white dark:bg-[#111] border border-gray-200 dark:border-gray-800 rounded-2xl flex items-center justify-center p-8">
            <p className="text-gray-500 font-medium">Price history (coming soon)</p>
          </div>
        </div>
        <div className="space-y-6">
          <BettingWidget market={market} marketId={marketId} />
        </div>
      </div>
    </div>
  );
}
