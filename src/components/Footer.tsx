const Footer = () => (
  <footer className="py-8 px-4 border-t border-border">
    <div className="container mx-auto max-w-5xl flex flex-col md:flex-row items-center justify-between gap-4">
      <span className="font-heading text-sm gradient-text tracking-wider">Volt Gaming</span>
      <p className="text-muted-foreground text-sm font-body">
        © {new Date().getFullYear()} Volt Gaming Café. All rights reserved.
      </p>
    </div>
  </footer>
);

export default Footer;
