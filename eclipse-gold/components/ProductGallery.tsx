export function ProductGallery({ images }: { images: { url: string; alt: string }[] }) {
  if (images.length === 0) return null
  return (
    <div className="product-gallery">
      {images.map((img, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img key={i} src={img.url} alt={img.alt} width={800} height={800} />
      ))}
    </div>
  )
}
