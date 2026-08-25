import { BackLink } from "@/components/back-link";
import { getProducts } from "@/lib/data";
import ShopGrid from "./shop-grid";

export const revalidate = 60;

export default async function ShopPage() {
  const products = await getProducts();

  return (
    <div className="relative min-h-screen bg-zinc-950 flex flex-col justify-between overflow-x-hidden text-white pt-20 sm:pt-24 pb-12 sm:pb-16">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#09090b_1px,transparent_1px),linear-gradient(to_bottom,#09090b_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-40 pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] sm:w-[600px] h-[200px] sm:h-[300px] bg-brandRed/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="relative z-10 max-w-7xl mx-auto w-full px-4 sm:px-6 flex-1 flex flex-col gap-6 sm:gap-10">
        <div className="self-start"><BackLink /></div>
        <div className="text-left flex flex-col gap-2 sm:gap-3">
          <span className="text-[11px] sm:text-xs text-brandRed font-mono font-black uppercase tracking-[0.3em] sm:tracking-[0.4em] bg-brandRed/10 px-3 py-1 rounded self-start">Premium Supplements</span>
          <h1 className="font-heading font-black text-3xl sm:text-4xl md:text-6xl text-white uppercase tracking-tight leading-none">Shop</h1>
          <p className="text-zinc-500 text-xs sm:text-sm md:text-base max-w-xl font-light">Premium supplements from top brands. Tap &quot;Enquire Now&quot; on any product to get details on WhatsApp.</p>
        </div>
        <ShopGrid products={products} />
      </div>
    </div>
  );
}
