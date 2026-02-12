import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <section className="container py-12">
      <div className="mx-auto max-w-md rounded-xl border border-border bg-card p-6 text-center shadow-soft">
        <h1 className="font-heading text-2xl font-bold">Товар не знайдено</h1>
        <p className="mt-2 text-sm text-muted-foreground">Можливо, посилання застаріло або товар відключено.</p>
        <Button asChild className="mt-5">
          <Link href="/">Перейти в каталог</Link>
        </Button>
      </div>
    </section>
  );
}
