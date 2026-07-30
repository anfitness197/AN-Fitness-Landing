export const WHATSAPP_NUMBER = "919867195346";
export const WHATSAPP_DISPLAY = "+91 98671 95346";
export const MAPS_URL = "https://maps.app.goo.gl/u3QoCsbmTL7Q6awK6";

const DEFAULT_WHATSAPP_MESSAGE =
  "Hi AN Fitness, I'd like to know more about your gym and membership plans!";

export function getWhatsappUrl(message: string = DEFAULT_WHATSAPP_MESSAGE) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

export function getMembershipWhatsappUrl(planName: string, planPrice: number) {
  return getWhatsappUrl(
    `Hi AN Fitness, I'm interested in the ${planName} membership plan (₹${planPrice}). Please assist me with registration!`
  );
}

export const WHATSAPP_URL = getWhatsappUrl();
