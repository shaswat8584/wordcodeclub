import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BookOpen, Brain, Menu, X } from "lucide-react";
import { useState } from "react";

export default function Navbar() {
  const [open, setOpen] = useState(false);

  const links = [
    { to: "/", label: "Home", icon: BookOpen },
    { to: "/browse", label: "Browse", icon: BookOpen },
    { to: "/quiz", label: "Quiz", icon: Brain },
  ];

  return (
    <nav className="sticky top-0 z-50 glass-card border-b border-border/50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-primary" />
          <span className="text-xl font-bold gradient-text font-['Space_Grotesk']">WordVault</span>
        </Link>

        <div className="hidden md:flex items-center gap-1">
          {links.map(l => (
            <Button key={l.to} variant="ghost" size="sm" asChild>
              <Link to={l.to} className="gap-1.5">
                <l.icon className="h-4 w-4" /> {l.label}
              </Link>
            </Button>
          ))}
        </div>

        <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setOpen(!open)}>
          {open ? <X /> : <Menu />}
        </Button>
      </div>

      {open && (
        <div className="md:hidden glass-card border-t border-border/50 p-4 space-y-2">
          {links.map(l => (
            <Button key={l.to} variant="ghost" className="w-full justify-start" asChild onClick={() => setOpen(false)}>
              <Link to={l.to}><l.icon className="h-4 w-4 mr-2" /> {l.label}</Link>
            </Button>
          ))}
        </div>
      )}
    </nav>
  );
}
