"use client";
import { useState } from "react";
import { Input } from "@/app/components/ui/input";
import { Button } from "@/app/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/app/components/ui/card";
import { Alert, AlertDescription } from "@/app/components/ui/alert";
import { Lock } from "lucide-react";

export default function PasswordProtectionPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/verify-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ password })
      });

      if (response.ok) {
        // Redirect to the originally requested URL or home page
        window.location.href = window.location.search.includes("from=")
          ? decodeURIComponent(window.location.search.split("from=")[1])
          : "/";
      } else {
        setError("Invalid password");
      }
    } catch (err) {
      console.error("Error verifying password:", err);
      setError("Password verification failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[hsl(0_0%_3.9%)] flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-[hsl(0_0%_14.9%)] border-[hsl(0_0%_14.9%)]">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center text-[hsl(0_0%_98%)] flex items-center justify-center gap-2">
            <Lock className="h-6 w-6" />
            Enter Password
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter site password"
                required
                className="bg-[hsl(0_0%_9%)] border-[hsl(0_0%_14.9%)] text-[hsl(0_0%_98%)] 
                  placeholder:text-[hsl(0_0%_63.9%)] focus:border-[hsl(220_70%_50%)] 
                  focus:ring-[hsl(220_70%_50%)] hover:border-[hsl(0_0%_18.9%)]"
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
                  Verifying...
                </div>
              ) : (
                "Enter Site"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
