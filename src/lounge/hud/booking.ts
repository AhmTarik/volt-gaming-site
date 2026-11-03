import { useCallback, useState } from "react";
import type { BookingData } from "./content";

/**
 * Booking form state lives in the HUD root (not in the panel) so that data survives
 * switching stations: panels unmount when the camera moves away.
 */
export const useBookingState = () => {
  const [form, setForm] = useState<Partial<BookingData>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState<BookingData | null>(null);

  const update = useCallback((field: keyof BookingData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  }, []);

  const reset = useCallback(() => {
    setForm({});
    setErrors({});
    setSubmitted(null);
  }, []);

  return { form, errors, setErrors, update, submitted, setSubmitted, reset };
};

export type BookingState = ReturnType<typeof useBookingState>;
