export type ProductCategory = "sadzhantsi" | "nasinnia";

export interface Product {
  title_ua: string;
  slug: string;
  category: ProductCategory;
  price_uah: number;
  crm_id: number;
  rating_fb: number;
  description: string;
  benefits: string[];
  how_to_order: string[];
  images: string[];
  is_active: boolean;
}

export interface CartItem {
  slug: string;
  title_ua: string;
  price_uah: number;
  crm_id: number;
  image: string;
  quantity: number;
}
