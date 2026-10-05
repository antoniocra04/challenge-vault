import Link from "next/link"

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center px-4 text-center">
      <div>
        <p className="label-mono text-ember">404</p>
        <h1 className="mt-3 text-2xl font-semibold">Not in the vault</h1>
        <p className="mt-2 text-muted-foreground">This challenge doesn&apos;t exist — or it was deleted.</p>
        <Link
          href="/"
          className="mt-6 inline-block font-mono text-xs tracking-[0.16em] text-muted-foreground uppercase hover:text-foreground"
        >
          ← Back to vault
        </Link>
      </div>
    </main>
  )
}
