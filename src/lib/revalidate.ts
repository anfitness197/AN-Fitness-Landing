import { revalidatePath } from "next/cache";

export function revalidateShop() { revalidatePath("/shop"); revalidatePath("/"); }
export function revalidateMemberships() { revalidatePath("/memberships"); revalidatePath("/"); }
export function revalidateGallery() { revalidatePath("/gallery"); revalidatePath("/"); }
export function revalidateOffers() { revalidatePath("/memberships"); revalidatePath("/"); }
export function revalidateEvents() { revalidatePath("/events"); }
