import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";

const navLinks = [
  { label: "Home", href: "/", isRoute: true },
  { label: "Our PCs", href: "#pcs", isRoute: false },
  { label: "Simulator", href: "#simulator", isRoute: false },
  { label: "Offers", href: "#offers", isRoute: false },
  { label: "Ultra Rooms", href: "/ultra-rooms", isRoute: true },
  { label: "Volt Rooms", href: "/volt-rooms", isRoute: true },
  { label: "Simulator", href: "/simulator", isRoute: true },
  { label: "Book Now", href: "#booking", isRoute: false },
];

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const linkHref = (href: string, isRoute: boolean) => {
    if (isRoute) return href;
    if (location.pathname !== "/") return `/${href}`;
    return href;
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "glass-card py-3" : "bg-transparent py-5"
      }`}
    >
      <div className="container mx-auto flex items-center justify-between px-4">
        <Link to="/" className="font-heading text-xl font-bold gradient-text tracking-wider">
          <span className="md:hidden">Volt</span>
          <span className="hidden md:inline">Volt Gaming Center</span>
        </Link>

        {/* Desktop */}
        <ul className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <li key={link.href + link.label}>
              {link.isRoute ? (
                <Link
                  to={link.href}
                  className="font-body text-sm uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors duration-200"
                >
                  {link.label}
                </Link>
              ) : (
                <a
                  href={linkHref(link.href, link.isRoute)}
                  className="font-body text-sm uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors duration-200"
                >
                  {link.label}
                </a>
              )}
            </li>
          ))}
        </ul>

        {/* Mobile toggle */}
        <button
          onClick={() => setOpen(!open)}
          className="md:hidden text-foreground"
          aria-label="Toggle menu"
        >
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden glass-card mt-2 mx-4 rounded-lg p-4">
          <ul className="flex flex-col gap-4">
            {navLinks.map((link) => (
              <li key={link.href + link.label}>
                {link.isRoute ? (
                  <Link
                    to={link.href}
                    onClick={() => setOpen(false)}
                    className="block font-body text-sm uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                ) : (
                  <a
                    href={linkHref(link.href, link.isRoute)}
                    onClick={() => setOpen(false)}
                    className="block font-body text-sm uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </a>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
