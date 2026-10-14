export interface Review {
  id: string;
  productId: string;
  userName: string;
  userEmail: string;
  rating: number;
  comment: string;
  date: string;
}

export interface Book {
  id: string;
  type: 'book';
  title: string;
  author: string;
  category: string;
  publisher: string;
  isbn: string;
  price: number;
  discount: number; // percentage discount (e.g., 10 for 10%)
  stock: number;
  description: string;
  rating: number;
  image: string;
  reviews: Review[];
  featured?: boolean;
  bestSeller?: boolean;
  pages?: number;
  publishDate?: string;
}

export interface Pen {
  id: string;
  type: 'pen';
  brand: string;
  model: string;
  inkColor: string;
  tipSize: string; // e.g., "0.5mm", "0.7mm"
  material: string; // e.g., "Metal", "Resin"
  price: number;
  discount: number;
  stock: number;
  description: string;
  rating: number;
  image: string;
  reviews: Review[];
  featured?: boolean;
  bestSeller?: boolean;
}

export type Product = Book | Pen;

export interface CartItem {
  id: string; // matches product id
  product: Product;
  quantity: number;
}

export interface WishlistItem {
  id: string;
  product: Product;
}

export interface User {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
  city: string;
  zipCode: string;
  country: string;
  isAdmin: boolean;
}

export interface OrderItem {
  id: string;
  productId: string;
  name: string;
  type: 'book' | 'pen';
  price: number;
  quantity: number;
  image: string;
}

export interface Address {
  fullName: string;
  addressLine: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface Order {
  id: string;
  userId: string;
  date: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  shipping: number;
  discountAmount: number;
  couponCode?: string;
  total: number;
  shippingAddress: Address;
  billingAddress: Address;
  paymentMethod: string;
  status: 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';
  trackingNumber?: string;
}

export interface Coupon {
  code: string;
  discountType: 'percentage' | 'fixed';
  value: number;
  minSpend?: number;
  isActive: boolean;
}

export const CATEGORIES = {
  books: ['All', 'Fiction', 'Non-Fiction', 'Science', 'Philosophy', 'Art'],
  pens: ['All', 'Fountain', 'Ballpoint', 'Gel', 'Rollerball']
};

export const BRANDS = ['All', 'Nightingale', 'Apex', 'WriteTech', 'DuraLead'];

export const INK_COLORS = ['All', 'Midnight Blue', 'Charcoal Black', 'Forest Green', 'Crimson Red'];
