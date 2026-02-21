export interface Market {
  id: string;
  question: string;
  imageUrl?: string;
  category: string;
  volume: number;
  endDate: string;
  yesPrice: number;
  noPrice: number;
  isResolved: boolean;
  winningOutcome?: "YES" | "NO";
  /** When set, this market is from the chain and we can placeBet(chainMarketId, ...) */
  chainMarketId?: number;
}

export interface Position {
  marketId: string;
  outcome: "YES" | "NO";
  shares: number;
  avgPrice: number;
}
