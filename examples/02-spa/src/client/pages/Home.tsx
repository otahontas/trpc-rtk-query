import { Link } from "react-router-dom";
import { useTodo_ListQuery } from "../api";

export default function Home() {
  const { data: todos } = useTodo_ListQuery();

  const completedCount = todos?.filter((t) => t.completed).length || 0;
  const totalCount = todos?.length || 0;

  return (
    <div>
      <h1 style={{ fontSize: "2rem", marginBottom: "1rem" }}>
        Welcome to tRPC RTK Query SPA
      </h1>

      <div
        style={{
          backgroundColor: "white",
          padding: "2rem",
          borderRadius: "8px",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          marginBottom: "2rem",
        }}
      >
        <h2 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>
          What is this?
        </h2>
        <p style={{ marginBottom: "1rem", lineHeight: "1.8" }}>
          This is a Single Page Application (SPA) example demonstrating the
          integration of <strong>tRPC</strong> with <strong>RTK Query</strong> using{" "}
          <code style={{ backgroundColor: "#f0f0f0", padding: "0.2rem 0.4rem" }}>
            trpc-rtk-query
          </code>
          .
        </p>
        <p style={{ marginBottom: "1rem", lineHeight: "1.8" }}>
          The example includes a simple todo application with full CRUD
          operations, demonstrating queries, mutations, and cache management.
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "1rem",
          marginBottom: "2rem",
        }}
      >
        <div
          style={{
            backgroundColor: "#e7f3ff",
            padding: "1.5rem",
            borderRadius: "8px",
          }}
        >
          <h3 style={{ fontSize: "1.2rem", marginBottom: "0.5rem" }}>
            Total Todos
          </h3>
          <p style={{ fontSize: "2.5rem", fontWeight: "bold", color: "#0066cc" }}>
            {totalCount}
          </p>
        </div>
        <div
          style={{
            backgroundColor: "#e7ffe7",
            padding: "1.5rem",
            borderRadius: "8px",
          }}
        >
          <h3 style={{ fontSize: "1.2rem", marginBottom: "0.5rem" }}>
            Completed
          </h3>
          <p style={{ fontSize: "2.5rem", fontWeight: "bold", color: "#28a745" }}>
            {completedCount}
          </p>
        </div>
      </div>

      <div
        style={{
          backgroundColor: "white",
          padding: "2rem",
          borderRadius: "8px",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        }}
      >
        <h2 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>
          Features Demonstrated
        </h2>
        <ul style={{ lineHeight: "2", paddingLeft: "1.5rem" }}>
          <li>Type-safe API calls with tRPC</li>
          <li>Auto-generated RTK Query hooks</li>
          <li>Client-side routing with React Router</li>
          <li>Optimistic updates and cache invalidation</li>
          <li>CRUD operations (Create, Read, Update, Delete)</li>
          <li>Loading and error states</li>
          <li>Responsive UI design</li>
        </ul>
      </div>

      <div style={{ marginTop: "2rem", textAlign: "center" }}>
        <Link
          to="/todos"
          style={{
            display: "inline-block",
            padding: "1rem 2rem",
            backgroundColor: "#0066cc",
            color: "white",
            textDecoration: "none",
            borderRadius: "8px",
            fontWeight: "bold",
            fontSize: "1.1rem",
          }}
        >
          View Todos
        </Link>
      </div>
    </div>
  );
}
