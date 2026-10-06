export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Загрузка" className="grid gap-6">
      <div className="h-7 w-48 animate-pulse rounded bg-label" />
      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="frame h-32 animate-pulse" />
        ))}
      </div>
    </div>
  )
}
