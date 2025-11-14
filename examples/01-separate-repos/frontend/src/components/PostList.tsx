/**
 * PostList Component
 * Demonstrates fetching data with filters and mutations
 */

import { useState } from "react";
import {
  usePost_DeleteMutation,
  usePost_ListQuery,
  usePost_UpdateMutation,
} from "../api";

export default function PostList() {
  const [showPublishedOnly, setShowPublishedOnly] = useState(false);

  // Use the auto-generated hook with input parameters
  const { data: posts, isLoading, error } = usePost_ListQuery(
    showPublishedOnly ? { published: true } : undefined,
  );
  const [deletePost, { isLoading: isDeleting }] = usePost_DeleteMutation();
  const [updatePost] = usePost_UpdateMutation();

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this post?")) {
      try {
        await deletePost(id).unwrap();
      } catch (error) {
        console.error("Failed to delete post:", error);
      }
    }
  };

  const handleTogglePublished = async (id: number, published: boolean) => {
    try {
      await updatePost({ id, published: !published }).unwrap();
    } catch (error) {
      console.error("Failed to update post:", error);
    }
  };

  if (isLoading) {
    return <div style={{ padding: "1rem" }}>Loading posts...</div>;
  }

  if (error) {
    return (
      <div style={{ padding: "1rem", color: "red" }}>
        Error loading posts: {JSON.stringify(error)}
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: "1rem" }}>
        <label style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <input
            type="checkbox"
            checked={showPublishedOnly}
            onChange={(e) => setShowPublishedOnly(e.target.checked)}
          />
          Show published only
        </label>
      </div>

      {posts?.length === 0 ? (
        <p style={{ color: "#666" }}>No posts found</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {posts?.map((post) => (
            <div
              key={post.id}
              style={{
                padding: "1rem",
                backgroundColor: "white",
                borderRadius: "8px",
                boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
              }}
            >
              <div style={{ marginBottom: "0.5rem" }}>
                <h3 style={{ marginBottom: "0.25rem" }}>{post.title}</h3>
                <span
                  style={{
                    display: "inline-block",
                    padding: "0.25rem 0.5rem",
                    backgroundColor: post.published ? "#28a745" : "#ffc107",
                    color: post.published ? "white" : "#333",
                    borderRadius: "4px",
                    fontSize: "0.75rem",
                    fontWeight: "bold",
                  }}
                >
                  {post.published ? "Published" : "Draft"}
                </span>
              </div>
              <p style={{ color: "#666", fontSize: "0.9rem", marginBottom: "0.5rem" }}>
                {post.content}
              </p>
              <p style={{ color: "#999", fontSize: "0.8rem", marginBottom: "1rem" }}>
                Author ID: {post.authorId} | Post ID: {post.id}
              </p>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button
                  onClick={() => handleTogglePublished(post.id, post.published)}
                  style={{
                    padding: "0.5rem 1rem",
                    backgroundColor: "#007bff",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontSize: "0.9rem",
                  }}
                >
                  {post.published ? "Unpublish" : "Publish"}
                </button>
                <button
                  onClick={() => handleDelete(post.id)}
                  disabled={isDeleting}
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
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
