import { notFound } from 'next/navigation'
import { LANGS } from '../../data/types'
import { isLang } from '../../lib/i18n'
import { CurrencyProvider } from '../../components/CurrencyContext'
import { Header } from '../../components/Header'
import { Footer } from '../../components/Footer'

export const revalidate = 3600

export function generateStaticParams() {
  return LANGS.map((lang) => ({ lang }))
}

export default async function LangLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params
  if (!isLang(lang)) notFound()

  // No server-side cookie read here: that would opt every route into dynamic
  // rendering. CurrencyProvider reads the eg-country cookie client-side, keeping
  // these routes statically prerendered with ISR.
  return (
    <CurrencyProvider>
      <Header lang={lang} />
      <main lang={lang}>{children}</main>
      <Footer lang={lang} />
    </CurrencyProvider>
  )
}
