"use client";

import { useQuery } from "@tanstack/react-query";
import MarketCard from "@/components/MarketCard";
import type { Market } from "@/types";
import type { MarketListResponse } from "@/lib/api";

function mapToListMarket(m: MarketListResponse[number]): Market {
  const total = m.totalYes + m.totalNo;
  const yesPrice = total > 0 ? m.totalYes / total : 0.5;
  const noPrice = 1 - yesPrice;
  const volumeDollars = total / 100; // cents -> dollars for display
  return {
    id: m.id,
    question: m.question,
    category: "Market",
    volume: volumeDollars * 1000, // so (volume/1000).toFixed(1) gives "X.Xk"
    endDate: new Date().toISOString(),
    yesPrice,
    noPrice,
    isResolved: m.resolved,
    winningOutcome: m.resolved && m.outcomeYes !== null ? (m.outcomeYes ? "YES" : "NO") : undefined,
  };
}

export default function MarketList() {
  const { data: list, isLoading, error } = useQuery<MarketListResponse>({
    queryKey: ["markets"],
    queryFn: () => fetch("/api/markets").then((r) => r.json()),
  });

  const markets: Market[] = list ? list.map(mapToListMarket) : [];

  if (error) {
    return (
      <div className="col-span-full text-center py-12 text-red-500">
        Failed to load markets.
      </div>
    );
  }
  if (isLoading) {
    return (
      <div className="col-span-full text-center py-12 text-gray-500">
        Loading markets…
      </div>
    );
  }
  if (markets.length === 0) {
    return (
      <div className="col-span-full text-center py-12 text-gray-500">
        No markets yet. Create one from Admin.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {markets.map((market) => (
        <MarketCard key={market.id} market={market} />
      ))}
    </div>
  );
}
