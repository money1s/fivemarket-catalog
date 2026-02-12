import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface FacebookRatingBadgeProps {
  rating?: number;
  className?: string;
}

function StarWithFill({ fill }: { fill: number }) {
  const width = `${Math.max(0, Math.min(100, fill * 100))}%`;

  return (
    <span className="relative inline-flex h-4 w-4">
      <Star className="absolute inset-0 h-4 w-4 text-slate-300" />
      <span className="absolute inset-y-0 left-0 overflow-hidden" style={{ width }}>
        <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
      </span>
    </span>
  );
}

export function FacebookRatingBadge({ rating = 4.7, className }: FacebookRatingBadgeProps) {
  const safeRating = Math.max(0, Math.min(5, rating));
  const starFills = Array.from({ length: 5 }).map((_, index) => Math.max(0, Math.min(1, safeRating - index)));

  return (
    <div className={cn("inline-flex items-center gap-3 rounded-xl border border-border bg-card px-3 py-2", className)}>
      <svg viewBox="0 0 24 24" className="h-5 w-5 text-[#1877F2]" aria-hidden="true">
        <path
          fill="currentColor"
          d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.5-3.9 3.78-3.9 1.1 0 2.24.2 2.24.2v2.46H15.2c-1.24 0-1.62.76-1.62 1.54V12h2.76l-.44 2.9h-2.32v6.98A10 10 0 0 0 22 12Z"
        />
      </svg>
      <div>
        <div className="flex items-center gap-2">
          <span className="font-heading text-base font-bold text-foreground">{safeRating.toFixed(1)}</span>
          <div className="flex items-center gap-0.5" aria-label={`Рейтинг ${safeRating.toFixed(1)} з 5`}>
            {starFills.map((fill, index) => (
              <StarWithFill key={index} fill={fill} />
            ))}
          </div>
        </div>
        <p className="text-xs text-muted-foreground">Рейтинг Facebook</p>
      </div>
    </div>
  );
}
