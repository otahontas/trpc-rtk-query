/**
 * Mock in-memory database
 */

export interface Todo {
  id: number;
  title: string;
  completed: boolean;
  userId: number;
  createdAt: Date;
}

export interface User {
  id: number;
  name: string;
  email: string;
}

const users: User[] = [
  { id: 1, name: "Alice", email: "alice@example.com" },
  { id: 2, name: "Bob", email: "bob@example.com" },
];

const todos: Todo[] = [
  {
    id: 1,
    title: "Learn tRPC",
    completed: true,
    userId: 1,
    createdAt: new Date("2024-01-01"),
  },
  {
    id: 2,
    title: "Learn RTK Query",
    completed: true,
    userId: 1,
    createdAt: new Date("2024-01-02"),
  },
  {
    id: 3,
    title: "Build awesome app",
    completed: false,
    userId: 1,
    createdAt: new Date("2024-01-03"),
  },
  {
    id: 4,
    title: "Write documentation",
    completed: false,
    userId: 2,
    createdAt: new Date("2024-01-04"),
  },
];

export const db = {
  todo: {
    findAll: async () => todos,
    findById: async (id: number) => todos.find((t) => t.id === id),
    findByUser: async (userId: number) => todos.filter((t) => t.userId === userId),
    create: async (data: Omit<Todo, "id" | "createdAt">) => {
      const newTodo: Todo = {
        id: Math.max(...todos.map((t) => t.id), 0) + 1,
        ...data,
        createdAt: new Date(),
      };
      todos.push(newTodo);
      return newTodo;
    },
    update: async (id: number, data: Partial<Omit<Todo, "id" | "createdAt">>) => {
      const index = todos.findIndex((t) => t.id === id);
      if (index === -1) return null;
      todos[index] = { ...todos[index]!, ...data };
      return todos[index]!;
    },
    delete: async (id: number) => {
      const index = todos.findIndex((t) => t.id === id);
      if (index === -1) return false;
      todos.splice(index, 1);
      return true;
    },
  },
  user: {
    findAll: async () => users,
    findById: async (id: number) => users.find((u) => u.id === id),
  },
};
