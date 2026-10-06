export interface Product {
  id: string;
  title: string;
  price: number;
  originalPrice?: number;
  category: string;
  unit: string;
  tags: string[];
  isPopular?: boolean;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export const CATEGORIES: Category[] = [
  { id: 'c1', name: 'Kottu', icon: 'Flame', color: 'bg-red-100 text-red-700' },
  { id: 'c2', name: 'Fried Rice', icon: 'Bowl', color: 'bg-orange-100 text-orange-700' },
  { id: 'c3', name: 'Drinks', icon: 'Cup', color: 'bg-blue-100 text-blue-700' },
];

export const MOCK_PRODUCTS: Product[] = [
  {
    id: 'p1',
    title: 'Dolphin Kottu',
    price: 35,
    category: 'Kottu',
    unit: '1 Portion',
    tags: ['Spicy', 'Popular'],
    isPopular: true,
  },
  {
    id: 'p2',
    title: 'Chicken Kottu',
    price: 30,
    category: 'Kottu',
    unit: '1 Portion',
    tags: ['Non-Veg'],
    isPopular: true,
  },
  {
    id: 'p3',
    title: 'Idiyappa Kottu',
    price: 30,
    category: 'Kottu',
    unit: '1 Portion',
    tags: ['Veg'],
    isPopular: true,
  },
  {
    id: 'p4',
    title: 'Chicken Fried Rice',
    price: 25,
    category: 'Fried Rice',
    unit: '1 Portion',
    tags: ['Non-Veg', 'Popular'],
    isPopular: true,
  },
];
