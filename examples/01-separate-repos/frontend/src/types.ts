/**
 * Shared types from backend
 * In a real application, these would be imported from a shared package
 * or generated from the backend router type
 */

export interface User {
  id: number;
  name: string;
  email: string;
  createdAt: Date;
}

export interface Post {
  id: number;
  title: string;
  content: string;
  authorId: number;
  published: boolean;
  createdAt: Date;
}

/**
 * This is a placeholder for the AppRouter type from the backend.
 * In a real application, you would import this type from the backend:
 *
 * import type { AppRouter } from "backend/src/router";
 *
 * For this example, we'll define it manually based on the backend router.
 */
export type AppRouter = any; // Replace with actual backend router type
