import { CatalogPageSection } from "@/components/catalog/catalog-page-section";
import { getActiveProducts } from "@/lib/products";

export default function NasinniaPage() {
  const products = getActiveProducts("nasinnia");

  return (
    <CatalogPageSection
      title="Насіння"
      subtitle="Насіння перевірених сортів для стабільного врожаю."
      products={products}
    />
  );
}
