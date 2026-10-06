export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Загрузка" className="grid gap-6">
      <div className="h-7 w-48 animate-pulse rounded bg-label" />
      <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,15rem),1fr))] gap-2">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="frame h-40 animate-pulse" />
        ))}
      </div>
    </div>
  )
}
