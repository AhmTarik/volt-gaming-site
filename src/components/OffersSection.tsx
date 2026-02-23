import { Clock, Users, Trophy } from "lucide-react";

const offers = [
  {
    icon: <Clock size={28} />,
    title: "Happy Hour",
    description: "50% off on all setups every weekday from 10 AM to 1 PM.",
    badge: "Mon–Fri",
    glowClass: "neon-glow-purple",
    borderClass: "border-primary/20",
    iconColor: "text-primary",
  },
  {
    icon: <Users size={28} />,
    title: "Group Discount",
    description: "Book 4+ stations together and get 20% off for the whole squad.",
    badge: "4+ Players",
    glowClass: "neon-glow-blue",
    borderClass: "border-secondary/20",
    iconColor: "text-secondary",
  },
  {
    icon: <Trophy size={28} />,
    title: "Weekend Tournament",
    description: "Join our weekly tournaments every Saturday. Prizes for top 3 players!",
    badge: "Saturdays",
    glowClass: "neon-glow-cyan",
    borderClass: "border-neon-cyan/20",
    iconColor: "text-neon-cyan",
  },
];

const OffersSection = () => {
  return (
    <section id="offers" className="py-24 px-4">
      <div className="container mx-auto max-w-5xl">
        <h2 className="font-heading text-3xl md:text-5xl font-bold text-center mb-4 gradient-text">
          🎁 Offers
        </h2>
        <p className="text-center text-muted-foreground text-lg mb-16 max-w-xl mx-auto">
          Level up your experience with our exclusive deals.
        </p>

        <div className="grid md:grid-cols-3 gap-8">
          {offers.map((offer) => (
            <div
              key={offer.title}
              className={`glass-card rounded-2xl p-8 border ${offer.borderClass} ${offer.glowClass} hover:-translate-y-2 transition-transform duration-300 flex flex-col`}
            >
              <span className={`mb-4 ${offer.iconColor}`}>{offer.icon}</span>
              <h3 className="font-heading text-xl font-bold mb-2">{offer.title}</h3>
              <p className="text-muted-foreground font-body text-base mb-6 flex-1">
                {offer.description}
              </p>
              <span className="self-start px-3 py-1 rounded-full text-xs font-heading uppercase tracking-wider bg-muted text-muted-foreground">
                {offer.badge}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default OffersSection;
