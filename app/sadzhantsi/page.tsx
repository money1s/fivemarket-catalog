import { CatalogPageSection } from "@/components/catalog/catalog-page-section";
import { getActiveProducts } from "@/lib/products";

export default function SadzhantsiPage() {
  const products = getActiveProducts("sadzhantsi");

  return (
    <CatalogPageSection
      title="Саджанці"
      subtitle="Добірні саджанці для домашнього саду та сезонної висадки."
      products={products}
    />
  );
}
