import { useState } from "react";
import CreatePost from "./components/CreatePost";
import CreateUser from "./components/CreateUser";
import PostList from "./components/PostList";
import UserList from "./components/UserList";

function App() {
  const [activeTab, setActiveTab] = useState<"users" | "posts">("users");

  return (
    <div style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
      <header style={{ marginBottom: "2rem" }}>
        <h1 style={{ marginBottom: "0.5rem" }}>tRPC RTK Query Example</h1>
        <p style={{ color: "#666" }}>
          Demonstrating type-safe API integration between tRPC and RTK Query
        </p>
      </header>

      <div style={{ marginBottom: "2rem" }}>
        <button
          onClick={() => setActiveTab("users")}
          style={{
            padding: "0.5rem 1rem",
            marginRight: "0.5rem",
            backgroundColor: activeTab === "users" ? "#0066cc" : "#f0f0f0",
            color: activeTab === "users" ? "white" : "#333",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontWeight: activeTab === "users" ? "bold" : "normal",
          }}
        >
          Users
        </button>
        <button
          onClick={() => setActiveTab("posts")}
          style={{
            padding: "0.5rem 1rem",
            backgroundColor: activeTab === "posts" ? "#0066cc" : "#f0f0f0",
            color: activeTab === "posts" ? "white" : "#333",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontWeight: activeTab === "posts" ? "bold" : "normal",
          }}
        >
          Posts
        </button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "2rem",
        }}
      >
        <div>
          <h2 style={{ marginBottom: "1rem" }}>
            {activeTab === "users" ? "Create User" : "Create Post"}
          </h2>
          {activeTab === "users" ? <CreateUser /> : <CreatePost />}
        </div>

        <div>
          <h2 style={{ marginBottom: "1rem" }}>
            {activeTab === "users" ? "Users" : "Posts"}
          </h2>
          {activeTab === "users" ? <UserList /> : <PostList />}
        </div>
      </div>
    </div>
  );
}

export default App;
