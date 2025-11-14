/**
 * CreatePost Component
 * Demonstrates creating posts with author selection
 */

import { useState } from "react";
import { usePost_CreateMutation, useUser_ListQuery } from "../api";

export default function CreatePost() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [authorId, setAuthorId] = useState<number | "">("");
  const [published, setPublished] = useState(false);

  // Fetch users for author selection
  const { data: users } = useUser_ListQuery();

  // Use the auto-generated mutation hook
  const [createPost, { isLoading, error, isSuccess }] = usePost_CreateMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !content.trim() || !authorId) {
      alert("Please fill in all fields");
      return;
    }

    try {
      await createPost({
        title,
        content,
        authorId: Number(authorId),
        published,
      }).unwrap();
      // Reset form on success
      setTitle("");
      setContent("");
      setAuthorId("");
      setPublished(false);
    } catch (error) {
      console.error("Failed to create post:", error);
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
          style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}
        >
          Title
        </label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={{
            width: "100%",
            padding: "0.5rem",
            border: "1px solid #ddd",
            borderRadius: "4px",
            fontSize: "1rem",
          }}
          placeholder="Enter title"
        />
      </div>

      <div style={{ marginBottom: "1rem" }}>
        <label
          htmlFor="content"
          style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}
        >
          Content
        </label>
        <textarea
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={4}
          style={{
            width: "100%",
            padding: "0.5rem",
            border: "1px solid #ddd",
            borderRadius: "4px",
            fontSize: "1rem",
            resize: "vertical",
          }}
          placeholder="Enter content"
        />
      </div>

      <div style={{ marginBottom: "1rem" }}>
        <label
          htmlFor="author"
          style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}
        >
          Author
        </label>
        <select
          id="author"
          value={authorId}
          onChange={(e) => setAuthorId(Number(e.target.value))}
          style={{
            width: "100%",
            padding: "0.5rem",
            border: "1px solid #ddd",
            borderRadius: "4px",
            fontSize: "1rem",
          }}
        >
          <option value="">Select an author</option>
          {users?.map((user) => (
            <option key={user.id} value={user.id}>
              {user.name}
            </option>
          ))}
        </select>
      </div>

      <div style={{ marginBottom: "1rem" }}>
        <label style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <input
            type="checkbox"
            checked={published}
            onChange={(e) => setPublished(e.target.checked)}
          />
          <span style={{ fontWeight: "500" }}>Publish immediately</span>
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
          Post created successfully!
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
        {isLoading ? "Creating..." : "Create Post"}
      </button>
    </form>
  );
}
