import { tr, useLang } from "@/i18n";

const Footer = () => {
  const lang = useLang();
  return (
    <footer className="py-8 px-4 border-t border-border">
      <div className="container mx-auto max-w-5xl flex flex-col md:flex-row items-center justify-between gap-4">
        <span className="font-heading text-sm gradient-text tracking-wider">Volt Gaming</span>
        <p className="text-muted-foreground text-sm font-body">
          © {new Date().getFullYear()}{" "}
          {tr(lang, { en: "Volt Gaming Café. All rights reserved.", ar: "فولت جيمنج. كل الحقوق محفوظة." })}
        </p>
      </div>
    </footer>
  );
};

export default Footer;
