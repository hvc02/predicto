import { Market, Position } from "../types";

export const mockMarkets: Market[] = [
  {
    id: "1",
    question: "Will Bitcoin hit $100k by December 31, 2026?",
    category: "Crypto",
    volume: 1250000,
    endDate: "2026-12-31T23:59:59Z",
    yesPrice: 0.65,
    noPrice: 0.35,
    isResolved: false,
  },
  {
    id: "2",
    question: "Will SpaceX land humans on Mars before 2030?",
    category: "Science",
    volume: 850000,
    endDate: "2029-12-31T23:59:59Z",
    yesPrice: 0.22,
    noPrice: 0.78,
    isResolved: false,
  },
  {
    id: "3",
    question: "Will AI pass the Turing test in 2026?",
    category: "Technology",
    volume: 3200000,
    endDate: "2026-12-31T23:59:59Z",
    yesPrice: 0.88,
    noPrice: 0.12,
    isResolved: false,
  },
  {
    id: "4",
    question: "Will the US Federal Reserve cut interest rates in March?",
    category: "Economy",
    volume: 4500000,
    endDate: "2026-03-31T23:59:59Z",
    yesPrice: 0.45,
    noPrice: 0.55,
    isResolved: false,
  },
];

export const mockPositions: Position[] = [
  {
    marketId: "1",
    outcome: "YES",
    shares: 1000,
    avgPrice: 0.5,
  },
  {
    marketId: "3",
    outcome: "NO",
    shares: 500,
    avgPrice: 0.1,
  },
];
