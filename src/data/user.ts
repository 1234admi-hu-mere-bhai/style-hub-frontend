export interface Address {
  id: string;
  fullName: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  landmark?: string;
  isDefault: boolean;
}

export interface Order {
  id: string;
  orderNumber: string;
  date: string;
  status: 'placed' | 'confirmed' | 'shipped' | 'out_for_delivery' | 'delivered' | 'cancelled';
  items: {
    id: string;
    name: string;
    image: string;
    size: string;
    color: string;
    quantity: number;
    price: number;
  }[];
  total: number;
  shippingAddress: Address;
  paymentMethod: 'cod' | 'online';
  trackingId?: string;
  estimatedDelivery?: string;
}

export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  avatar?: string;
}

// Mock data for demo
export const mockAddresses: Address[] = [
  {
    id: '1',
    fullName: 'John Doe',
    phone: '+91 98765 43210',
    address: '123 Fashion Street, Andheri West',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400058',
    landmark: 'Near Metro Station',
    isDefault: true,
  },
  {
    id: '2',
    fullName: 'John Doe',
    phone: '+91 98765 43210',
    address: '456 Style Avenue, Koramangala',
    city: 'Bangalore',
    state: 'Karnataka',
    pincode: '560034',
    isDefault: false,
  },
];

export const mockOrders: Order[] = [
  {
    id: '1',
    orderNumber: 'MUF-2024-001234',
    date: '2024-01-28',
    status: 'shipped',
    items: [
      {
        id: '1',
        name: 'Elegant Beige Blazer',
        image: '/assets/product-1.jpg',
        size: 'M',
        color: 'Beige',
        quantity: 1,
        price: 2499,
      },
    ],
    total: 2499,
    shippingAddress: mockAddresses[0],
    paymentMethod: 'online',
    trackingId: 'SHIP123456789',
    estimatedDelivery: '2024-02-02',
  },
  {
    id: '2',
    orderNumber: 'MUF-2024-001235',
    date: '2024-01-25',
    status: 'delivered',
    items: [
      {
        id: '3',
        name: 'Terracotta Midi Dress',
        image: '/assets/product-3.jpg',
        size: 'S',
        color: 'Terracotta',
        quantity: 1,
        price: 1899,
      },
      {
        id: '5',
        name: 'Rainbow Block Hoodie',
        image: '/assets/product-5.jpg',
        size: '4-5Y',
        color: 'Multicolor',
        quantity: 2,
        price: 999,
      },
    ],
    total: 3897,
    shippingAddress: mockAddresses[0],
    paymentMethod: 'cod',
    estimatedDelivery: '2024-01-30',
  },
];

export const mockUserProfile: UserProfile = {
  id: '1',
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe@example.com',
  phone: '+91 98765 43210',
};
