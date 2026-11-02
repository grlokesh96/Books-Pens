import React, { useState, useEffect } from 'react';
import { Search, SlidersHorizontal, ArrowUpDown, Star, X, Send, ShoppingCart, Heart, ArrowRight, User as UserIcon, ShieldAlert, Sparkles, Plus, ClipboardList } from 'lucide-react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import ProductCard from './components/ProductCard';
import Cart from './components/Cart';
import Checkout from './components/Checkout';
import AdminDashboard from './components/AdminDashboard';
import ContactAbout from './components/ContactAbout';
import { Product, Book, Pen, CartItem, WishlistItem, User, Order, Coupon, Review, CATEGORIES, BRANDS, INK_COLORS } from './types';
import { INITIAL_BOOKS, INITIAL_PENS, INITIAL_COUPONS } from './data/initialData';

// Setup some mock initial orders so order history looks fully loaded
const INITIAL_ORDERS: Order[] = [
  {
    id: 'ORD-894721',
    userId: 'user-1',
    date: '2026-07-01',
    items: [
      {
        id: 'ord-item-1',
        productId: 'b1',
        name: 'The Echo of Silence',
        type: 'book',
        price: 17.09,
        quantity: 1,
        image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=600'
      },
      {
        id: 'ord-item-2',
        productId: 'p2',
        name: 'Gel-Glide Pro',
        type: 'pen',
        price: 2.49,
        quantity: 3,
        image: 'https://images.unsplash.com/photo-1585336139057-3c509c12002e?auto=format&fit=crop&q=80&w=600'
      }
    ],
    subtotal: 30.56,
    tax: 2.44,
    shipping: 4.99,
    discountAmount: 0,
    total: 37.99,
    shippingAddress: {
      fullName: 'Jane Miller',
      addressLine: '456 Beacon Hill',
      city: 'Boston',
      state: 'MA',
      zipCode: '02108',
      country: 'United States'
    },
    billingAddress: {
      fullName: 'Jane Miller',
      addressLine: '456 Beacon Hill',
      city: 'Boston',
      state: 'MA',
      zipCode: '02108',
      country: 'United States'
    },
    paymentMethod: 'Credit Card',
    status: 'Delivered',
    trackingNumber: 'TRK89304859US'
  }
];

const INITIAL_USER: User = {
  id: 'user-1',
  username: 'janemiller',
  email: 'jane@inkandpaper.com',
  firstName: 'Jane',
  lastName: 'Miller',
  phone: '+1 (555) 123-4567',
  address: '456 Beacon Hill',
  city: 'Boston',
  zipCode: '02108',
  country: 'United States',
  isAdmin: true // Allow standard admin toggles so they can test the console immediately!
};

