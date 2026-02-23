import { useState } from "react";
import { z } from "zod";

const bookingSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  phone: z.string().trim().min(5, "Phone number is required").max(20),
  setup: z.enum(["ultra", "volt", "simulator"], { required_error: "Select a setup" }),
  date: z.string().min(1, "Date is required"),
  time: z.string().min(1, "Time is required"),
  duration: z.enum(["1", "2", "3"], { required_error: "Select duration" }),
});

type BookingData = z.infer<typeof bookingSchema>;

const BookingSection = () => {
  const [form, setForm] = useState<Partial<BookingData>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const update = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = bookingSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <section id="booking" className="py-24 px-4">
        <div className="container mx-auto max-w-lg text-center">
          <div className="glass-card rounded-2xl p-12 neon-glow-purple border border-primary/20">
            <span className="text-5xl mb-4 block">🎉</span>
            <h2 className="font-heading text-3xl font-bold mb-4 gradient-text">Booking Confirmed!</h2>
            <p className="text-muted-foreground text-lg mb-6">
              We'll get back to you shortly to confirm your session. Get ready to game!
            </p>
            <button
              onClick={() => { setSubmitted(false); setForm({}); }}
              className="px-6 py-3 rounded-lg font-heading text-sm uppercase tracking-wider bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
            >
              Book Another
            </button>
          </div>
        </div>
      </section>
    );
  }

  const inputClass =
    "w-full rounded-lg bg-muted border border-border px-4 py-3 font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow";

  const today = new Date().toISOString().split("T")[0];

  return (
    <section id="booking" className="py-24 px-4">
      <div className="container mx-auto max-w-2xl">
        <h2 className="font-heading text-3xl md:text-5xl font-bold text-center mb-4 gradient-text">
          📅 Book Your Session
        </h2>
        <p className="text-center text-muted-foreground text-lg mb-12">
          Reserve your spot and start gaming.
        </p>

        <form
          onSubmit={handleSubmit}
          className="glass-card rounded-2xl p-8 md:p-10 neon-glow-purple border border-primary/10 space-y-6"
        >
          {/* Name */}
          <div>
            <label className="block font-heading text-xs uppercase tracking-wider mb-2 text-muted-foreground">Name</label>
            <input
              type="text"
              placeholder="Your name"
              value={form.name || ""}
              onChange={(e) => update("name", e.target.value)}
              className={inputClass}
            />
            {errors.name && <p className="text-accent text-sm mt-1">{errors.name}</p>}
          </div>

          {/* Phone */}
          <div>
            <label className="block font-heading text-xs uppercase tracking-wider mb-2 text-muted-foreground">Phone</label>
            <input
              type="tel"
              placeholder="Your phone number"
              value={form.phone || ""}
              onChange={(e) => update("phone", e.target.value)}
              className={inputClass}
            />
            {errors.phone && <p className="text-accent text-sm mt-1">{errors.phone}</p>}
          </div>

          {/* Setup */}
          <div>
            <label className="block font-heading text-xs uppercase tracking-wider mb-2 text-muted-foreground">Setup</label>
            <select
              value={form.setup || ""}
              onChange={(e) => update("setup", e.target.value)}
              className={inputClass}
            >
              <option value="">Select setup</option>
              <option value="ultra">🔥 Ultra PC</option>
              <option value="volt">⚡ Volt PC</option>
              <option value="simulator">🏎️ Car Simulator</option>
            </select>
            {errors.setup && <p className="text-accent text-sm mt-1">{errors.setup}</p>}
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-heading text-xs uppercase tracking-wider mb-2 text-muted-foreground">Date</label>
              <input
                type="date"
                min={today}
                value={form.date || ""}
                onChange={(e) => update("date", e.target.value)}
                className={inputClass}
              />
              {errors.date && <p className="text-accent text-sm mt-1">{errors.date}</p>}
            </div>
            <div>
              <label className="block font-heading text-xs uppercase tracking-wider mb-2 text-muted-foreground">Time</label>
              <input
                type="time"
                value={form.time || ""}
                onChange={(e) => update("time", e.target.value)}
                className={inputClass}
              />
              {errors.time && <p className="text-accent text-sm mt-1">{errors.time}</p>}
            </div>
          </div>

          {/* Duration */}
          <div>
            <label className="block font-heading text-xs uppercase tracking-wider mb-2 text-muted-foreground">Duration</label>
            <div className="grid grid-cols-3 gap-3">
              {["1", "2", "3"].map((h) => (
                <button
                  key={h}
                  type="button"
                  onClick={() => update("duration", h)}
                  className={`py-3 rounded-lg font-heading text-sm uppercase tracking-wider border transition-colors ${
                    form.duration === h
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-muted text-muted-foreground border-border hover:border-primary/50"
                  }`}
                >
                  {h}h
                </button>
              ))}
            </div>
            {errors.duration && <p className="text-accent text-sm mt-1">{errors.duration}</p>}
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="w-full py-4 rounded-lg font-heading text-sm uppercase tracking-wider bg-primary text-primary-foreground hover:opacity-90 transition-opacity neon-glow-purple"
          >
            Submit Booking
          </button>
        </form>
      </div>
    </section>
  );
};

export default BookingSection;
