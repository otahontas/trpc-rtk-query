export default function About() {
  return (
    <div>
      <h1 style={{ fontSize: "2rem", marginBottom: "1rem" }}>
        About This Example
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
          Technologies Used
        </h2>
        <ul style={{ lineHeight: "2", paddingLeft: "1.5rem" }}>
          <li>
            <strong>tRPC</strong> - End-to-end typesafe APIs
          </li>
          <li>
            <strong>RTK Query</strong> - Powerful data fetching and caching
          </li>
          <li>
            <strong>trpc-rtk-query</strong> - Bridge between tRPC and RTK Query
          </li>
          <li>
            <strong>React</strong> - UI library
          </li>
          <li>
            <strong>React Router</strong> - Client-side routing
          </li>
          <li>
            <strong>TypeScript</strong> - Type safety
          </li>
          <li>
            <strong>Express</strong> - Backend server
          </li>
          <li>
            <strong>Vite</strong> - Build tool and dev server
          </li>
        </ul>
      </div>

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
          How It Works
        </h2>
        <div style={{ lineHeight: "1.8" }}>
          <p style={{ marginBottom: "1rem" }}>
            This example demonstrates a Single Page Application where the backend
            and frontend are bundled together in a single codebase.
          </p>
          <p style={{ marginBottom: "1rem" }}>
            The <strong>tRPC router</strong> is defined on the server, providing
            type-safe procedures for CRUD operations on todos and users.
          </p>
          <p style={{ marginBottom: "1rem" }}>
            The <strong>frontend</strong> uses{" "}
            <code
              style={{ backgroundColor: "#f0f0f0", padding: "0.2rem 0.4rem" }}
            >
              trpc-rtk-query
            </code>{" "}
            to automatically generate RTK Query hooks from the tRPC router types.
          </p>
          <p style={{ marginBottom: "1rem" }}>
            <strong>Cache management</strong> is handled by RTK Query using tags,
            ensuring that when you create, update, or delete a todo, the UI
            automatically updates to reflect the changes.
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
          Key Integration Points
        </h2>
        <div style={{ lineHeight: "1.8" }}>
          <h3 style={{ fontSize: "1.2rem", marginBottom: "0.5rem" }}>
            1. Server-Side: tRPC Router
          </h3>
          <pre
            style={{
              backgroundColor: "#f5f5f5",
              padding: "1rem",
              borderRadius: "4px",
              overflow: "auto",
              marginBottom: "1rem",
            }}
          >
            {`export const appRouter = router({
  todo: todoRouter,
  user: userRouter,
});`}
          </pre>

          <h3 style={{ fontSize: "1.2rem", marginBottom: "0.5rem" }}>
            2. Client-Side: API Enhancement
          </h3>
          <pre
            style={{
              backgroundColor: "#f5f5f5",
              padding: "1rem",
              borderRadius: "4px",
              overflow: "auto",
              marginBottom: "1rem",
            }}
          >
            {`export const api = enhanceApi({
  api: baseApi,
  client: trpcClient,
  endpointOptions: {
    todo_List: {
      providesTags: ["Todo"],
    },
    todo_Create: {
      invalidatesTags: ["Todo"],
    },
  },
});`}
          </pre>

          <h3 style={{ fontSize: "1.2rem", marginBottom: "0.5rem" }}>
            3. Using Generated Hooks
          </h3>
          <pre
            style={{
              backgroundColor: "#f5f5f5",
              padding: "1rem",
              borderRadius: "4px",
              overflow: "auto",
            }}
          >
            {`const { data, isLoading } = useTodo_ListQuery();
const [createTodo] = useTodo_CreateMutation();`}
          </pre>
        </div>
      </div>
    </div>
  );
}
