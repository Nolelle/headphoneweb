"use client";
import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Button } from "@/app/components/ui/button";
import { Label } from "@/app/components/ui/label";
import { Alert, AlertDescription } from "@/app/components/ui/alert";
import { Lock } from "lucide-react";

const AdminLogin = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

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
      console.error("Login error:", err);
      setError("Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[hsl(0_0%_3.9%)]">
      <main className="flex-grow flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-[hsl(0_0%_14.9%)] border-[hsl(0_0%_14.9%)]">
          <CardHeader className="space-y-2 text-center">
            <CardTitle className="text-2xl font-bold text-[hsl(0_0%_98%)] flex items-center justify-center gap-2">
              <Lock className="h-5 w-5" />
              Admin Login
            </CardTitle>
          </CardHeader>

          <CardContent>
            <form
              onSubmit={handleSubmit}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label
                  htmlFor="username"
                  className="text-[hsl(0_0%_98%)]"
                >
                  Username
                </Label>
                <Input
                  id="username"
                  name="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="bg-[hsl(0_0%_9%)] border-[hsl(0_0%_14.9%)] text-[hsl(0_0%_98%)] 
                    placeholder:text-[hsl(0_0%_63.9%)] focus:border-[hsl(220_70%_50%)] 
                    focus:ring-[hsl(220_70%_50%)] hover:border-[hsl(0_0%_18.9%)]"
                  placeholder="Enter your username"
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="password"
                  className="text-[hsl(0_0%_98%)]"
                >
                  Password
                </Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-[hsl(0_0%_9%)] border-[hsl(0_0%_14.9%)] text-[hsl(0_0%_98%)] 
                    placeholder:text-[hsl(0_0%_63.9%)] focus:border-[hsl(220_70%_50%)] 
                    focus:ring-[hsl(220_70%_50%)] hover:border-[hsl(0_0%_18.9%)]"
                  placeholder="Enter your password"
                />
              </div>

              {error && (
                <Alert
                  variant="destructive"
                  className="bg-[hsl(0_62.8%_30.6%)] border-[hsl(0_62.8%_30.6%)]"
                >
                  <AlertDescription className="text-[hsl(0_0%_98%)]">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[hsl(220_70%_50%)] hover:bg-[hsl(220_70%_45%)] text-[hsl(0_0%_98%)]"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-[hsl(0_0%_98%)] border-t-transparent" />
                    Signing in...
                  </div>
                ) : (
                  "Sign in"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>

      <footer className="p-4 text-center">
        <p className="text-[hsl(0_0%_63.9%)]">
          © {new Date().getFullYear()} Admin Portal. All rights reserved.
        </p>
      </footer>
    </div>
  );
};

export default AdminLogin;
