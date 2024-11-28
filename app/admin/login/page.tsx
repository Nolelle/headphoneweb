"use client";
import React, { useState } from "react";

const AdminLogin = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });

      if (res.ok) {
        window.location.href = "/admin/dashboard";
      } else {
        setError("Invalid credentials");
      }
    } catch (err) {
      setError("Login failed");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-base-200">
      {/* <header className="navbar bg-base-100 shadow-lg">
        <div className="flex-1">
          <a className="btn btn-ghost normal-case text-xl">
            <span>Admin Portal</span>
          </a>
        </div>
      </header> */}

      <main className="flex-grow flex items-center justify-center">
        <div className="card bg-base-100 shadow-xl w-full max-w-sm p-6">
          <h2 className="text-2xl font-bold text-center mb-4">Admin Login</h2>
          <form
            className="space-y-4"
            onSubmit={handleSubmit}
          >
            <div className="form-control">
              <label
                htmlFor="username"
                className="label"
              >
                <span className="label-text">Username</span>
              </label>
              <input
                id="username"
                name="username"
                type="text"
                className="input input-bordered w-full"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="form-control">
              <label
                htmlFor="password"
                className="label"
              >
                <span className="label-text">Password</span>
              </label>
              <input
                id="password"
                name="password"
                type="password"
                className="input input-bordered w-full"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && (
              <div className="text-red-500 text-sm text-center">{error}</div>
            )}
            <button
              type="submit"
              className="btn btn-primary w-full"
            >
              Sign in
            </button>
          </form>
        </div>
      </main>

      <footer className="footer bg-base-200 text-base-content p-4">
        <div className="items-center grid-flow-col">
          <p>© 2024 Admin Portal. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default AdminLogin;
