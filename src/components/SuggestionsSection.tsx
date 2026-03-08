import { MessageSquare } from "lucide-react";

const FEEDBACK_FORM_LINK = "https://forms.gle/3re3qsN4VcqLSdR39";

const SuggestionsSection = () => {
  return (
    <section id="suggestions" className="py-24 px-4 border-t border-border">
      <div className="container mx-auto max-w-5xl">
        <h2 className="font-heading text-3xl md:text-5xl font-bold text-center mb-4 gradient-text">
          💬 Suggestions and Complaints
        </h2>
        <p className="text-center text-muted-foreground text-lg mb-12 max-w-xl mx-auto">
          We’d love to hear your thoughts or feedback on how we can improve your experience.
        </p>

        <div className="flex justify-center">
          <a
            href={FEEDBACK_FORM_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="glass-card rounded-2xl p-8 flex items-center gap-6 neon-glow-cyan border border-neon-cyan/20 hover:-translate-y-2 transition-transform duration-300 group max-w-md w-full"
          >
            <span className="flex-shrink-0 w-14 h-14 rounded-xl bg-neon-cyan/20 flex items-center justify-center text-neon-cyan group-hover:scale-110 transition-transform">
              <MessageSquare size={28} />
            </span>
            <div className="text-left">
              <p className="font-heading text-sm uppercase tracking-wider text-muted-foreground mb-1">
                Customer Feedback
              </p>
              <p className="font-body text-lg font-medium">Fill out our feedback form</p>
            </div>
          </a>
        </div>
      </div>
    </section>
  );
};

export default SuggestionsSection;
