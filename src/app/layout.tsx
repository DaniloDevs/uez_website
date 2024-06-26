import "./globals.css"
import Providers from "@/contexts/Providers"
import { Montserrat } from "next/font/google"
import type { Metadata } from "next"
import { Analytics } from "@vercel/analytics/react"
import { SpeedInsights } from "@vercel/speed-insights/next"
import { redirect } from "next/navigation"
import Page from "./lancamento-beta/page"

export const metadata: Metadata = {
  title: {
    template: "%s | UEZ Company",
    default: "UEZ Company",
  },
  description: "Surgiu algum problema e você precisa de ajuda? Então bem-vindo á Uez!",
  keywords: "UEZ, Company, UEZ Company, UEZ Company, UEZ Company, serviços, freelance",
  themeColor: "#fff",
}

const montserrat = Montserrat({
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  style: ["italic", "normal"],
  subsets: ["latin"],
  variable: "--font-montserrat",
})

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <Providers>
        <body className={montserrat.className} suppressHydrationWarning={true}>
          <Page /> {/* PÁGINA DE LANCAMENTO, TROCAR PRO CHILDREN QUANDO FOR VOLTAR Á NORMALIDADE */}
          <Analytics />
          <SpeedInsights />
        </body>
      </Providers>
    </html>
  )
}
