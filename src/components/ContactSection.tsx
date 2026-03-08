import { MapPin, MessageCircle } from "lucide-react";

const MAP_LINK = "https://maps.app.goo.gl/7fjgL28b1Fx3qKQa6";
const PHONE_NUMBER = "01500732070";
// WhatsApp: wa.me + country code + number (no + or spaces). 01 -> Egypt 20, so 201500732070
const WHATSAPP_LINK = `https://wa.me/201500732070`;

const ContactSection = () => {
  return (
    <section id="contact" className="py-24 px-4">
      <div className="container mx-auto max-w-5xl">
        <h2 className="font-heading text-3xl md:text-5xl font-bold text-center mb-4 gradient-text">
          📍 Find Us
        </h2>
        <p className="text-center text-muted-foreground text-lg mb-16 max-w-xl mx-auto">
          Visit us or message us on WhatsApp to book your spot.
        </p>

        <div className="grid md:grid-cols-2 gap-8 max-w-2xl mx-auto">
          <a
            href={MAP_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="glass-card rounded-2xl p-8 flex items-center gap-6 neon-glow-blue border border-secondary/20 hover:-translate-y-2 transition-transform duration-300 group"
          >
            <span className="flex-shrink-0 w-14 h-14 rounded-xl bg-secondary/20 flex items-center justify-center text-secondary group-hover:scale-110 transition-transform">
              <MapPin size={28} />
            </span>
            <div>
              <p className="font-heading text-sm uppercase tracking-wider text-muted-foreground mb-1">
                Location
              </p>
              <p className="font-body text-lg font-medium">Open in Google Maps</p>
            </div>
          </a>

          <a
            href={WHATSAPP_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="glass-card rounded-2xl p-8 flex items-center gap-6 neon-glow-green border border-green-500/20 hover:-translate-y-2 transition-transform duration-300 group"
          >
            <span className="flex-shrink-0 w-14 h-14 rounded-xl bg-green-500/20 flex items-center justify-center text-green-500 group-hover:scale-110 transition-transform">
              <MessageCircle size={28} />
            </span>
            <div>
              <p className="font-heading text-sm uppercase tracking-wider text-muted-foreground mb-1">
                WhatsApp
              </p>
              <p className="font-body text-lg font-medium">{PHONE_NUMBER}</p>
            </div>
          </a>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
