import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, ExternalLink, ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Product = {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  price: string | null;
  amazon_url: string;
  category_id: string | null;
};

type ProductImage = {
  id: string;
  image_url: string;
  display_order: number;
};

export const Route = createFileRoute("/product/$id")({
  component: ProductPage,
  errorComponent: ({ error }) => (
    <div className="p-8 text-center text-muted-foreground">{error.message}</div>
  ),
  notFoundComponent: () => (
    <div className="p-8 text-center text-muted-foreground">Product not found.</div>
  ),
});

function ProductPage() {
  const { id } = Route.useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [categoryName, setCategoryName] = useState<string | null>(null);
  const [images, setImages] = useState<ProductImage[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("products").select("*").eq("id", id).maybeSingle();
      if (!data) { setLoading(false); return; }
      setProduct(data);
      
      if (data.category_id) {
        const { data: cat } = await supabase
          .from("categories").select("name").eq("id", data.category_id).maybeSingle();
        setCategoryName(cat?.name ?? null);
      }

      // Load product images
      const { data: imagesData } = await supabase
        .from("product_images")
        .select("*")
        .eq("product_id", id)
        .order("display_order", { ascending: true });
      
      setImages(imagesData ?? []);
      setLoading(false);
    })();
  }, [id]);

  if (loading) return <div className="mx-auto max-w-4xl p-8"><div className="h-96 rounded-xl bg-muted animate-pulse" /></div>;
  if (!product) throw notFound();

  const displayImages = images.length > 0 ? images : (product.image_url ? [{ id: "main", image_url: product.image_url, display_order: 0 }] : []);
  const currentImage = displayImages[currentImageIndex];

  const goToPrevious = () => {
    setCurrentImageIndex((prev) => (prev === 0 ? displayImages.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentImageIndex((prev) => (prev === displayImages.length - 1 ? 0 : prev + 1));
  };

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="h-4 w-4" /> Back to shop
      </Link>

      <div className="grid gap-8 md:grid-cols-2">
        {/* Image Gallery */}
        <div className="space-y-4">
          <div className="aspect-square overflow-hidden rounded-2xl border border-border bg-muted relative">
            {currentImage ? (
              <img src={currentImage.image_url} alt={product.name} className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-muted-foreground">No image</div>
            )}

            {displayImages.length > 1 && (
              <>
                <button
                  onClick={goToPrevious}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={goToNext}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition"
                  aria-label="Next image"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/50 text-white text-xs px-3 py-1 rounded-full">
                  {currentImageIndex + 1} / {displayImages.length}
                </div>
              </>
            )}
          </div>

          {displayImages.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {displayImages.map((img, idx) => (
                <button
                  key={img.id}
                  onClick={() => setCurrentImageIndex(idx)}
                  className={`flex-shrink-0 h-16 w-16 rounded-lg overflow-hidden border-2 transition ${
                    idx === currentImageIndex ? "border-accent" : "border-border"
                  }`}
                >
                  <img src={img.image_url} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Details */}
        <div className="flex flex-col">
          {categoryName && (
            <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">{categoryName}</span>
          )}
          <h1 className="mt-2 text-3xl font-bold tracking-tight">{product.name}</h1>
          {product.price && (
            <div className="mt-4 text-2xl font-bold text-accent-foreground">{product.price}</div>
          )}
          {product.description && (
            <p className="mt-6 text-muted-foreground whitespace-pre-wrap leading-relaxed">{product.description}</p>
          )}

          <a
            href={product.amazon_url}
            target="_blank"
            rel="noopener sponsored"
            className="mt-8 inline-flex items-center justify-center gap-2 rounded-full bg-accent px-6 py-3 font-semibold text-accent-foreground transition hover:opacity-90"
          >
            Buy Now <ExternalLink className="h-4 w-4" />
          </a>
          <p className="mt-3 text-xs text-muted-foreground">
            You'll be redirected to a trusted external retailer to complete your purchase securely.
          </p>
        </div>
      </div>
    </main>
  );
}