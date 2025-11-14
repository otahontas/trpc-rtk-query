/**
 * Mock database for the example
 * In a real application, this would be replaced with a real database
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

// In-memory database
const users: User[] = [
  {
    id: 1,
    name: "Alice Johnson",
    email: "alice@example.com",
    createdAt: new Date("2024-01-01"),
  },
  {
    id: 2,
    name: "Bob Smith",
    email: "bob@example.com",
    createdAt: new Date("2024-01-02"),
  },
  {
    id: 3,
    name: "Charlie Brown",
    email: "charlie@example.com",
    createdAt: new Date("2024-01-03"),
  },
];

const posts: Post[] = [
  {
    id: 1,
    title: "Getting Started with tRPC",
    content: "tRPC is a great way to build type-safe APIs...",
    authorId: 1,
    published: true,
    createdAt: new Date("2024-01-05"),
  },
  {
    id: 2,
    title: "RTK Query Best Practices",
    content: "RTK Query makes data fetching simple...",
    authorId: 2,
    published: true,
    createdAt: new Date("2024-01-06"),
  },
  {
    id: 3,
    title: "Draft Post",
    content: "This is a draft post...",
    authorId: 1,
    published: false,
    createdAt: new Date("2024-01-07"),
  },
];

export const db = {
  user: {
    findMany: async () => users,
    findById: async (id: number) => users.find((u) => u.id === id),
    create: async (data: Omit<User, "id" | "createdAt">) => {
      const newUser: User = {
        id: Math.max(...users.map((u) => u.id)) + 1,
        ...data,
        createdAt: new Date(),
      };
      users.push(newUser);
      return newUser;
    },
    update: async (id: number, data: Partial<Omit<User, "id" | "createdAt">>) => {
      const index = users.findIndex((u) => u.id === id);
      if (index === -1) return null;
      users[index] = { ...users[index]!, ...data };
      return users[index]!;
    },
    delete: async (id: number) => {
      const index = users.findIndex((u) => u.id === id);
      if (index === -1) return false;
      users.splice(index, 1);
      return true;
    },
  },
  post: {
    findMany: async (options?: { published?: boolean }) => {
      if (options?.published !== undefined) {
        return posts.filter((p) => p.published === options.published);
      }
      return posts;
    },
    findById: async (id: number) => posts.find((p) => p.id === id),
    findByAuthor: async (authorId: number) =>
      posts.filter((p) => p.authorId === authorId),
    create: async (data: Omit<Post, "id" | "createdAt">) => {
      const newPost: Post = {
        id: Math.max(...posts.map((p) => p.id)) + 1,
        ...data,
        createdAt: new Date(),
      };
      posts.push(newPost);
      return newPost;
    },
    update: async (id: number, data: Partial<Omit<Post, "id" | "createdAt">>) => {
      const index = posts.findIndex((p) => p.id === id);
      if (index === -1) return null;
      posts[index] = { ...posts[index]!, ...data };
      return posts[index]!;
    },
    delete: async (id: number) => {
      const index = posts.findIndex((p) => p.id === id);
      if (index === -1) return false;
      posts.splice(index, 1);
      return true;
    },
  },
};
