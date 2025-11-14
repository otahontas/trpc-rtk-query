/**
 * TodoForm Component
 * Form for creating new todos
 */

import { useState } from "react";
import { useTodo_CreateMutation, useUser_ListQuery } from "../api";

export default function TodoForm() {
  const [title, setTitle] = useState("");
  const [userId, setUserId] = useState<number | "">("");
  const [completed, setCompleted] = useState(false);

  const { data: users } = useUser_ListQuery();
  const [createTodo, { isLoading, error, isSuccess }] = useTodo_CreateMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !userId) {
      alert("Please fill in all fields");
      return;
    }

    try {
      await createTodo({
        title,
        userId: Number(userId),
        completed,
      }).unwrap();

      // Reset form
      setTitle("");
      setUserId("");
      setCompleted(false);
    } catch (error) {
      console.error("Failed to create todo:", error);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        padding: "1.5rem",
        backgroundColor: "white",
        borderRadius: "8px",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
      }}
    >
      <div style={{ marginBottom: "1rem" }}>
        <label
          htmlFor="title"
          style={{
            display: "block",
            marginBottom: "0.5rem",
            fontWeight: "500",
          }}
        >
          Todo Title
        </label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter todo title"
          style={{
            width: "100%",
            padding: "0.5rem",
            border: "1px solid #ddd",
            borderRadius: "4px",
            fontSize: "1rem",
          }}
        />
      </div>

      <div style={{ marginBottom: "1rem" }}>
        <label
          htmlFor="user"
          style={{
            display: "block",
            marginBottom: "0.5rem",
            fontWeight: "500",
          }}
        >
          Assign To
        </label>
        <select
          id="user"
          value={userId}
          onChange={(e) => setUserId(Number(e.target.value))}
          style={{
            width: "100%",
            padding: "0.5rem",
            border: "1px solid #ddd",
            borderRadius: "4px",
            fontSize: "1rem",
          }}
        >
          <option value="">Select a user</option>
          {users?.map((user) => (
            <option key={user.id} value={user.id}>
              {user.name}
            </option>
          ))}
        </select>
      </div>

      <div style={{ marginBottom: "1rem" }}>
        <label
          style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
        >
          <input
            type="checkbox"
            checked={completed}
            onChange={(e) => setCompleted(e.target.checked)}
          />
          <span style={{ fontWeight: "500" }}>Mark as completed</span>
        </label>
      </div>

      {error && (
        <div
          style={{
            padding: "0.75rem",
            backgroundColor: "#f8d7da",
            color: "#721c24",
            borderRadius: "4px",
            marginBottom: "1rem",
            fontSize: "0.9rem",
          }}
        >
          Error: {JSON.stringify(error)}
        </div>
      )}

      {isSuccess && (
        <div
          style={{
            padding: "0.75rem",
            backgroundColor: "#d4edda",
            color: "#155724",
            borderRadius: "4px",
            marginBottom: "1rem",
            fontSize: "0.9rem",
          }}
        >
          Todo created successfully!
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading}
        style={{
          width: "100%",
          padding: "0.75rem",
          backgroundColor: isLoading ? "#ccc" : "#28a745",
          color: "white",
          border: "none",
          borderRadius: "4px",
          cursor: isLoading ? "not-allowed" : "pointer",
          fontSize: "1rem",
          fontWeight: "bold",
        }}
      >
        {isLoading ? "Creating..." : "Create Todo"}
      </button>
    </form>
  );
}
