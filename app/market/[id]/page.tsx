import MarketDetail from "@/components/MarketDetail";

export default async function MarketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <MarketDetail marketId={id} />;
}
