import Link from 'next/link';
import { Market } from '../types';

interface MarketCardProps {
  market: Market;
}

export default function MarketCard({ market }: MarketCardProps) {
  // Format probability as percentage
  const yesProb = Math.round(market.yesPrice * 100);

  return (
    <Link href={`/market/${market.id}`} className="group block">
      <div className="bg-white dark:bg-[#111] border border-gray-200 dark:border-gray-800 rounded-2xl p-5 hover:border-blue-500 dark:hover:border-blue-500 transition-all duration-300 shadow-sm hover:shadow-md h-full flex flex-col">
        {/* Category & Volume */}
        <div className="flex justify-between items-center mb-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full">
            {market.category}
          </span>
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
            ${(market.volume / 1000).toFixed(1)}k Vol
          </span>
        </div>

        {/* Question */}
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 line-clamp-3 flex-grow group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
          {market.question}
        </h3>

        {/* Probability Bar */}
        <div className="space-y-4 mt-auto">
          <div className="flex justify-between items-end">
            <span className="text-3xl font-black text-blue-600 dark:text-blue-400">
              {yesProb}%
            </span>
            <span className="text-sm font-medium text-gray-500">Chance</span>
          </div>

          <div className="flex gap-2">
            <button className="flex-1 bg-green-100 hover:bg-green-200 dark:bg-green-900/30 dark:hover:bg-green-900/50 text-green-700 dark:text-green-400 py-3 rounded-xl font-bold transition-colors border border-green-200 dark:border-green-800/50">
              Buy Yes {(market.yesPrice * 100).toFixed(0)}¢
            </button>
            <button className="flex-1 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-700 dark:text-red-400 py-3 rounded-xl font-bold transition-colors border border-red-200 dark:border-red-800/50">
              Buy No {(market.noPrice * 100).toFixed(0)}¢
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}
