"use client";

import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Image from "next/image";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface ProductGalleryCarouselProps {
  images: string[];
  title: string;
}

export function ProductGalleryCarousel({ images, title }: ProductGalleryCarouselProps) {
  const normalizedImages = images.length ? images.slice(0, 5) : ["/uploads/placeholder-garden.svg"];
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [dialogImage, setDialogImage] = useState<string | null>(null);

  const onSelect = useCallback(() => {
    if (!emblaApi) {
      return;
    }
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) {
      return;
    }

    onSelect();
    emblaApi.on("select", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi, onSelect]);

  return (
    <>
      <div className="overflow-hidden rounded-xl bg-muted" ref={emblaRef}>
        <div className="flex">
          {normalizedImages.map((image, index) => (
            <button
              type="button"
              key={image + index}
              className="relative min-w-0 flex-[0_0_100%] aspect-square cursor-pointer touch-manipulation"
              onClick={() => setDialogImage(image)}
              aria-label={`Відкрити фото ${index + 1}`}
            >
              <Image src={image} alt={`${title} фото ${index + 1}`} fill className="object-cover" sizes="100vw" priority={index === 0} />
            </button>
          ))}
        </div>
      </div>

      <div className="mt-3 flex items-center justify-center gap-2">
        {normalizedImages.map((_, index) => (
          <button
            key={index}
            type="button"
            className={cn(
              "h-2.5 w-2.5 rounded-full transition-colors",
              selectedIndex === index ? "bg-primary" : "bg-border",
            )}
            onClick={() => emblaApi?.scrollTo(index)}
            aria-label={`Перейти до фото ${index + 1}`}
          />
        ))}
      </div>

      <Dialog open={Boolean(dialogImage)} onOpenChange={(next) => !next && setDialogImage(null)}>
        <DialogContent className="w-[96vw] max-w-[960px] border-none bg-black p-2">
          <DialogTitle className="sr-only">Фото товару</DialogTitle>
          {dialogImage ? (
            <div className="relative aspect-square w-full">
              <Image src={dialogImage} alt={title} fill className="object-contain" sizes="96vw" />
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
