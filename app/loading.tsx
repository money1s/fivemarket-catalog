import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <section className="container py-5">
      <Skeleton className="h-9 w-56" />
      <div className="mt-5 grid grid-cols-2 gap-3">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="space-y-3 rounded-xl border border-border bg-card p-3">
            <Skeleton className="aspect-square w-full rounded-lg" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
      </div>
    </section>
  );
}
