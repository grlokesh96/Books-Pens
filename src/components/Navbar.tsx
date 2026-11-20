import React, { useState } from 'react';
import { ShoppingCart, Heart, User, LogOut, Settings, Layers, Notebook, Compass, Info, Mail } from 'lucide-react';
import { User as UserType, CartItem, WishlistItem } from '../types';
import { Theme } from '../hooks/useTheme';
import ThemeToggle from './ThemeToggle';

interface NavbarProps {
  activeView: string;
  setActiveView: (view: string) => void;
  currentUser: UserType | null;
  setCurrentUser: (user: UserType | null) => void;
  cart: CartItem[];
  wishlist: WishlistItem[];
  onOpenCart: () => void;
  onLogout: () => void;
  theme: Theme;
  onToggleTheme: () => void;
}

export default function Navbar({
  activeView,
  setActiveView,
  currentUser,
  setCurrentUser,
  cart,
  wishlist,
  onOpenCart,
  onLogout,
  theme,
  onToggleTheme,
}: NavbarProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  const handleNavClick = (view: string) => {
    setActiveView(view);
    setDropdownOpen(false);
  };

  return (
    <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <button
              onClick={() => handleNavClick('home')}
              className="flex items-center space-x-2 text-xl font-display font-bold text-gray-900 tracking-tight"
              id="nav-logo"
            >
              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-gray-900 text-white font-serif font-bold text-sm">
                B
              </span>
              <span className="text-gray-900 font-display">Ink</span>
              <span className="text-gray-400 font-light">&amp;</span>
              <span className="text-gray-600 font-serif italic font-semibold">Paper</span>
            </button>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            <button
              id="nav-link-home"
              onClick={() => handleNavClick('home')}
              className={`flex items-center space-x-1.5 text-sm font-medium transition-colors ${
                activeView === 'home' ? 'text-gray-950 font-semibold' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <Compass className="w-4 h-4" />
              <span>Discover</span>
            </button>

            <button
              id="nav-link-books"
              onClick={() => handleNavClick('books')}
              className={`flex items-center space-x-1.5 text-sm font-medium transition-colors ${
                activeView === 'books' ? 'text-gray-950 font-semibold' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <Notebook className="w-4 h-4" />
              <span>Books</span>
            </button>

            <button
              id="nav-link-pens"
              onClick={() => handleNavClick('pens')}
              className={`flex items-center space-x-1.5 text-sm font-medium transition-colors ${
                activeView === 'pens' ? 'text-gray-950 font-semibold' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Fine Pens</span>
            </button>

            <button
              id="nav-link-about"
              onClick={() => handleNavClick('about')}
              className={`flex items-center space-x-1.5 text-sm font-medium transition-colors ${
                activeView === 'about' ? 'text-gray-950 font-semibold' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <Info className="w-4 h-4" />
              <span>About</span>
            </button>

            <button
              id="nav-link-contact"
              onClick={() => handleNavClick('contact')}
              className={`flex items-center space-x-1.5 text-sm font-medium transition-colors ${
                activeView === 'contact' ? 'text-gray-950 font-semibold' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <Mail className="w-4 h-4" />
              <span>Contact</span>
            </button>
          </div>

          {/* Icons Bar */}
          <div className="flex items-center space-x-4">
            {/* Theme Toggle */}
            <ThemeToggle theme={theme} onToggle={onToggleTheme} />

            {/* Wishlist Icon */}
            <button
              id="nav-wishlist-btn"
              onClick={() => handleNavClick('wishlist')}
              className="relative p-2 text-gray-500 hover:text-gray-900 transition-colors"
              title="Wishlist"
            >
              <Heart className={`w-5.5 h-5.5 ${activeView === 'wishlist' ? 'fill-red-500 text-red-500' : ''}`} />
              {wishlist.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white">
                  {wishlist.length}
                </span>
              )}
            </button>

            {/* Shopping Cart Icon */}
            <button
              id="nav-cart-btn"
              onClick={onOpenCart}
              className="relative p-2 text-gray-500 hover:text-gray-900 transition-colors"
              title="Shopping Cart"
            >
              <ShoppingCart className={`w-5.5 h-5.5 ${activeView === 'cart' ? 'text-gray-950' : ''}`} />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-gray-900 text-[10px] font-bold text-white ring-2 ring-white">
                  {cartCount}
                </span>
              )}
            </button>

            {/* User Dropdown */}
            <div className="relative">
              <button
                id="nav-user-dropdown-btn"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center space-x-1.5 p-1.5 rounded-full hover:bg-gray-50 transition-colors focus:outline-hidden"
              >
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 border border-gray-200">
                  <User className="w-4 h-4" />
                </div>
                {currentUser && (
                  <span className="hidden lg:inline text-xs font-medium text-gray-700 max-w-[100px] truncate">
                    {currentUser.firstName}
                  </span>
                )}
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-xl bg-white shadow-lg border border-gray-100 py-1 text-sm text-gray-700 animate-in fade-in slide-in-from-top-2 duration-150 z-50">
                  {currentUser ? (
                    <>
                      <div className="px-4 py-2.5 border-b border-gray-50">
                        <p className="font-semibold text-gray-900">{currentUser.firstName} {currentUser.lastName}</p>
                        <p className="text-xs text-gray-400 truncate mt-0.5">{currentUser.email}</p>
                        {currentUser.isAdmin && (
                          <span className="inline-block mt-1.5 px-2 py-0.5 text-[10px] font-bold tracking-wider text-amber-700 bg-amber-50 rounded-full border border-amber-200/50">
                            ADMINISTRATOR
                          </span>
                        )}
                      </div>

                      <button
                        id="user-menu-profile"
                        onClick={() => handleNavClick('profile')}
                        className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center space-x-2 transition-colors"
                      >
                        <User className="w-4 h-4 text-gray-400" />
                        <span>My Profile</span>
                      </button>

                      <button
                        id="user-menu-orders"
                        onClick={() => handleNavClick('orders')}
                        className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center space-x-2 transition-colors"
                      >
                        <Notebook className="w-4 h-4 text-gray-400" />
                        <span>Order History</span>
                      </button>

                      {currentUser.isAdmin && (
                        <button
                          id="user-menu-admin"
                          onClick={() => handleNavClick('admin')}
                          className="w-full text-left px-4 py-2 hover:bg-amber-50/50 text-amber-800 font-medium flex items-center space-x-2 transition-colors border-t border-amber-100/35"
                        >
                          <Settings className="w-4 h-4 text-amber-500" />
                          <span>Admin Dashboard</span>
                        </button>
                      )}

                      <div className="border-t border-gray-50 my-1"></div>

                      <button
                        id="user-menu-logout"
                        onClick={() => {
                          onLogout();
                          setDropdownOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50/50 flex items-center space-x-2 transition-colors"
                      >
                        <LogOut className="w-4 h-4 text-red-400" />
                        <span>Log Out</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="px-4 py-2 border-b border-gray-50 text-xs text-gray-400 font-medium">
                        Welcome to Ink &amp; Paper
                      </div>
                      <button
                        id="user-menu-login"
                        onClick={() => handleNavClick('profile')}
                        className="w-full text-left px-4 py-2.5 hover:bg-gray-50 font-medium text-gray-900 flex items-center space-x-2 transition-colors"
                      >
                        <User className="w-4 h-4 text-gray-400" />
                        <span>Sign In / Register</span>
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
