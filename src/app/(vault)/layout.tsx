import { connection } from "next/server"
import { CaptureProvider } from "@/components/capture/capture-provider"
import { VaultHeader } from "@/components/layout/vault-header"
import { isAuthEnabled } from "@/lib/auth"
import { getBacklogTopics, getStatusCounts } from "@/lib/challenges/queries"

export default async function VaultLayout({ children }: LayoutProps<"/">) {
  await connection()
  const [counts, topics] = await Promise.all([getStatusCounts(), getBacklogTopics()])
  return (
    <CaptureProvider tagSuggestions={topics.map((t) => t.label).slice(0, 40)}>
      <VaultHeader activeCount={counts.active} authEnabled={isAuthEnabled()} />
      <main className="mx-auto w-full max-w-6xl px-4 pt-8 pb-24 sm:px-6 sm:pt-10">{children}</main>
    </CaptureProvider>
  )
}
