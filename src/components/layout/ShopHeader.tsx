import { useState } from 'react';
import { Gamepad2, ShoppingCart, User, LogOut, Menu, X, LayoutDashboard, Store, Sparkles, Zap, Wrench, MessageSquare } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/contexts/CartContext';
import { useAdmin } from '@/hooks/useAdmin';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

const ShopHeader = () => {
  const location = useLocation();
  const isAdminPage = location.pathname.startsWith('/admin');
  const { user, signOut } = useAuth();
  const { totalItems } = useCart();
  const { isAdmin } = useAdmin();
  const [mobileOpen, setMobileOpen] = useState(false);

  const closeMobile = () => setMobileOpen(false);

  return (
    <header className="sticky top-0 z-50 glass border-b border-border/50">
      <div className="container flex h-16 items-center justify-between gap-2">
        {/* Logo */}
        <Link to="/" onClick={closeMobile} className="flex items-center gap-2 group shrink-0">
          <Gamepad2 className="h-7 w-7 text-primary transition-transform group-hover:scale-105" />
          <span className="font-display text-lg font-bold tracking-wider text-foreground">
            <span className="text-primary">RETRO</span>HUB
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden sm:flex items-center gap-3">
          <Link to="/">
            <Button
              variant={!isAdminPage && location.pathname === '/' && !location.search ? 'default' : 'ghost'}
              size="sm"
              className={!isAdminPage && location.pathname === '/' && !location.search ? 'gradient-primary font-display text-xs tracking-wider' : 'font-display text-xs tracking-wider text-muted-foreground hover:text-white'}
            >
              Shop
            </Button>
          </Link>
          <Link to="/?category=topup">
            <Button
              variant={location.search.includes('category=topup') ? 'default' : 'ghost'}
              size="sm"
              className={location.search.includes('category=topup') ? 'gradient-primary font-display text-xs tracking-wider' : 'font-display text-xs tracking-wider text-muted-foreground hover:text-white'}
            >
              <Zap className="h-3.5 w-3.5 mr-1.5 text-yellow-400" />
              Top-Up
            </Button>
          </Link>
          <Link to="/?category=service">
            <Button
              variant={location.search.includes('category=service') ? 'default' : 'ghost'}
              size="sm"
              className={location.search.includes('category=service') ? 'gradient-primary font-display text-xs tracking-wider' : 'font-display text-xs tracking-wider text-muted-foreground hover:text-white'}
            >
              <Wrench className="h-3.5 w-3.5 mr-1.5 text-cyan-400" />
              Services
            </Button>
          </Link>
          <Link to="/custom-order">
            <Button
              variant={location.pathname === '/custom-order' ? 'default' : 'ghost'}
              size="sm"
              className={location.pathname === '/custom-order' ? 'gradient-primary font-display text-xs tracking-wider' : 'font-display text-xs tracking-wider text-muted-foreground hover:text-white'}
            >
              Custom Order
            </Button>
          </Link>
          {isAdmin && (
            <Link to="/admin">
              <Button
                variant={isAdminPage ? 'default' : 'ghost'}
                size="sm"
                className={isAdminPage ? 'gradient-primary font-display text-xs tracking-wider' : 'font-display text-xs tracking-wider'}
              >
                Admin
              </Button>
            </Link>
          )}

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
                <Link to="/orders">
                  <DropdownMenuItem className="cursor-pointer">
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    My Orders
                  </DropdownMenuItem>
                </Link>
                <DropdownMenuItem onClick={signOut} className="text-destructive cursor-pointer">
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

          <Link to="/checkout">
            <Button variant="outline" size="icon" className="relative border-primary/30 hover:border-primary">
              <ShoppingCart className="h-4 w-4" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full gradient-accent text-[10px] font-bold flex items-center justify-center text-accent-foreground">
                  {totalItems}
                </span>
              )}
            </Button>
          </Link>
        </nav>

        {/* Mobile right cluster */}
        <div className="flex sm:hidden items-center gap-2">
          {/* Cart icon always visible on mobile */}
          <Link to="/checkout" onClick={closeMobile}>
            <Button variant="outline" size="icon" className="relative border-primary/30 hover:border-primary h-9 w-9">
              <ShoppingCart className="h-4 w-4" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full gradient-accent text-[10px] font-bold flex items-center justify-center text-accent-foreground">
                  {totalItems}
                </span>
              )}
            </Button>
          </Link>

          {/* Hamburger */}
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 border border-white/10"
            onClick={() => setMobileOpen(o => !o)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile drawer */}
      <div
        className={cn(
          'sm:hidden overflow-hidden transition-all duration-300 ease-in-out',
          mobileOpen ? 'max-h-[80vh] border-b border-border/50' : 'max-h-0'
        )}
      >
        <nav className="container py-4 flex flex-col gap-1 overflow-y-auto max-h-[80vh]">
          <Link
            to="/"
            onClick={closeMobile}
            className={cn(
              'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-display tracking-wide transition-colors',
              !isAdminPage && location.pathname !== '/custom-order' ? 'bg-primary/10 text-primary border border-primary/20' : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
            )}
          >
            <Store className="h-4 w-4" />
            Shop
          </Link>

          <Link
            to="/?category=topup"
            onClick={closeMobile}
            className={cn(
              'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-display tracking-wide transition-colors',
              location.search.includes('category=topup') ? 'bg-primary/10 text-primary border border-primary/20' : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
            )}
          >
            <Zap className="h-4 w-4 text-yellow-400" />
            Top-Up
          </Link>

          <Link
            to="/?category=service"
            onClick={closeMobile}
            className={cn(
              'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-display tracking-wide transition-colors',
              location.search.includes('category=service') ? 'bg-primary/10 text-primary border border-primary/20' : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
            )}
          >
            <Wrench className="h-4 w-4 text-cyan-400" />
            Services
          </Link>

          <Link
            to="/custom-order"
            onClick={closeMobile}
            className={cn(
              'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-display tracking-wide transition-colors',
              location.pathname === '/custom-order' ? 'bg-primary/10 text-primary border border-primary/20' : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
            )}
          >
            <MessageSquare className="h-4 w-4 text-primary" />
            Custom Order
          </Link>

          {isAdmin && (
            <Link
              to="/admin"
              onClick={closeMobile}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-display tracking-wide transition-colors',
                isAdminPage ? 'bg-primary/10 text-primary border border-primary/20' : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
              )}
            >
              <LayoutDashboard className="h-4 w-4" />
              Admin
            </Link>
          )}

          {user && (
            <Link
              to="/orders"
              onClick={closeMobile}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-display tracking-wide text-muted-foreground hover:bg-white/5 hover:text-foreground transition-colors"
            >
              <ShoppingCart className="h-4 w-4" />
              My Orders
            </Link>
          )}

          <div className="border-t border-border/30 mt-1 pt-2">
            {user ? (
              <div>
                <p className="px-4 py-1 text-xs text-muted-foreground truncate">{user.email}</p>
                <button
                  onClick={() => { signOut(); closeMobile(); }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-display tracking-wide text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              </div>
            ) : (
              <Link
                to="/auth"
                onClick={closeMobile}
                className="flex items-center justify-center gap-2 mx-2 py-3 rounded-xl text-sm font-display tracking-wider gradient-primary text-primary-foreground"
              >
                <User className="h-4 w-4" />
                Sign In / Register
              </Link>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
};

export default ShopHeader;
