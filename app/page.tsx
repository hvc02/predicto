import MarketList from "@/components/MarketList";

export default function Home() {
  return (
    <div className="space-y-10">
      {/* Hero Section */}
      <section className="py-12 md:py-20 text-center space-y-6">
        <h1 className="text-5xl md:text-7xl font-black tracking-tight text-gray-900 dark:text-white">
          Predict the Future
        </h1>
        <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Trade on the world&apos;s most highly debated events. Turn your beliefs into profit.
        </p>
        <div className="flex justify-center gap-4 pt-4">
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-full text-lg font-bold transition-all shadow-lg hover:shadow-blue-500/25">
            Start Trading
          </button>
          <button className="bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white px-8 py-4 rounded-full text-lg font-bold border border-gray-200 dark:border-gray-700 transition-all">
            Learn More
          </button>
        </div>
      </section>

      {/* Markets Grid */}
      <section>
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Trending Markets</h2>
          <div className="flex gap-2">
            {['All', 'Crypto', 'Technology', 'Economy'].map((filter) => (
              <button key={filter} className={`px-4 py-2 rounded-full text-sm font-semibold ${filter === 'All' ? 'bg-gray-900 text-white dark:bg-white dark:text-black' : 'bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700'}`}>
                {filter}
              </button>
            ))}
          </div>
        </div>

        <MarketList />
      </section>
    </div>
  );
}
