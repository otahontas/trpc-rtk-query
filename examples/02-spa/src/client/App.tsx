import { Link, Route, Routes, useLocation } from "react-router-dom";
import About from "./pages/About";
import Home from "./pages/Home";
import TodoList from "./pages/TodoList";

function App() {
  const location = useLocation();

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Navigation */}
      <nav
        style={{
          backgroundColor: "#0066cc",
          color: "white",
          padding: "1rem 2rem",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        }}
      >
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h1 style={{ fontSize: "1.5rem", fontWeight: "bold" }}>
            tRPC RTK Query SPA
          </h1>
          <div style={{ display: "flex", gap: "1.5rem" }}>
            <Link
              to="/"
              style={{
                color: "white",
                textDecoration: "none",
                fontWeight: location.pathname === "/" ? "bold" : "normal",
                borderBottom:
                  location.pathname === "/" ? "2px solid white" : "none",
                paddingBottom: "0.25rem",
              }}
            >
              Home
            </Link>
            <Link
              to="/todos"
              style={{
                color: "white",
                textDecoration: "none",
                fontWeight: location.pathname === "/todos" ? "bold" : "normal",
                borderBottom:
                  location.pathname === "/todos" ? "2px solid white" : "none",
                paddingBottom: "0.25rem",
              }}
            >
              Todos
            </Link>
            <Link
              to="/about"
              style={{
                color: "white",
                textDecoration: "none",
                fontWeight: location.pathname === "/about" ? "bold" : "normal",
                borderBottom:
                  location.pathname === "/about" ? "2px solid white" : "none",
                paddingBottom: "0.25rem",
              }}
            >
              About
            </Link>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main style={{ flex: 1, padding: "2rem" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/todos" element={<TodoList />} />
            <Route path="/about" element={<About />} />
          </Routes>
        </div>
      </main>

      {/* Footer */}
      <footer
        style={{
          backgroundColor: "#f0f0f0",
          padding: "1rem 2rem",
          textAlign: "center",
          color: "#666",
        }}
      >
        <p>Built with tRPC, RTK Query, and React</p>
      </footer>
    </div>
  );
}

export default App;
