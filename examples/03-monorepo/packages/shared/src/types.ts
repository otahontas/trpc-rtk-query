/**
 * Shared type definitions
 */

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  inStock: boolean;
  createdAt: Date;
}

export interface Category {
  id: number;
  name: string;
  description: string;
}
