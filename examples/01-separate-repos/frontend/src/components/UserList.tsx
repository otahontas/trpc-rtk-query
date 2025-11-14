/**
 * UserList Component
 * Demonstrates fetching data using auto-generated RTK Query hooks from tRPC
 */

import {
  useUser_DeleteMutation,
  useUser_ListQuery,
} from "../api";

export default function UserList() {
  // Use the auto-generated hook from tRPC router
  const { data: users, isLoading, error } = useUser_ListQuery();
  const [deleteUser, { isLoading: isDeleting }] = useUser_DeleteMutation();

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this user?")) {
      try {
        await deleteUser(id).unwrap();
      } catch (error) {
        console.error("Failed to delete user:", error);
      }
    }
  };

  if (isLoading) {
    return <div style={{ padding: "1rem" }}>Loading users...</div>;
  }

  if (error) {
    return (
      <div style={{ padding: "1rem", color: "red" }}>
        Error loading users: {JSON.stringify(error)}
      </div>
    );
  }

  return (
    <div>
      {users?.length === 0 ? (
        <p style={{ color: "#666" }}>No users found</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {users?.map((user) => (
            <div
              key={user.id}
              style={{
                padding: "1rem",
                backgroundColor: "white",
                borderRadius: "8px",
                boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "start",
                }}
              >
                <div>
                  <h3 style={{ marginBottom: "0.25rem" }}>{user.name}</h3>
                  <p style={{ color: "#666", fontSize: "0.9rem" }}>
                    {user.email}
                  </p>
                  <p style={{ color: "#999", fontSize: "0.8rem" }}>
                    ID: {user.id}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(user.id)}
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
