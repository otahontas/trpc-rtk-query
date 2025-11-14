import { useState } from "react";
import { useUser_ListQuery } from "../api";
import TodoForm from "../components/TodoForm";
import TodoItem from "../components/TodoItem";
import { useTodo_GetByUserQuery, useTodo_ListQuery } from "../api";

export default function TodoList() {
  const [selectedUserId, setSelectedUserId] = useState<number | "all">("all");
  const { data: users } = useUser_ListQuery();

  // Fetch todos based on selected user
  const {
    data: allTodos,
    isLoading: isLoadingAll,
    error: errorAll,
  } = useTodo_ListQuery(undefined, {
    skip: selectedUserId !== "all",
  });

  const {
    data: userTodos,
    isLoading: isLoadingUser,
    error: errorUser,
  } = useTodo_GetByUserQuery(selectedUserId as number, {
    skip: selectedUserId === "all",
  });

  const todos = selectedUserId === "all" ? allTodos : userTodos;
  const isLoading = selectedUserId === "all" ? isLoadingAll : isLoadingUser;
  const error = selectedUserId === "all" ? errorAll : errorUser;

  return (
    <div>
      <h1 style={{ fontSize: "2rem", marginBottom: "1rem" }}>Todo List</h1>

      <div style={{ marginBottom: "2rem" }}>
        <label
          style={{
            display: "block",
            marginBottom: "0.5rem",
            fontWeight: "500",
          }}
        >
          Filter by user:
        </label>
        <select
          value={selectedUserId}
          onChange={(e) =>
            setSelectedUserId(
              e.target.value === "all" ? "all" : Number(e.target.value),
            )
          }
          style={{
            padding: "0.5rem 1rem",
            border: "1px solid #ddd",
            borderRadius: "4px",
            fontSize: "1rem",
          }}
        >
          <option value="all">All Users</option>
          {users?.map((user) => (
            <option key={user.id} value={user.id}>
              {user.name}
            </option>
          ))}
        </select>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "2rem",
        }}
      >
        {/* Create Todo Form */}
        <div>
          <h2 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>
            Create New Todo
          </h2>
          <TodoForm />
        </div>

        {/* Todo List */}
        <div>
          <h2 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>
            {selectedUserId === "all"
              ? "All Todos"
              : `Todos for ${users?.find((u) => u.id === selectedUserId)?.name}`}
          </h2>

          {isLoading && (
            <div
              style={{
                padding: "2rem",
                textAlign: "center",
                backgroundColor: "white",
                borderRadius: "8px",
              }}
            >
              Loading todos...
            </div>
          )}

          {error && (
            <div
              style={{
                padding: "1rem",
                backgroundColor: "#f8d7da",
                color: "#721c24",
                borderRadius: "8px",
              }}
            >
              Error loading todos: {JSON.stringify(error)}
            </div>
          )}

          {!isLoading && !error && todos?.length === 0 && (
            <div
              style={{
                padding: "2rem",
                textAlign: "center",
                backgroundColor: "white",
                borderRadius: "8px",
                color: "#666",
              }}
            >
              No todos found. Create one to get started!
            </div>
          )}

          {!isLoading && !error && todos && todos.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {todos.map((todo) => (
                <TodoItem key={todo.id} todo={todo} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
