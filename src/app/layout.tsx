import type { Metadata, Viewport } from "next"
import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import "./globals.css"

export const metadata: Metadata = {
  title: {
    default: "Challenge Vault",
    template: "%s · Challenge Vault",
  },
  description: "A vault of things I want to try.",
  robots: { index: false, follow: false },
}

export const viewport: Viewport = {
  themeColor: "#121318",
  colorScheme: "dark",
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-dvh">
        <TooltipProvider delayDuration={300}>{children}</TooltipProvider>
        <Toaster position="bottom-right" />
      </body>
    </html>
  )
}
