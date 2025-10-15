import { useState } from "react";
import { Link } from "react-router-dom";

export const Header = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="bg-header-bg border-b border-border px-4 sm:px-6 py-3 sm:py-4">
      <div className="container mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div className="flex items-center gap-3 w-full sm:w-auto justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
              <div className="w-4 h-4 bg-background rounded-full"></div>
            </div>
            <h1 className="text-lg sm:text-xl font-semibold text-foreground">
              HR Interview Assistant
            </h1>
          </div>
          <button
            className="sm:hidden px-3 py-2 text-xs border border-border rounded-md text-foreground hover:bg-muted/30"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle navigation"
          >
            Menu
          </button>
        </div>
        <nav className={`${menuOpen ? 'block' : 'hidden'} sm:block w-full sm:w-auto border-t sm:border-0 border-border pt-2 sm:pt-0`}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 text-sm">
            <Link to="/" className="text-muted-foreground hover:text-foreground">Dashboard</Link>
            <Link to="/calendar" className="text-muted-foreground hover:text-foreground">Calendar</Link>
            <Link to="/phone-numbers" className="text-muted-foreground hover:text-foreground">Phone Numbers</Link>
            <Link to="/assistant" className="text-muted-foreground hover:text-foreground">Assistant</Link>
          </div>
        </nav>
      </div>
    </header>
  );
};