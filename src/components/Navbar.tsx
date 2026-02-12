import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { BookOpen, Plus, Brain, User, LogOut, Menu, X } from "lucide-react";
import { useState } from "react";

export default function Navbar() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const links = [
    { to: "/", label: "Home", icon: BookOpen },
    { to: "/browse", label: "Browse", icon: BookOpen },
    { to: "/add", label: "Add Word", icon: Plus },
    { to: "/quiz", label: "Quiz", icon: Brain },
  ];

  return (
    <nav className="sticky top-0 z-50 glass-card border-b border-border/50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-primary" />
          <span className="text-xl font-bold gradient-text font-['Space_Grotesk']">WordVault</span>
        </Link>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-1">
          {links.map(l => (
            <Button key={l.to} variant="ghost" size="sm" asChild>
              <Link to={l.to} className="gap-1.5">
                <l.icon className="h-4 w-4" /> {l.label}
              </Link>
            </Button>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-2">
          {user ? (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/profile"><User className="h-4 w-4 mr-1" /> Profile</Link>
              </Button>
              <Button variant="ghost" size="sm" onClick={() => { signOut(); navigate("/"); }}>
                <LogOut className="h-4 w-4 mr-1" /> Sign Out
              </Button>
            </>
          ) : (
            <Button size="sm" className="gradient-btn rounded-full px-6" asChild>
              <Link to="/auth">Sign In</Link>
            </Button>
          )}
        </div>

        {/* Mobile toggle */}
        <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setOpen(!open)}>
          {open ? <X /> : <Menu />}
        </Button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden glass-card border-t border-border/50 p-4 space-y-2">
          {links.map(l => (
            <Button key={l.to} variant="ghost" className="w-full justify-start" asChild onClick={() => setOpen(false)}>
              <Link to={l.to}><l.icon className="h-4 w-4 mr-2" /> {l.label}</Link>
            </Button>
          ))}
          {user ? (
            <>
              <Button variant="ghost" className="w-full justify-start" asChild onClick={() => setOpen(false)}>
                <Link to="/profile"><User className="h-4 w-4 mr-2" /> Profile</Link>
              </Button>
              <Button variant="ghost" className="w-full justify-start" onClick={() => { signOut(); navigate("/"); setOpen(false); }}>
                <LogOut className="h-4 w-4 mr-2" /> Sign Out
              </Button>
            </>
          ) : (
            <Button className="gradient-btn w-full rounded-full" asChild onClick={() => setOpen(false)}>
              <Link to="/auth">Sign In</Link>
            </Button>
          )}
        </div>
      )}
    </nav>
  );
}
