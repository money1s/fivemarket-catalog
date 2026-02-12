"use client";

import { useEffect } from "react";
import { trackViewContent } from "@/lib/pixels";

interface ViewContentTrackerProps {
  slug: string;
  title: string;
  price: number;
  category: string;
}

export function ViewContentTracker({ slug, title, price, category }: ViewContentTrackerProps) {
  useEffect(() => {
    trackViewContent({ slug, title, price, category });
  }, [category, price, slug, title]);

  return null;
}
