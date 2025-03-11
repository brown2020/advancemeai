"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth";

type AuthProps = {
  buttonStyle?: "primary" | "default";
};

export default function Auth({ buttonStyle = "default" }: AuthProps) {
  const { user, signIn } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [resetEmailSent, setResetEmailSent] = useState(false);

  const handleLogin = async (method: "google" | "password") => {
    try {
      setIsLoading(true);
      setError(null);
      if (method === "password") {
        await signIn("password", { email, password });
      } else {
        await signIn("google");
      }
      setIsOpen(false);
    } catch {
      setError(
        "Failed to sign in. Please check your credentials and try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleClick = async () => {
    if (user) {
      // No longer handling sign out here
      // Just open the modal for sign in
      setIsOpen(true);
    } else {
      setIsOpen(true);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError("Please enter an email address before requesting a reset link.");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      await signIn("resetPassword", { email });
      setResetEmailSent(true);
    } catch {
      setError("Failed to send reset email. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const buttonClasses =
    buttonStyle === "primary"
      ? "inline-flex items-center justify-center px-8 py-3 text-base font-medium rounded-xl text-white bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl"
      : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors";

  return (
    <>
      {!user ? (
        <button
          onClick={handleClick}
          disabled={isLoading}
          className={buttonClasses}
        >
          {isLoading ? "Loading..." : "Sign In"}
        </button>
      ) : null}

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Sign In</h2>
            {error && <p className="text-red-500 mb-4">{error}</p>}
            {resetEmailSent && (
              <p className="text-green-500 mb-4">
                Password reset email sent! Check your inbox.
              </p>
            )}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="your@email.com"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="••••••••"
              />
            </div>
            <div className="flex flex-col gap-2 mb-4">
              <button
                onClick={() => handleLogin("password")}
                disabled={isLoading || !email || !password}
                className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {isLoading ? "Signing in..." : "Sign in with Email"}
              </button>
              <button
                onClick={() => handleLogin("google")}
                disabled={isLoading}
                className="w-full py-2 bg-white text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  width="24"
                  height="24"
                >
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                  <path fill="none" d="M1 1h22v22H1z" />
                </svg>
                Sign in with Google
              </button>
            </div>
            <div className="text-center">
              <button
                onClick={handleForgotPassword}
                disabled={isLoading}
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                Forgot password?
              </button>
            </div>
            <div className="mt-4 text-right">
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
