export function JsonLd({ data }: { data: object }) {
  // Standard Next.js JSON-LD injection. Escape `<` so a stray "</script>" in any
  // string can't break out of the script tag (defense-in-depth; our data is
  // controlled marketing copy, not user input).
  const json = JSON.stringify(data).replace(/</g, '\\u003c')
  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />
  )
}
