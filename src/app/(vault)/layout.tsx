import { connection } from "next/server"
import { CaptureProvider } from "@/components/capture/capture-provider"
import { CompletionProvider } from "@/components/challenge/actions"
import { VaultHeader } from "@/components/layout/vault-header"
import { isAuthEnabled } from "@/lib/auth"
import { getBacklogTopics, getStatusCounts } from "@/lib/challenges/queries"

export default async function VaultLayout({ children }: LayoutProps<"/">) {
  await connection()
  const [counts, topics] = await Promise.all([getStatusCounts(), getBacklogTopics()])
  return (
    <CaptureProvider tagSuggestions={topics.map((t) => t.label).slice(0, 40)}>
      <CompletionProvider>
        <VaultHeader activeCount={counts.active} authEnabled={isAuthEnabled()} />
        <main
          id="main"
          tabIndex={-1}
          className="mx-auto w-full max-w-6xl px-4 pt-6 pb-[calc(6rem+env(safe-area-inset-bottom))] outline-none sm:px-6 sm:pt-8 md:pb-24"
        >
          {children}
        </main>
      </CompletionProvider>
    </CaptureProvider>
  )
}
