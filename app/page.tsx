import { CatalogPageSection } from "@/components/catalog/catalog-page-section";
import { getActiveProducts } from "@/lib/products";

export default function HomePage() {
  const products = getActiveProducts();

  return (
    <CatalogPageSection
      title="Каталог"
      subtitle="Оберіть товари та додайте у кошик в один дотик."
      products={products}
    />
  );
}
