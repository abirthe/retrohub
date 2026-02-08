import { Gamepad2, ShoppingCart, User, LogOut } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const ShopHeader = () => {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');
  const { user, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-50 glass border-b border-border/50">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <Gamepad2 className="h-7 w-7 text-primary animate-pulse-neon" />
          <span className="font-display text-lg font-bold tracking-wider text-foreground">
            NEXUS<span className="text-primary">KEYS</span>
          </span>
        </Link>

        <nav className="flex items-center gap-3">
          <Link to="/">
            <Button
              variant={!isAdmin ? 'default' : 'ghost'}
              size="sm"
              className={!isAdmin ? 'gradient-primary font-display text-xs tracking-wider' : 'font-display text-xs tracking-wider'}
            >
              Shop
            </Button>
          </Link>
          <Link to="/admin">
            <Button
              variant={isAdmin ? 'default' : 'ghost'}
              size="sm"
              className={isAdmin ? 'gradient-primary font-display text-xs tracking-wider' : 'font-display text-xs tracking-wider'}
            >
              Admin
            </Button>
          </Link>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="border-primary/30 hover:border-primary">
                  <User className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-card border-border">
                <DropdownMenuItem disabled className="text-xs text-muted-foreground">
                  {user.email}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={signOut} className="text-destructive">
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link to="/auth">
              <Button variant="outline" size="sm" className="border-primary/30 hover:border-primary font-display text-xs tracking-wider">
                Sign In
              </Button>
            </Link>
          )}

          <Button variant="outline" size="icon" className="relative border-primary/30 hover:border-primary">
            <ShoppingCart className="h-4 w-4" />
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full gradient-accent text-[10px] font-bold flex items-center justify-center text-accent-foreground">
              0
            </span>
          </Button>
        </nav>
      </div>
    </header>
  );
};

export default ShopHeader;
