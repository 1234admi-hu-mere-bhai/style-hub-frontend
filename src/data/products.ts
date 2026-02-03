import product1 from '@/assets/product-1.jpg';
import product2 from '@/assets/product-2.jpg';
import product3 from '@/assets/product-3.jpg';
import product4 from '@/assets/product-4.jpg';
import product5 from '@/assets/product-5.jpg';
import product6 from '@/assets/product-6.jpg';

export interface Product {
  id: string;
  name: string;
  category: 'men' | 'women' | 'kids';
  price: number;
  originalPrice?: number;
  discount?: number;
  images: string[];
  sizes: string[];
  colors: { name: string; hex: string }[];
  rating: number;
  reviews: number;
  description: string;
  isNew?: boolean;
  isFeatured?: boolean;
}

export const products: Product[] = [
  {
    id: '1',
    name: 'Elegant Beige Blazer',
    category: 'women',
    price: 2499,
    originalPrice: 3499,
    discount: 29,
    images: [product1],
    sizes: ['S', 'M', 'L', 'XL'],
    colors: [
      { name: 'Beige', hex: '#E8DCC8' },
      { name: 'Black', hex: '#1a1a1a' },
      { name: 'Navy', hex: '#1e3a5f' },
    ],
    rating: 4.5,
    reviews: 128,
    description: 'A sophisticated single-breasted blazer crafted from premium fabric. Perfect for office wear or formal occasions. Features a classic notch lapel and two front pockets.',
    isNew: true,
    isFeatured: true,
  },
  {
    id: '2',
    name: 'Classic Navy Jacket',
    category: 'men',
    price: 3299,
    originalPrice: 4499,
    discount: 27,
    images: [product2],
    sizes: ['M', 'L', 'XL', 'XXL'],
    colors: [
      { name: 'Navy', hex: '#1e3a5f' },
      { name: 'Black', hex: '#1a1a1a' },
      { name: 'Olive', hex: '#4a5d23' },
    ],
    rating: 4.7,
    reviews: 95,
    description: 'A versatile button-front jacket with a modern fit. Made from water-resistant material with multiple pockets for functionality. Ideal for casual and semi-formal wear.',
    isFeatured: true,
  },
  {
    id: '3',
    name: 'Terracotta Midi Dress',
    category: 'women',
    price: 1899,
    originalPrice: 2599,
    discount: 27,
    images: [product3],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    colors: [
      { name: 'Terracotta', hex: '#C65D3B' },
      { name: 'Sage', hex: '#9CAF88' },
      { name: 'Black', hex: '#1a1a1a' },
    ],
    rating: 4.8,
    reviews: 214,
    description: 'A flowing midi dress with elegant puff sleeves and a flattering cinched waist. Perfect for brunches, date nights, or special occasions.',
    isNew: true,
    isFeatured: true,
  },
  {
    id: '4',
    name: 'Casual Combo Set',
    category: 'men',
    price: 1799,
    images: [product4],
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    colors: [
      { name: 'White/Tan', hex: '#D4A574' },
      { name: 'Black/Grey', hex: '#4a4a4a' },
      { name: 'Navy/Beige', hex: '#1e3a5f' },
    ],
    rating: 4.3,
    reviews: 67,
    description: 'A comfortable everyday combo featuring a premium cotton t-shirt paired with classic chinos. The perfect casual outfit for any occasion.',
    isFeatured: true,
  },
  {
    id: '5',
    name: 'Rainbow Block Hoodie',
    category: 'kids',
    price: 999,
    originalPrice: 1299,
    discount: 23,
    images: [product5],
    sizes: ['2-3Y', '4-5Y', '6-7Y', '8-9Y', '10-11Y'],
    colors: [
      { name: 'Multicolor', hex: '#FFB347' },
      { name: 'Blue Mix', hex: '#6B93D6' },
    ],
    rating: 4.9,
    reviews: 342,
    description: 'A fun and colorful hoodie that kids will love! Made from soft, durable cotton blend with a kangaroo pocket and adjustable hood.',
    isNew: true,
    isFeatured: true,
  },
  {
    id: '6',
    name: 'Cable Knit Sweater',
    category: 'women',
    price: 1599,
    images: [product6],
    sizes: ['XS', 'S', 'M', 'L'],
    colors: [
      { name: 'Cream', hex: '#F5F5DC' },
      { name: 'Camel', hex: '#C19A6B' },
      { name: 'Grey', hex: '#808080' },
    ],
    rating: 4.6,
    reviews: 156,
    description: 'A cozy cable knit sweater made from soft premium yarn. Features a mock neck and relaxed fit for ultimate comfort.',
    isFeatured: true,
  },
];

export const getProductById = (id: string) => products.find(p => p.id === id);
export const getFeaturedProducts = () => products.filter(p => p.isFeatured);
export const getNewArrivals = () => products.filter(p => p.isNew);
export const getProductsByCategory = (category: 'men' | 'women' | 'kids') =>
  products.filter(p => p.category === category);
