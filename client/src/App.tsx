import { useState } from "react";
import JobDashboard from "./JobDashboard";
import "./App.css";
import { loginUser, registerUser } from "./api";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(
    !!localStorage.getItem("token")
  );

  const [isRegister, setIsRegister] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setMessage("");
    setLoading(true);

    try {
      
const result = isRegister
  ? await registerUser(name, email, password)
  : await loginUser(email, password);


      if (!result.success) {
        setMessage(result.message || "Something went wrong.");
        return;
      }

      // Registration successful
      if (isRegister) {
        setMessage("Registration successful! 🎉 Please login.");

        setIsRegister(false);
        setPassword("");

        return;
      }

      // Login successful
      if (result.token) {
        localStorage.setItem("token", result.token);

        setIsLoggedIn(true);
        setMessage("Login successful! 🎉");
      } else {
        setMessage("Login succeeded, but no token was received.");
      }
    } catch (error) {
      console.error("Authentication error:", error);
      setMessage("Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  // User is logged in
  if (isLoggedIn) {
    return (
    <JobDashboard
      onLogout={() => {
        localStorage.removeItem("token");
        setIsLoggedIn(false);
        setMessage("")
      }}
      />
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#111",
        color: "white",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "20px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "500px",
          border: "1px solid white",
          borderRadius: "16px",
          padding: "40px",
          textAlign: "center",
        }}
      >
        <h1>AI Job Tracker</h1>

        <h2>{isRegister ? "Register" : "Login"}</h2>

        <form onSubmit={handleSubmit}>
          {isRegister && (
            <>
              <label>Name</label>

              <input
                type="text"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </>
          )}

          <label>Email</label>

          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <label>Password</label>

          <input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button type="submit" disabled={loading}>
            {loading
              ? "Please wait..."
              : isRegister
              ? "Register"
              : "Login"}
          </button>
        </form>

        {message && <p>{message}</p>}

        <p
          style={{
            cursor: "pointer",
            marginTop: "20px",
          }}
          onClick={() => {
            setIsRegister(!isRegister);
            setMessage("");
            setPassword("");
          }}
        >
          {isRegister
            ? "Already have an account? Login"
            : "Don't have an account? Register"}
        </p>
      </div>
    </div>
  );
}

export default App;