/**
 * TodoItem Component
 * Displays a single todo with actions
 */

import {
  useTodo_DeleteMutation,
  useTodo_ToggleCompleteMutation,
} from "../api";

interface Todo {
  id: number;
  title: string;
  completed: boolean;
  userId: number;
  createdAt: Date;
}

interface TodoItemProps {
  todo: Todo;
}

export default function TodoItem({ todo }: TodoItemProps) {
  const [toggleComplete] = useTodo_ToggleCompleteMutation();
  const [deleteTodo] = useTodo_DeleteMutation();

  const handleToggle = async () => {
    try {
      await toggleComplete(todo.id).unwrap();
    } catch (error) {
      console.error("Failed to toggle todo:", error);
    }
  };

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this todo?")) {
      try {
        await deleteTodo(todo.id).unwrap();
      } catch (error) {
        console.error("Failed to delete todo:", error);
      }
    }
  };

  return (
    <div
      style={{
        padding: "1rem",
        backgroundColor: "white",
        borderRadius: "8px",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        display: "flex",
        alignItems: "center",
        gap: "1rem",
      }}
    >
      <input
        type="checkbox"
        checked={todo.completed}
        onChange={handleToggle}
        style={{
          width: "1.2rem",
          height: "1.2rem",
          cursor: "pointer",
        }}
      />
      <div style={{ flex: 1 }}>
        <p
          style={{
            textDecoration: todo.completed ? "line-through" : "none",
            color: todo.completed ? "#999" : "#333",
            fontWeight: todo.completed ? "normal" : "500",
          }}
        >
          {todo.title}
        </p>
      </div>
      <button
        onClick={handleDelete}
        style={{
          padding: "0.5rem 1rem",
          backgroundColor: "#dc3545",
          color: "white",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
          fontSize: "0.9rem",
        }}
      >
        Delete
      </button>
    </div>
  );
}
