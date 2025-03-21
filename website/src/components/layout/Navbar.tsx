import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Search, Menu, X, User, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import Authentication from '../auth/Authentication';
import { useAuthUser } from '@/context/AuthUserContext';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/configs/FirebaseConfig';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { authUser, setAuthUser } = useAuthUser();
  const { cartAgent } = useAuthUser();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setAuthUser(user);
      console.log('Auth User:', user.photoURL);
    });
    return () => unsubscribe();
  }, []);

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out',
        isScrolled ? 'py-3 bg-white/80 backdrop-blur-md shadow-sm' : 'py-5 bg-transparent'
      )}
    >
      <div className="container flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="relative w-8 h-8 flex items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
            <span className="animate-pulse-subtle">A</span>
          </div>
          <span className="font-semibold text-lg">AutomataX</span>
        </Link>

        <nav className="hidden md:flex items-center space-x-8">
          <Link to="/marketplace" className="text-sm font-medium hover:text-primary transition-colors">
            Marketplace
          </Link>
          <Link to="/my-workflows" className="text-sm font-medium hover:text-primary transition-colors">
            My Workflows
          </Link>
          <Link to="/templates" className="text-sm font-medium hover:text-primary transition-colors">
            Templates
          </Link>
          <Link to="#" className="text-sm font-medium hover:text-primary transition-colors">
            Developers
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="hidden md:flex gap-2 items-center">
            <Search size={16} />
            <span>Search</span>
          </Button>

          {authUser && (
    <Link to="/cart" className="flex items-center gap-2 relative">
        <ShoppingCart className="w-6 h-6" />

        <div className="absolute -top-2 -right-2 w-4 h-4 flex items-center justify-center bg-red-500 text-white text-xs font-bold rounded-full">
            {cartAgent?.length} 
        </div>
    </Link>
)}

          {authUser ? (
            <Link to="/profile" className="flex items-center gap-2">
              {authUser?.photoURL ? (
                <img src={authUser?.photoURL} alt="Profile" className="w-8 h-8 rounded-full" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center font-medium">
                  {authUser.displayName ? authUser.displayName[0] : <User size={16} />}
                </div>
              )}
              <span className="hidden md:inline text-sm font-medium">{authUser.displayName || 'Profile'}</span>
            </Link>
          ) : (
            <Authentication>
              <Button variant="default" size="sm" className="hidden md:inline-flex">
                Sign In
              </Button>
            </Authentication>
          )}

          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </Button>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-white/95 backdrop-blur-md shadow-md p-4 animate-fade-in">
          <nav className="flex flex-col space-y-4 py-2">
            <Link to="/marketplace" className="px-3 py-2 text-sm font-medium hover:bg-secondary rounded-md transition-colors">
              Marketplace
            </Link>
            <Link to="/my-workflows" className="px-3 py-2 text-sm font-medium hover:bg-secondary rounded-md transition-colors">
              My Workflows
            </Link>
            <Link to="/templates" className="px-3 py-2 text-sm font-medium hover:bg-secondary rounded-md transition-colors">
              Templates
            </Link>
            <Link to="#" className="px-3 py-2 text-sm font-medium hover:bg-secondary rounded-md transition-colors">
              Developers
            </Link>
            <div className="pt-2 border-t">
              {authUser ? (
                <Link to="/profile" className="block text-center py-2 font-medium text-primary">Profile</Link>
              ) : (
                <Button variant="default" size="sm" className="w-full">
                  Sign In
                </Button>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Navbar;