export default function App() {
  // Global States (using LocalStorage for durable persistence in browser refreshes!)
  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('ink_paper_products');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return [...INITIAL_BOOKS, ...INITIAL_PENS];
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem('ink_paper_orders');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return INITIAL_ORDERS;
  });

  const [coupons, setCoupons] = useState<Coupon[]>(() => {
    const saved = localStorage.getItem('ink_paper_coupons');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return INITIAL_COUPONS;
  });

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('ink_paper_user');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return INITIAL_USER;
  });

  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('ink_paper_cart');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return [];
  });

  const [wishlist, setWishlist] = useState<WishlistItem[]>(() => {
    const saved = localStorage.getItem('ink_paper_wishlist');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return [];
  });

  const [saveForLaterList, setSaveForLaterList] = useState<Product[]>(() => {
    const saved = localStorage.getItem('ink_paper_saved_items');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return [];
  });

  // Sync state changes to localStorage
  useEffect(() => {
    localStorage.setItem('ink_paper_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('ink_paper_orders', JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem('ink_paper_coupons', JSON.stringify(coupons));
  }, [coupons]);

  useEffect(() => {
    localStorage.setItem('ink_paper_user', JSON.stringify(currentUser));
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('ink_paper_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem('ink_paper_wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  useEffect(() => {
    localStorage.setItem('ink_paper_saved_items', JSON.stringify(saveForLaterList));
  }, [saveForLaterList]);

  // Views Orchestration
  const [activeView, setActiveView] = useState<string>('home'); // 'home', 'books', 'pens', 'about', 'contact', 'wishlist', 'orders', 'admin', 'profile'
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showCartDrawer, setShowCartDrawer] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterBrand, setFilterBrand] = useState('All');
  const [filterInkColor, setFilterInkColor] = useState('All');
  const [priceMax, setPriceMax] = useState<number>(150);
  const [sortBy, setSortBy] = useState<string>('popular');

  // Review Form States
  const [reviewName, setReviewName] = useState('');
  const [reviewEmail, setReviewEmail] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');

  // Newsletter state
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false);

  // Profile auth form states
  const [profUsername, setProfUsername] = useState(currentUser?.username || '');
  const [profEmail, setProfEmail] = useState(currentUser?.email || '');
  const [profFirstName, setProfFirstName] = useState(currentUser?.firstName || '');
  const [profLastName, setProfLastName] = useState(currentUser?.lastName || '');
  const [profAddress, setProfAddress] = useState(currentUser?.address || '');
  const [profCity, setProfCity] = useState(currentUser?.city || '');
  const [profZip, setProfZip] = useState(currentUser?.zipCode || '');
  const [profCountry, setProfCountry] = useState(currentUser?.country || 'United States');
  const [profIsAdmin, setProfIsAdmin] = useState(currentUser?.isAdmin || false);

  // Reset filters when swapping catalogs
  useEffect(() => {
    setSearchQuery('');
    setFilterCategory('All');
    setFilterBrand('All');
    setFilterInkColor('All');
    setPriceMax(150);
    setSortBy('popular');
  }, [activeView]);

  // Update form inputs when current user changes
  useEffect(() => {
    if (currentUser) {
      setProfUsername(currentUser.username);
      setProfEmail(currentUser.email);
      setProfFirstName(currentUser.firstName);
      setProfLastName(currentUser.lastName);
      setProfAddress(currentUser.address);
      setProfCity(currentUser.city);
      setProfZip(currentUser.zipCode);
      setProfCountry(currentUser.country);
      setProfIsAdmin(currentUser.isAdmin);
    }
  }, [currentUser]);

  // Handle Cart updates
  const handleAddToCart = (product: Product, quantity: number = 1) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        const nextQty = Math.min(product.stock, existing.quantity + quantity);
        return prev.map(item => item.id === product.id ? { ...item, quantity: nextQty } : item);
      }
      return [...prev, { id: product.id, product, quantity: Math.min(product.stock, quantity) }];
    });
    // Visual trigger
    setShowCartDrawer(true);
  };

  const handleUpdateCartQuantity = (id: string, qty: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const maxLimit = item.product.stock;
        return { ...item, quantity: Math.max(1, Math.min(maxLimit, qty)) };
      }
      return item;
    }));
  };

  const handleRemoveFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const handleSaveForLater = (cartItem: CartItem) => {
    handleRemoveFromCart(cartItem.id);
    setSaveForLaterList(prev => {
      if (prev.some(p => p.id === cartItem.id)) return prev;
      return [...prev, cartItem.product];
    });
  };

  const handleMoveToCartFromSaved = (product: Product) => {
    setSaveForLaterList(prev => prev.filter(p => p.id !== product.id));
    handleAddToCart(product, 1);
  };

  const handleRemoveFromSaved = (id: string) => {
    setSaveForLaterList(prev => prev.filter(p => p.id !== id));
  };

  // Wishlist actions
  const handleToggleWishlist = (product: Product) => {
    setWishlist(prev => {
      const isExist = prev.some(item => item.product.id === product.id);
      if (isExist) {
        return prev.filter(item => item.product.id !== product.id);
      }
      return [...prev, { id: 'wish-' + product.id, product }];
    });
  };

  // Reviews submission
  const handleAddReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || !reviewName || !reviewComment) return;

    const newReview: Review = {
      id: 'rev-' + Math.floor(1000 + Math.random() * 9000),
      productId: selectedProduct.id,
      userName: reviewName,
      userEmail: reviewEmail || 'anonymous@example.com',
      rating: reviewRating,
      comment: reviewComment,
      date: new Date().toISOString().split('T')[0],
    };

    // Append review and update product average rating
    setProducts(prev => prev.map(p => {
      if (p.id === selectedProduct.id) {
        const updatedReviews = [...p.reviews, newReview];
        const avgRating = Number(
          (updatedReviews.reduce((sum, r) => sum + r.rating, 0) / updatedReviews.length).toFixed(1)
        );
        
        const nextProduct = {
          ...p,
          reviews: updatedReviews,
          rating: avgRating,
        };

        // Keep selected product modal synchronized
        setSelectedProduct(nextProduct);
        return nextProduct;
      }
      return p;
    }));

    // Reset fields
    setReviewName('');
    setReviewEmail('');
    setReviewComment('');
    setReviewRating(5);
  };

  // Checkout handling
  const handleProceedToCheckout = (coupon: Coupon | null) => {
    setAppliedCoupon(coupon);
    setActiveView('checkout');
    setShowCartDrawer(false);
  };

  const handlePlaceOrder = (newOrder: Order) => {
    setOrders(prev => [newOrder, ...prev]);
    // Deduct stock levels from purchased items
    setProducts(prev => prev.map(p => {
      const orderedItem = newOrder.items.find(item => item.productId === p.id);
      if (orderedItem) {
        return {
          ...p,
          stock: Math.max(0, p.stock - orderedItem.quantity)
        };
      }
      return p;
    }));
  };

  const handleClearCartAndComplete = () => {
    setCart([]);
    setAppliedCoupon(null);
    setActiveView('orders');
  };

  // Subscriptions newsletter
  const handleSubscribeNewsletter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail) return;
    setNewsletterSubscribed(true);
    setNewsletterEmail('');
    setTimeout(() => {
      setNewsletterSubscribed(false);
    }, 4000);
  };

  // User Profile registration / details save
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const newUser: User = {
      id: currentUser?.id || 'user-' + Math.floor(1000 + Math.random() * 9000),
      username: profUsername || 'guest',
      email: profEmail || 'guest@example.com',
      firstName: profFirstName || 'Guest',
      lastName: profLastName || 'User',
      phone: currentUser?.phone || '',
      address: profAddress,
      city: profCity,
      zipCode: profZip,
      country: profCountry,
      isAdmin: profIsAdmin
    };
    setCurrentUser(newUser);
    alert('User Profile updated successfully!');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCart([]);
    setWishlist([]);
    setSaveForLaterList([]);
    setActiveView('home');
  };

  // Filtering products
  const getFilteredProducts = (type: 'book' | 'pen') => {
    return products.filter(p => {
      if (p.type !== type) return false;
      
      // Keyword search (Matches title, model, description, author, category, brand)
      const query = searchQuery.toLowerCase();
      const matchesSearch = query === '' || 
        p.id.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query) ||
        (type === 'book' && (p as Book).title.toLowerCase().includes(query)) ||
        (type === 'book' && (p as Book).author.toLowerCase().includes(query)) ||
        (type === 'book' && (p as Book).category.toLowerCase().includes(query)) ||
        (type === 'pen' && (p as Pen).model.toLowerCase().includes(query)) ||
        (type === 'pen' && (p as Pen).brand.toLowerCase().includes(query));

      if (!matchesSearch) return false;

      // Category filters
      if (type === 'book' && filterCategory !== 'All' && (p as Book).category !== filterCategory) return false;
      if (type === 'pen' && filterCategory !== 'All' && (p as Pen).brand !== filterCategory) return false; // Brands double as Categories for pens in this simplified model

      // Brand select
      if (type === 'pen' && filterBrand !== 'All' && (p as Pen).brand !== filterBrand) return false;

      // Ink color select
      if (type === 'pen' && filterInkColor !== 'All' && (p as Pen).inkColor !== filterInkColor) return false;

      // Price threshold
      const finalPrice = p.price * (1 - p.discount / 100);
      if (finalPrice > priceMax) return false;

      return true;
    }).sort((a, b) => {
      const aFinal = a.price * (1 - a.discount / 100);
      const bFinal = b.price * (1 - b.discount / 100);
      
      if (sortBy === 'price-low') return aFinal - bFinal;
      if (sortBy === 'price-high') return bFinal - aFinal;
      if (sortBy === 'newest') return b.id.localeCompare(a.id); // Sku ID represents newest
      return b.rating - a.rating; // Popular default (highest rating)
    });
  };

  const featuredBooks = products.filter(p => p.type === 'book' && p.featured);
  const featuredPens = products.filter(p => p.type === 'pen' && p.featured);
  const bestsellerBooks = products.filter(p => p.type === 'book' && p.bestSeller);
  const bestsellerPens = products.filter(p => p.type === 'pen' && p.bestSeller);

  return (
    <div className="min-h-screen bg-[#fafafa] text-gray-900 flex flex-col font-sans selection:bg-gray-950 selection:text-white">
      
      {/* Navigation Header */}
      <Navbar
        activeView={activeView}
        setActiveView={setActiveView}
        currentUser={currentUser}
        setCurrentUser={setCurrentUser}
        cart={cart}
        wishlist={wishlist}
        onOpenCart={() => setShowCartDrawer(true)}
        onLogout={handleLogout}
      />

      {/* Main Container Wrapper */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* VIEW: HOME PAGE */}
        {activeView === 'home' && (
          <div className="space-y-16 animate-in fade-in duration-300">
            {/* Curated Hero block */}
            <Hero
              onExploreBooks={() => setActiveView('books')}
              onExplorePens={() => setActiveView('pens')}
            />

            {/* Grid Sections: Featured Products */}
            <div className="space-y-8">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
                <div>
                  <h2 className="text-xl md:text-2xl font-bold font-display tracking-tight text-gray-900">Featured Curations</h2>
                  <p className="text-xs text-gray-500 font-sans mt-0.5">Exceptional books and fine pens carefully selected for quality, detail, and craftsmanship.</p>
                </div>
                <button
                  onClick={() => setActiveView('books')}
                  className="text-xs font-semibold text-gray-500 hover:text-gray-900 flex items-center space-x-1.5 transition-colors"
                >
                  <span>See all collection</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Grid of featured books + pens */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {featuredBooks.slice(0, 2).map(p => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    onAddToCart={handleAddToCart}
                    onToggleWishlist={handleToggleWishlist}
                    isWishlisted={wishlist.some(w => w.product.id === p.id)}
                    onViewDetails={setSelectedProduct}
                  />
                ))}
                {featuredPens.slice(0, 2).map(p => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    onAddToCart={handleAddToCart}
                    onToggleWishlist={handleToggleWishlist}
                    isWishlisted={wishlist.some(w => w.product.id === p.id)}
                    onViewDetails={setSelectedProduct}
                  />
                ))}
              </div>
            </div>

            {/* Grid Sections: Best Sellers */}
            <div className="space-y-8">
              <div>
                <h2 className="text-xl md:text-2xl font-bold font-display tracking-tight text-gray-900">Best Sellers &amp; Writers Classics</h2>
                <p className="text-xs text-gray-500 font-sans mt-0.5">Our most loved, high-rating, and frequently purchased instruments and papers.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {bestsellerBooks.slice(0, 2).map(p => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    onAddToCart={handleAddToCart}
                    onToggleWishlist={handleToggleWishlist}
                    isWishlisted={wishlist.some(w => w.product.id === p.id)}
                    onViewDetails={setSelectedProduct}
                  />
                ))}
                {bestsellerPens.slice(0, 2).map(p => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    onAddToCart={handleAddToCart}
                    onToggleWishlist={handleToggleWishlist}
                    isWishlisted={wishlist.some(w => w.product.id === p.id)}
                    onViewDetails={setSelectedProduct}
                  />
                ))}
              </div>
            </div>

            {/* Testimonials */}
            <div className="bg-gray-50 rounded-3xl border border-gray-100 p-8 space-y-6">
              <div className="text-center max-w-xl mx-auto space-y-2">
                <h3 className="text-xl font-bold font-display text-gray-900 tracking-tight">Analog Reviews</h3>
                <p className="text-xs text-gray-400 font-sans">Read thoughts from curated writers, developers, and ink artists around the globe.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs font-sans text-gray-600">
                <div className="bg-white border border-gray-50 p-5 rounded-2xl shadow-xs space-y-3">
                  <div className="flex text-amber-400">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" /><Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" /><Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" /><Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" /><Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  </div>
                  <p className="italic leading-relaxed">
                    &quot;The Apex Fountain Pen is the finest writing utensil I have ever held. Perfectly balanced, with steady Midnight Blue flow. It turns daily blueprint drafting into a ritual.&quot;
                  </p>
                  <p className="font-bold text-gray-800">— Gregory S., Software Architect</p>
                </div>

                <div className="bg-white border border-gray-50 p-5 rounded-2xl shadow-xs space-y-3">
                  <div className="flex text-amber-400">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" /><Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" /><Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" /><Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" /><Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  </div>
                  <p className="italic leading-relaxed">
                    &quot;As an author, I am highly picky about paper grains. The Echo of Silence description motivated me, and both the book and the WriteTech gel pen exceeded my standards. Speedy shipping!&quot;
                  </p>
                  <p className="font-bold text-gray-800">— Miranda L., Novelist</p>
                </div>

                <div className="bg-white border border-gray-50 p-5 rounded-2xl shadow-xs space-y-3">
                  <div className="flex text-amber-400">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" /><Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" /><Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" /><Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" /><Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  </div>
                  <p className="italic leading-relaxed">
                    &quot;We are in a digital over-saturation age. Buying items from Ink &amp; Paper feels like treating myself to cognitive health. The packaging design alone is a masterpiece of typography.&quot;
                  </p>
                  <p className="font-bold text-gray-800">— Ethan W., Creative Lead</p>
                </div>
              </div>
            </div>

            {/* Newsletter Subscription */}
            <div className="relative bg-gray-950 text-white rounded-3xl overflow-hidden p-8 md:p-12 shadow-xl flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="space-y-3.5 max-w-md text-center md:text-left">
                <h3 className="text-xl md:text-2xl font-bold font-display tracking-tight">The Analog Chronicle</h3>
                <p className="text-xs text-gray-400 leading-relaxed font-sans">
                  Join our weekly newsletter. Get early notifications for rare book acquisitions, luxury pen drops, restocks, and exclusive curation insights.
                </p>
              </div>

              {newsletterSubscribed ? (
                <div className="bg-emerald-50/10 border border-emerald-500/30 text-emerald-300 p-4 rounded-xl text-xs font-sans max-w-sm shrink-0">
                  <p className="font-bold">Subscription Confirmed!</p>
                  <p className="text-[11px] text-gray-400 mt-1">Check your inbox for a 15% discount code code.</p>
                </div>
              ) : (
                <form onSubmit={handleSubscribeNewsletter} className="flex flex-col sm:flex-row w-full max-w-sm gap-2.5 shrink-0 text-xs font-sans">
                  <input
                    type="email"
                    required
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    placeholder="Enter email for discount code..."
                    className="flex-grow bg-white/10 border border-white/15 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-hidden focus:ring-1 focus:ring-amber-200 focus:bg-white/15 transition-all"
                  />
                  <button
                    type="submit"
                    className="px-5 py-3 bg-white hover:bg-gray-100 text-gray-950 font-bold rounded-xl flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
                  >
                    <Send className="w-4 h-4 text-gray-950" />
                    <span>Subscribe</span>
                  </button>
                </form>
              )}
            </div>
          </div>
        )}

        {/* VIEW: CATALOGS (BOOKS or PENS) */}
        {(activeView === 'books' || activeView === 'pens') && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-in fade-in duration-300">
            
            {/* Left Column: Filters Sidebar */}
            <div className="lg:col-span-3 bg-white border border-gray-100 rounded-3xl p-6 shadow-xs space-y-6">
              
              {/* Header row */}
              <div className="flex items-center justify-between border-b border-gray-50 pb-3">
                <span className="text-xs font-bold font-mono uppercase tracking-wider text-gray-400 flex items-center space-x-1.5">
                  <SlidersHorizontal className="w-4 h-4 text-gray-400" />
                  <span>Filters</span>
                </span>
                
                <button
                  onClick={() => {
                    setFilterCategory('All');
                    setFilterBrand('All');
                    setFilterInkColor('All');
                    setPriceMax(150);
                    setSearchQuery('');
                  }}
                  className="text-[10px] font-bold text-gray-400 hover:text-gray-900 transition-colors"
                >
                  Clear all
                </button>
              </div>

              {/* Filter 1: Search Input */}
              <div className="space-y-2">
                <label className="block text-[11px] font-mono uppercase tracking-wider text-gray-400 font-bold">Search Keywords</label>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={activeView === 'books' ? "Search books/author..." : "Search brand/model..."}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-3 py-2 text-xs focus:ring-1 focus:ring-gray-900 focus:outline-hidden font-sans"
                  />
                </div>
              </div>

              {/* Filter 2: Category list */}
              <div className="space-y-2 text-xs font-sans">
                <label className="block text-[11px] font-mono uppercase tracking-wider text-gray-400 font-bold">
                  {activeView === 'books' ? 'Book Categories' : 'Pen Brands'}
                </label>
                <div className="space-y-1.5">
                  {(activeView === 'books' ? CATEGORIES.books : BRANDS).map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setFilterCategory(cat)}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg transition-colors flex items-center justify-between ${
                        filterCategory === cat
                          ? 'bg-gray-900 text-white font-bold'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <span>{cat}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom specs for Pens */}
              {activeView === 'pens' && (
                <>
                  {/* Pen ink colors selector */}
                  <div className="space-y-2 text-xs">
                    <label className="block text-[11px] font-mono uppercase tracking-wider text-gray-400 font-bold">Ink Color</label>
                    <select
                      value={filterInkColor}
                      onChange={(e) => setFilterInkColor(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-gray-900 focus:outline-hidden font-sans"
                    >
                      {INK_COLORS.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              {/* Filter 3: Price threshold */}
              <div className="space-y-2">
                <div className="flex justify-between items-baseline">
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-gray-400 font-bold">Max Price</label>
                  <span className="text-xs font-mono font-bold text-gray-900">${priceMax}</span>
                </div>
                <input
                  type="range"
                  min="3"
                  max="150"
                  value={priceMax}
                  onChange={(e) => setPriceMax(Number(e.target.value))}
                  className="w-full accent-gray-900"
                />
              </div>

              {/* Sorting option */}
              <div className="space-y-2 text-xs font-sans">
                <label className="block text-[11px] font-mono uppercase tracking-wider text-gray-400 font-bold flex items-center space-x-1">
                  <ArrowUpDown className="w-3.5 h-3.5" />
                  <span>Sort By</span>
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-hidden focus:ring-1 focus:ring-gray-900"
                >
                  <option value="popular">Popularity (Rating)</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="newest">Newest Sku Releases</option>
                </select>
              </div>

            </div>

            {/* Right Column: Catalog Grid */}
            <div className="lg:col-span-9 space-y-6">
              <div className="flex justify-between items-center">
                <div className="text-xs text-gray-500 font-sans">
                  Showing <span className="font-bold text-gray-900">{getFilteredProducts(activeView === 'books' ? 'book' : 'pen').length}</span> Curated {activeView === 'books' ? 'Books' : 'Writing Instruments'}
                </div>
              </div>

              {getFilteredProducts(activeView === 'books' ? 'book' : 'pen').length === 0 ? (
                <div className="text-center py-20 bg-white border border-gray-100 rounded-3xl shadow-xs">
                  <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <h4 className="text-sm font-bold text-gray-900">No products match filters.</h4>
                  <p className="text-xs text-gray-500 font-sans mt-1">Try relaxing your search terms or clearing categories filter.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {getFilteredProducts(activeView === 'books' ? 'book' : 'pen').map(p => (
                    <ProductCard
                      key={p.id}
                      product={p}
                      onAddToCart={handleAddToCart}
                      onToggleWishlist={handleToggleWishlist}
                      isWishlisted={wishlist.some(w => w.product.id === p.id)}
                      onViewDetails={setSelectedProduct}
                    />
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

        {/* VIEW: ABOUT / STORY / TEAM & CONTACT */}
        {(activeView === 'about' || activeView === 'contact') && (
          <ContactAbout initialView={activeView as 'about' | 'contact'} />
        )}

        {/* VIEW: WISHLIST OVERVIEW */}
        {activeView === 'wishlist' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div>
              <h2 className="text-xl md:text-2xl font-bold font-display tracking-tight text-gray-900">My Saved Wishlist</h2>
              <p className="text-xs text-gray-500 font-sans mt-0.5">Explore your catalog bookmarks. Keep track of limited stock and quickly transfer items to your cart.</p>
            </div>

            {wishlist.length === 0 ? (
              <div className="text-center py-20 bg-white border border-gray-100 rounded-3xl shadow-xs">
                <Heart className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                <h4 className="text-sm font-bold text-gray-800">Your wishlist is empty.</h4>
                <p className="text-xs text-gray-400 font-sans mt-1">Browse our catalogs and bookmark products with the heart button!</p>
                <button
                  onClick={() => setActiveView('books')}
                  className="mt-6 px-4.5 py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-xs font-semibold transition-all"
                >
                  Browse Library Catalog
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {wishlist.map(item => (
                  <ProductCard
                    key={item.id}
                    product={item.product}
                    onAddToCart={handleAddToCart}
                    onToggleWishlist={handleToggleWishlist}
                    isWishlisted={true}
                    onViewDetails={setSelectedProduct}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* VIEW: ORDER HISTORY & DETAILS FOR CUSTOMERS */}
        {activeView === 'orders' && (
          <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300 text-xs font-sans">
            <div>
              <h2 className="text-xl md:text-2xl font-bold font-display tracking-tight text-gray-900">My Order History</h2>
              <p className="text-xs text-gray-500 mt-0.5">Track shipment states, download receipt invoices, and verify previous curated purchases.</p>
            </div>

            {orders.filter(o => o.userId === (currentUser?.id || 'guest-user')).length === 0 ? (
              <div className="text-center py-16 bg-white border border-gray-100 rounded-3xl shadow-xs">
                <ClipboardList className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                <h4 className="text-sm font-bold text-gray-800">No placed orders found.</h4>
                <p className="text-xs text-gray-400 mt-1">Complete a purchase through checkout to start tracking orders.</p>
              </div>
            ) : (
              <div className="space-y-5">
                {orders
                  .filter(o => o.userId === (currentUser?.id || 'guest-user'))
                  .map((o) => (
                    <div key={o.id} className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-xs">
                      {/* Order header information */}
                      <div className="p-4 bg-gray-50 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div className="flex flex-wrap gap-4 items-center">
                          <div>
                            <span className="text-[9px] font-mono text-gray-400 block uppercase">ORDER ID</span>
                            <span className="font-mono font-bold text-gray-900">{o.id}</span>
                          </div>
                          <div>
                            <span className="text-[9px] font-mono text-gray-400 block uppercase">DATE PLACED</span>
                            <span className="font-bold text-gray-800">{o.date}</span>
                          </div>
                          <div>
                            <span className="text-[9px] font-mono text-gray-400 block uppercase">TOTAL AMOUNT</span>
                            <span className="font-mono font-bold text-gray-900">${o.total.toFixed(2)}</span>
                          </div>
                        </div>

                        <div>
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider ${
                            o.status === 'Processing'
                              ? 'bg-amber-50 text-amber-700 border border-amber-100'
                              : o.status === 'Shipped'
                              ? 'bg-teal-50 text-teal-700 border border-teal-100'
                              : o.status === 'Delivered'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-100/50'
                              : 'bg-red-50 text-red-700 border border-red-100'
                          }`}>
                            {o.status.toUpperCase()}
                          </span>
                        </div>
                      </div>

                      {/* Items order details */}
                      <div className="p-4 grid grid-cols-1 md:grid-cols-12 gap-6">
                        <div className="md:col-span-7 space-y-3.5">
                          {o.items.map((item) => (
                            <div key={item.id} className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <img src={item.image} alt="" className="w-8 h-10 object-cover rounded bg-gray-50 border border-gray-100 shrink-0" />
                                <div>
                                  <p className="font-semibold text-gray-800 line-clamp-1">{item.name}</p>
                                  <p className="text-[10px] text-gray-400">Qty: {item.quantity} x ${item.price.toFixed(2)}</p>
                                </div>
                              </div>
                              <span className="font-mono font-semibold text-gray-900">${(item.price * item.quantity).toFixed(2)}</span>
                            </div>
                          ))}
                        </div>

                        <div className="md:col-span-5 border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-6 space-y-2">
                          <p className="text-gray-400 font-mono text-[9px] uppercase tracking-wider font-bold">Delivery Status</p>
                          {o.trackingNumber && (
                            <p className="text-[11px] font-mono font-semibold">
                              Tracking ID: <span className="text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-100">{o.trackingNumber}</span>
                            </p>
                          )}
                          <p className="text-gray-500 text-[11px] mt-1">
                            Destination: <span className="font-bold text-gray-700">{o.shippingAddress.city}, {o.shippingAddress.state}</span>
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* VIEW: USER PROFILE / LOGIN SIMULATOR */}
        {activeView === 'profile' && (
          <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-300 font-sans text-xs">
            <div>
              <h2 className="text-xl md:text-2xl font-bold font-display tracking-tight text-gray-900">User Account</h2>
              <p className="text-xs text-gray-500 mt-0.5">Customize your personal credentials, billing destinations, and administrator privilege status.</p>
            </div>

            {currentUser ? (
              <form onSubmit={handleSaveProfile} className="bg-white border border-gray-100 rounded-3xl p-6 md:p-8 shadow-xs space-y-6">
                <div className="flex items-center justify-between border-b border-gray-50 pb-4">
                  <h3 className="text-sm font-bold font-display text-gray-900">My Account Credentials</h3>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="px-3 py-1.5 text-[10px] font-bold text-red-600 bg-red-50 hover:bg-red-100/50 border border-red-100 rounded-lg transition-colors cursor-pointer"
                  >
                    Logout Account
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-500 font-medium mb-1">Username</label>
                    <input
                      type="text"
                      required
                      value={profUsername}
                      onChange={(e) => setProfUsername(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-500 font-medium mb-1">Email Address</label>
                    <input
                      type="email"
                      required
                      value={profEmail}
                      onChange={(e) => setProfEmail(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-500 font-medium mb-1">First Name</label>
                    <input
                      type="text"
                      required
                      value={profFirstName}
                      onChange={(e) => setProfFirstName(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-500 font-medium mb-1">Last Name</label>
                    <input
                      type="text"
                      required
                      value={profLastName}
                      onChange={(e) => setProfLastName(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5"
                    />
                  </div>

                  <div className="md:col-span-2 border-t border-gray-50 pt-4 space-y-4">
                    <p className="font-bold text-gray-800 text-xs">Default Destinations</p>
                    <div>
                      <label className="block text-gray-500 font-medium mb-1">Street Address</label>
                      <input
                        type="text"
                        value={profAddress}
                        onChange={(e) => setProfAddress(e.target.value)}
                        placeholder="e.g., 456 Beacon Hill"
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5"
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-gray-500 font-medium mb-1">City</label>
                        <input
                          type="text"
                          value={profCity}
                          onChange={(e) => setProfCity(e.target.value)}
                          placeholder="Boston"
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-500 font-medium mb-1">Zip Code</label>
                        <input
                          type="text"
                          value={profZip}
                          onChange={(e) => setProfZip(e.target.value)}
                          placeholder="02108"
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-500 font-medium mb-1">Country</label>
                        <input
                          type="text"
                          value={profCountry}
                          onChange={(e) => setProfCountry(e.target.value)}
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5"
                        />
                      </div>
                    </div>
                  </div>

                  {/* ADMIN SIMULATION TOGGLE */}
                  <div className="md:col-span-2 border-t border-amber-100/50 pt-4 bg-amber-50/20 p-4 rounded-2xl border border-amber-50/50 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-bold text-amber-900 text-xs flex items-center space-x-1">
                          <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0" />
                          <span>Console Sandbox Privileges</span>
                        </p>
                        <p className="text-[10px] text-amber-600 mt-0.5">Toggle admin permissions to instantly explore and test the Administrator Console!</p>
                      </div>
                      
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={profIsAdmin}
                          onChange={(e) => setProfIsAdmin(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                      </label>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-gray-900 hover:bg-gray-800 text-white font-bold rounded-xl shadow-xs cursor-pointer transition-colors"
                >
                  Save Profile Modifications
                </button>
              </form>
            ) : (
              // Sign up/Login mock selector
              <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-xs text-center space-y-4">
                <UserIcon className="w-12 h-12 text-gray-200 mx-auto" />
                <h3 className="text-sm font-bold text-gray-800">You are currently logged out.</h3>
                <p className="text-xs text-gray-400 font-sans max-w-sm mx-auto">Click below to simulate rapid signing in as standard user with pre-loaded address and purchase history.</p>
                <button
                  onClick={() => setCurrentUser(INITIAL_USER)}
                  className="px-6 py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-xs font-semibold cursor-pointer transition-all inline-block"
                >
                  Sign In as Jane Miller
                </button>
              </div>
            )}
          </div>
        )}

        {/* VIEW: ADMIN CONSOLE */}
        {activeView === 'admin' && currentUser?.isAdmin && (
          <AdminDashboard
            products={products}
            setProducts={setProducts}
            orders={orders}
            setOrders={setOrders}
            coupons={coupons}
            setCoupons={setCoupons}
            onProductUpdated={() => {}}
          />
        )}

      </main>

      {/* FOOTER */}
      <footer className="bg-gray-950 text-gray-400 py-12 mt-20 border-t border-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8 text-xs font-sans">
          {/* Col 1 */}
          <div className="space-y-4">
            <span className="text-white font-display font-extrabold text-base tracking-tight flex items-center space-x-1.5">
              <span className="flex items-center justify-center w-6 h-6 rounded bg-white text-gray-950 font-serif font-bold text-xs">B</span>
              <span>Ink &amp; Paper</span>
            </span>
            <p className="text-gray-500 leading-relaxed">
              Curating high-grade literature masterpieces and premium traditional writing instruments since 2024. For those who prioritize analog craft.
            </p>
          </div>

          {/* Col 2 */}
          <div className="space-y-3.5">
            <h4 className="text-gray-200 font-bold uppercase tracking-wider text-[10px] font-mono">The Library</h4>
            <ul className="space-y-2">
              <li><button onClick={() => setActiveView('books')} className="hover:text-white transition-colors">Fiction &amp; Novels</button></li>
              <li><button onClick={() => setActiveView('books')} className="hover:text-white transition-colors">Science &amp; Technology</button></li>
              <li><button onClick={() => setActiveView('books')} className="hover:text-white transition-colors">Creative Writing</button></li>
              <li><button onClick={() => setActiveView('books')} className="hover:text-white transition-colors">Philosophy</button></li>
            </ul>
          </div>

          {/* Col 3 */}
          <div className="space-y-3.5">
            <h4 className="text-gray-200 font-bold uppercase tracking-wider text-[10px] font-mono">Fine Instruments</h4>
            <ul className="space-y-2">
              <li><button onClick={() => setActiveView('pens')} className="hover:text-white transition-colors">Fountain Pens</button></li>
              <li><button onClick={() => setActiveView('pens')} className="hover:text-white transition-colors">Gel Rollers</button></li>
              <li><button onClick={() => setActiveView('pens')} className="hover:text-white transition-colors">Machined Titanium</button></li>
              <li><button onClick={() => setActiveView('pens')} className="hover:text-white transition-colors">Drawing Felt-tips</button></li>
            </ul>
          </div>

          {/* Col 4 */}
          <div className="space-y-3.5">
            <h4 className="text-gray-200 font-bold uppercase tracking-wider text-[10px] font-mono">Company</h4>
            <ul className="space-y-2">
              <li><button onClick={() => setActiveView('about')} className="hover:text-white transition-colors">Our Vision &amp; Story</button></li>
              <li><button onClick={() => setActiveView('contact')} className="hover:text-white transition-colors">Showrooms &amp; Contacts</button></li>
              <li><button onClick={() => setActiveView('profile')} className="hover:text-white transition-colors">Account Profiles</button></li>
              <li><p className="text-gray-600 mt-1">Design Concept: Space Grotesk paired with Inter</p></li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 pt-6 border-t border-zinc-800 flex flex-col sm:flex-row sm:items-center sm:justify-between text-[11px] text-zinc-500 font-sans gap-2.5">
          <p>© 2026 Ink &amp; Paper E-Commerce. All rights reserved.</p>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="font-mono text-[10px] tracking-wider text-zinc-400">PYTHON DJANGO SERVICE ONLINE</span>
            </div>
            <span>•</span>
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse"></span>
              <span className="font-mono text-[10px] tracking-wider text-zinc-400">SQLITE DB SYNCHRONIZED</span>
            </div>
            <span>•</span>
            <span className="text-amber-500 bg-amber-500/5 px-2 py-0.5 rounded border border-amber-500/10 font-mono">BENTO GRID BLUEPRINT</span>
          </div>
        </div>
      </footer>

      {/* MODAL / SLIDEOVER: SHOPPING CART DRAWER */}
      {showCartDrawer && (
        <div className="fixed inset-0 z-50 overflow-hidden" aria-labelledby="slide-over-title" role="dialog" aria-modal="true">
          {/* Overlay backdrop */}
          <div 
            onClick={() => setShowCartDrawer(false)}
            className="absolute inset-0 bg-gray-900/40 backdrop-blur-xs transition-opacity duration-300"
          ></div>
          
          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10 md:pl-16">
            <div className="w-screen max-w-2xl bg-white shadow-2xl p-0 animate-in slide-in-from-right duration-300">
              <Cart
                cart={cart}
                saveForLaterList={saveForLaterList}
                onUpdateQuantity={handleUpdateCartQuantity}
                onRemoveFromCart={handleRemoveFromCart}
                onSaveForLater={handleSaveForLater}
                onMoveToCartFromSaved={handleMoveToCartFromSaved}
                onRemoveFromSaved={handleRemoveFromSaved}
                onClose={() => setShowCartDrawer(false)}
                onCheckout={handleProceedToCheckout}
                activeCoupons={coupons}
              />
            </div>
          </div>
        </div>
      )}

      {/* MODAL / SCREEN: PRODUCT DETAIL SPECIFICATION OVERLAY */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
          <div className="flex items-center justify-center min-h-screen px-4 py-8 text-center sm:block sm:p-0">
            {/* Backdrop */}
            <div 
              onClick={() => setSelectedProduct(null)}
              className="fixed inset-0 bg-gray-900/40 backdrop-blur-xs transition-opacity duration-300"
            ></div>

            {/* Modal aligner */}
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-white rounded-3xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
              {/* Header */}
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-sm font-bold font-mono uppercase tracking-wider text-gray-400">Product Specifications</h3>
                <button
                  onClick={() => setSelectedProduct(null)}
                  className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-900 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable contents */}
              <div className="p-6 overflow-y-auto space-y-8 flex-grow">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Left: cover img */}
                  <div className="aspect-3/4 bg-gray-50 rounded-2xl overflow-hidden border border-gray-100">
                    <img src={selectedProduct.image} alt="" className="w-full h-full object-cover" />
                  </div>

                  {/* Right: details info */}
                  <div className="space-y-4">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-amber-600 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-100/50">
                      {selectedProduct.type === 'book' ? 'BOOK CURATION' : 'FINE PEN'}
                    </span>

                    <h2 className="text-xl md:text-2xl font-bold font-display text-gray-950 leading-tight">
                      {selectedProduct.type === 'book' ? (selectedProduct as Book).title : (selectedProduct as Pen).model}
                    </h2>

                    <p className="text-xs text-gray-500 font-sans">
                      {selectedProduct.type === 'book' ? `by ${(selectedProduct as Book).author}` : `Brand: ${(selectedProduct as Pen).brand}`}
                    </p>

                    {/* Specifications Grid */}
                    <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 grid grid-cols-2 gap-4 text-xs font-sans">
                      {selectedProduct.type === 'book' ? (
                        <>
                          <div>
                            <span className="text-[10px] font-mono uppercase text-gray-400 block">Publisher</span>
                            <span className="font-bold text-gray-800">{(selectedProduct as Book).publisher}</span>
                          </div>
                          <div>
                            <span className="text-[10px] font-mono uppercase text-gray-400 block">ISBN</span>
                            <span className="font-mono font-bold text-gray-800">{(selectedProduct as Book).isbn}</span>
                          </div>
                          <div>
                            <span className="text-[10px] font-mono uppercase text-gray-400 block">Pages Count</span>
                            <span className="font-bold text-gray-800">{(selectedProduct as Book).pages || 288} pages</span>
                          </div>
                          <div>
                            <span className="text-[10px] font-mono uppercase text-gray-400 block">Publication Date</span>
                            <span className="font-bold text-gray-800">{(selectedProduct as Book).publishDate || '2025-01-01'}</span>
                          </div>
                        </>
                      ) : (
                        <>
                          <div>
                            <span className="text-[10px] font-mono uppercase text-gray-400 block">Ink Color</span>
                            <span className="font-bold text-gray-800">{(selectedProduct as Pen).inkColor}</span>
                          </div>
                          <div>
                            <span className="text-[10px] font-mono uppercase text-gray-400 block">Tip Size</span>
                            <span className="font-mono font-bold text-gray-800">{(selectedProduct as Pen).tipSize}</span>
                          </div>
                          <div>
                            <span className="text-[10px] font-mono uppercase text-gray-400 block">Body Material</span>
                            <span className="font-bold text-gray-800">{(selectedProduct as Pen).material}</span>
                          </div>
                          <div>
                            <span className="text-[10px] font-mono uppercase text-gray-400 block">Brand Core</span>
                            <span className="font-bold text-gray-800">{(selectedProduct as Pen).brand}</span>
                          </div>
                        </>
                      )}
                    </div>

                    <p className="text-xs text-gray-600 font-sans leading-relaxed">
                      {selectedProduct.description}
                    </p>

                    {/* Cart Trigger row */}
                    <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-mono uppercase text-gray-400 block">UNIT PRICE</span>
                        <div className="flex items-baseline space-x-1.5 mt-0.5">
                          <span className="text-lg font-mono font-extrabold text-gray-950">
                            ${(selectedProduct.price * (1 - selectedProduct.discount / 100)).toFixed(2)}
                          </span>
                          {selectedProduct.discount > 0 && (
                            <span className="text-xs font-mono text-gray-400 line-through">
                              ${selectedProduct.price.toFixed(2)}
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          if (selectedProduct.stock > 0) {
                            handleAddToCart(selectedProduct, 1);
                            setSelectedProduct(null);
                          }
                        }}
                        disabled={selectedProduct.stock === 0}
                        className={`px-5 py-3.5 rounded-xl text-white font-bold text-xs flex items-center space-x-1.5 transition-all shadow-md active:scale-98 ${
                          selectedProduct.stock === 0
                            ? 'bg-gray-300 cursor-not-allowed shadow-none'
                            : 'bg-gray-900 hover:bg-gray-800 cursor-pointer'
                        }`}
                      >
                        <ShoppingCart className="w-4 h-4" />
                        <span>{selectedProduct.stock === 0 ? 'Out of Stock' : 'Add to Shopping Cart'}</span>
                      </button>
                    </div>

                  </div>
                </div>

                {/* Reviews block */}
                <div className="border-t border-gray-100 pt-6 space-y-6">
                  <div className="flex justify-between items-baseline border-b border-gray-50 pb-3">
                    <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-gray-400">
                      Customer Reviews ({selectedProduct.reviews.length})
                    </h4>
                    <span className="text-xs font-sans font-bold flex items-center space-x-1">
                      <span className="text-gray-900">{selectedProduct.rating}</span>
                      <div className="flex text-amber-400">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      </div>
                    </span>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Reviews list (Left) */}
                    <div className="lg:col-span-7 space-y-4 max-h-[300px] overflow-y-auto pr-2">
                      {selectedProduct.reviews.length === 0 ? (
                        <p className="text-xs text-gray-400 italic">No customer reviews yet. Be the first to share your experience!</p>
                      ) : (
                        selectedProduct.reviews.map((rev) => (
                          <div key={rev.id} className="p-4 border border-gray-100 rounded-2xl bg-gray-50/20 space-y-2 text-xs font-sans">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-gray-900">{rev.userName}</span>
                              <span className="text-[10px] font-mono text-gray-400">{rev.date}</span>
                            </div>
                            <div className="flex text-amber-400">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-3 h-3 ${i < rev.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`}
                                />
                              ))}
                            </div>
                            <p className="text-gray-600 leading-relaxed italic">&quot;{rev.comment}&quot;</p>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Review submission Form (Right) */}
                    <div className="lg:col-span-5 bg-gray-50 rounded-2xl border border-gray-100 p-5 space-y-4 text-xs font-sans">
                      <p className="font-bold text-gray-800">Write a Review</p>
                      
                      <form onSubmit={handleAddReview} className="space-y-3">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-gray-500 font-medium mb-1">Your Name</label>
                            <input
                              type="text"
                              required
                              value={reviewName}
                              onChange={(e) => setReviewName(e.target.value)}
                              placeholder="e.g., Jane Miller"
                              className="w-full bg-white border border-gray-200 rounded-lg p-2 focus:ring-1 focus:ring-gray-900 focus:outline-hidden"
                            />
                          </div>
                          <div>
                            <label className="block text-gray-500 font-medium mb-1">Email Address</label>
                            <input
                              type="email"
                              value={reviewEmail}
                              onChange={(e) => setReviewEmail(e.target.value)}
                              placeholder="jane@example.com"
                              className="w-full bg-white border border-gray-200 rounded-lg p-2 focus:ring-1 focus:ring-gray-900 focus:outline-hidden"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-gray-500 font-medium mb-1">Rating Rating</label>
                          <div className="flex space-x-1">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <button
                                type="button"
                                key={i}
                                onClick={() => setReviewRating(i + 1)}
                                className="p-0.5 text-gray-300 hover:text-amber-400 transition-colors"
                              >
                                <Star
                                  className={`w-5 h-5 ${
                                    i < reviewRating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'
                                  }`}
                                />
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="block text-gray-500 font-medium mb-1">Review Comments</label>
                          <textarea
                            required
                            rows={3}
                            value={reviewComment}
                            onChange={(e) => setReviewComment(e.target.value)}
                            placeholder="Share your experience writing with or reading this curation..."
                            className="w-full bg-white border border-gray-200 rounded-lg p-2 focus:ring-1 focus:ring-gray-900 focus:outline-hidden"
                          ></textarea>
                        </div>

                        <button
                          type="submit"
                          className="w-full py-2 bg-gray-900 hover:bg-gray-800 text-white font-bold rounded-lg transition-colors cursor-pointer"
                        >
                          Submit Review
                        </button>
                      </form>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
