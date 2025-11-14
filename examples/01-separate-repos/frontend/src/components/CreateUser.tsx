/**
 * CreateUser Component
 * Demonstrates using mutations with optimistic updates
 */

import { useState } from "react";
import { useUser_CreateMutation } from "../api";

export default function CreateUser() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  // Use the auto-generated mutation hook
  const [createUser, { isLoading, error, isSuccess }] = useUser_CreateMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !email.trim()) {
      alert("Please fill in all fields");
      return;
    }

    try {
      await createUser({ name, email }).unwrap();
      // Reset form on success
      setName("");
      setEmail("");
    } catch (error) {
      console.error("Failed to create user:", error);
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
          htmlFor="name"
          style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}
        >
          Name
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{
            width: "100%",
            padding: "0.5rem",
            border: "1px solid #ddd",
            borderRadius: "4px",
            fontSize: "1rem",
          }}
          placeholder="Enter name"
        />
      </div>

      <div style={{ marginBottom: "1rem" }}>
        <label
          htmlFor="email"
          style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}
        >
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{
            width: "100%",
            padding: "0.5rem",
            border: "1px solid #ddd",
            borderRadius: "4px",
            fontSize: "1rem",
          }}
          placeholder="Enter email"
        />
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
          User created successfully!
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
        {isLoading ? "Creating..." : "Create User"}
      </button>
    </form>
  );
}
