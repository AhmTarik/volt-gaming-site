import { CONTACT } from "./content";

export const whatsappHref = (message?: string) =>
  `https://wa.me/${CONTACT.whatsappNumber}${message ? `?text=${encodeURIComponent(message)}` : ""}`;

export interface BookingRequest {
  /** e.g. "Ultra Room 2" or "Simulator 1". Omit for a general enquiry. */
  place?: string;
  /** Selected PC numbers. */
  pcs?: number[];
  /** Free text, e.g. "Saturday" or "2026-11-07". */
  day?: string;
  /** e.g. "19:00". */
  time?: string;
  hours?: number;
  name?: string;
  /** Leave blank "Day:" / "Time:" lines for the customer to fill in when day/time are not known. */
  askWhen?: boolean;
  /** Message language (default English). */
  lang?: "en" | "ar";
}

/** Plain message in the site's voice: "Ultra Room 2, PCs 4, 5, 6, 7. Saturday 19:00, 2 hours." */
export const bookingMessage = (r: BookingRequest): string => {
  if (r.lang === "ar") {
    const head = r.place ? `أهلاً فولت، عايز أحجز ${r.place}.` : "أهلاً فولت، عايز أحجز.";
    if (r.askWhen && !r.day && !r.time) return [head, "", "اليوم: ", "الساعة: ", "عدد الساعات: ", "عددنا كام: "].join("\n");
    return head;
  }
  const parts: string[] = [];
  const head = [r.place, r.pcs?.length ? `PC${r.pcs.length > 1 ? "s" : ""} ${[...r.pcs].sort((a, b) => a - b).join(", ")}` : ""]
    .filter(Boolean)
    .join(", ");
  parts.push(head ? `Hi Volt, I'd like to book ${head}.` : "Hi Volt, I'd like to book.");
  const when = [r.day, r.time].filter(Boolean).join(" ");
  if (when || r.hours) parts.push([when, r.hours ? `${r.hours} hour${r.hours > 1 ? "s" : ""}` : ""].filter(Boolean).join(", ") + ".");
  if (r.name) parts.push(`Name: ${r.name}.`);
  if (r.askWhen && !when) {
    // WhatsApp keeps line breaks, so the customer just types after each label.
    return [parts.join(" "), "", "Day: ", "Time: ", "Hours: ", "Players: "].join("\n");
  }
  return parts.join(" ");
};

export const bookingHref = (r: BookingRequest) => whatsappHref(bookingMessage(r));
