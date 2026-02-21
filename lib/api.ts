/**
 * API client types and helpers for Predicto (no blockchain).
 */

export type MarketListResponse = Array<{
  id: string;
  question: string;
  totalYes: number;
  totalNo: number;
  resolved: boolean;
  outcomeYes: boolean | null;
  createdAt: string;
  resolvedAt: string | null;
}>;

export type MarketDetailResponse = {
  id: string;
  question: string;
  totalYes: number;
  totalNo: number;
  resolved: boolean;
  outcomeYes: boolean | null;
  yesPrice: number;
  noPrice: number;
  createdAt: string;
  resolvedAt: string | null;
};

export type PortfolioResponse = {
  positions: Array<{
    marketId: string;
    question: string;
    outcome: "YES" | "NO";
    stakeCents: number;
    resolved: boolean;
    outcomeYes: boolean | null;
    hasClaimed: boolean;
    claimableCents: number;
  }>;
};

export type MeResponse = {
  id: string;
  email: string;
  name: string | null;
  balance: number;
  role: string | null;
};
