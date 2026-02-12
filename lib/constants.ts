import { ProductCategory } from "@/lib/types";

export const CATEGORY_TABS: Array<{ label: string; value: "all" | ProductCategory }> = [
  { label: "Каталог", value: "all" },
  { label: "Саджанці", value: "sadzhantsi" },
  { label: "Насіння", value: "nasinnia" },
];

export const CATEGORY_LABELS: Record<ProductCategory, string> = {
  sadzhantsi: "Саджанці",
  nasinnia: "Насіння",
};
