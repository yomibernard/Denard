export default function ShopLoading() {
  return (
    <div className="container-denard py-8 md:py-12 animate-pulse" aria-hidden>
      <div className="mb-5 h-4 w-40 bg-sand" />
      <div className="mb-3 h-10 w-64 bg-sand" />
      <div className="mb-8 h-4 w-96 max-w-full bg-sand" />
      <div className="mb-8 h-24 bg-sand" />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <div className="aspect-[4/5] bg-sand" />
            <div className="h-4 w-3/4 bg-sand" />
            <div className="h-3 w-1/2 bg-sand" />
          </div>
        ))}
      </div>
    </div>
  );
}
