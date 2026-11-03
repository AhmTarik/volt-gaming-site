import type { ReactNode } from "react";
import { Clock, MapPin, MessageCircle, Phone } from "lucide-react";
import Reveal from "@/components/Reveal";
import { CONTACT } from "@/volt/content";
import { whatsappHref } from "@/volt/whatsapp";
import { tr, useLang, type Text } from "@/i18n";

const COPY = {
  title: { en: "Find us", ar: "مكاننا" },
  intro: {
    en: "Come by, call, or message us on WhatsApp.",
    ar: "تعالى زورنا، أو كلمنا، أو ابعتلنا على الواتساب.",
  },
  location: { en: "Location", ar: "اللوكيشن" },
  area: { en: "New Cairo", ar: "القاهرة الجديدة" },
  openMaps: { en: "Open in Google Maps", ar: "افتح على جوجل ماب" },
  whatsapp: { en: "WhatsApp", ar: "واتساب" },
  call: { en: "Call us", ar: "اتصل بينا" },
  hours: { en: "Opening hours", ar: "مواعيدنا" },
  hoursValue: { en: "Open 24 hours", ar: "فاتحين 24 ساعة" },
  friday: { en: "Friday: from 5 PM", ar: "الجمعة: من 5 العصر" },
  waMsg: { en: "Hi Volt", ar: "أهلاً فولت" },
};

const Card = ({
  href,
  icon,
  color,
  label,
  children,
}: {
  href?: string;
  icon: ReactNode;
  color: string;
  label: string;
  children: ReactNode;
}) => {
  const body = (
    <>
      <span
        className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-110"
        style={{ background: `color-mix(in srgb, ${color} 20%, transparent)`, color }}
      >
        {icon}
      </span>
      <div className="min-w-0">
        <p className="mb-1 font-heading text-sm uppercase tracking-wider text-muted-foreground">{label}</p>
        <div className="font-body text-lg font-medium">{children}</div>
      </div>
    </>
  );
  const cls = "glass-card group flex h-full items-center gap-5 rounded-2xl border p-6 md:p-7";
  const style = { borderColor: `color-mix(in srgb, ${color} 25%, transparent)`, boxShadow: `0 0 15px color-mix(in srgb, ${color} 25%, transparent)` };
  return href ? (
    <a
      href={href}
      target={href.startsWith("tel:") ? undefined : "_blank"}
      rel="noopener noreferrer"
      className={`${cls} transition-transform duration-300 hover:-translate-y-1.5`}
      style={style}
    >
      {body}
    </a>
  ) : (
    <div className={cls} style={style}>
      {body}
    </div>
  );
};

/** Location, WhatsApp, phone and opening hours. */
const ContactSection = () => {
  const lang = useLang();
  const t = (k: keyof typeof COPY) => tr(lang, COPY[k] as Text);
  const phone = (
    <span dir="ltr" className="font-semibold tracking-wide">
      {CONTACT.phoneDisplay}
    </span>
  );

  return (
    <section id="contact" className="py-24 px-4">
      <div className="container mx-auto max-w-3xl">
        <Reveal>
          <h2 className="font-heading text-3xl md:text-5xl font-bold text-center mb-4 gradient-text rtl:leading-snug">
            📍 {t("title")}
          </h2>
          <p className="text-center text-muted-foreground text-lg mb-12 max-w-xl mx-auto">{t("intro")}</p>
        </Reveal>

        <Reveal stagger={0.08} className="grid gap-5 md:grid-cols-2">
          <Reveal className="[&>*]:h-full">
            <Card href={CONTACT.mapsHref} icon={<MapPin size={28} />} color="#2ea8ff" label={t("location")}>
              {t("area")}
              <span className="block text-base text-muted-foreground">{t("openMaps")}</span>
            </Card>
          </Reveal>
          <Reveal className="[&>*]:h-full">
            <Card href={whatsappHref(t("waMsg"))} icon={<MessageCircle size={28} />} color="#22c55e" label={t("whatsapp")}>
              {phone}
            </Card>
          </Reveal>
          <Reveal className="[&>*]:h-full">
            <Card href={CONTACT.telHref} icon={<Phone size={26} />} color="#a78bfa" label={t("call")}>
              {phone}
            </Card>
          </Reveal>
          <Reveal className="[&>*]:h-full">
            <Card icon={<Clock size={28} />} color="#ff2bd6" label={t("hours")}>
              {t("hoursValue")}
              <span className="block text-base text-muted-foreground">{t("friday")}</span>
            </Card>
          </Reveal>
        </Reveal>
      </div>
    </section>
  );
};

export default ContactSection;
