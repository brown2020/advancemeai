"use client";

import { useState } from "react";
import { Dialog } from "@headlessui/react";
import { useAuth } from "@/lib/auth";

type AuthProps = {
  buttonStyle?: "primary" | "default";
};

export default function Auth({ buttonStyle = "default" }: AuthProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { user, signIn, signOut } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);

  const handleLogin = async (method: "google" | "password") => {
    try {
      setIsLoading(true);
      setError(null);
      if (method === "google") {
        await signIn("google");
      } else if (method === "password") {
        await signIn("password", { email, password });
      }
      setIsOpen(false);
    } catch {
      setError("Failed to sign in. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClick = async () => {
    if (!!user) {
      try {
        setIsLoading(true);
        await signOut();
      } catch {
        setError("Failed to sign out. Please try again.");
      } finally {
        setIsLoading(false);
      }
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
      {!!user ? (
        <button
          onClick={handleClick}
          disabled={isLoading}
          className="px-4 py-3 text-red-600 hover:text-red-700 border border-red-200 rounded-xl hover:bg-red-50 transition-colors"
        >
          {isLoading ? "..." : "Sign Out"}
        </button>
      ) : (
        <button
          onClick={handleClick}
          disabled={isLoading}
          className={buttonClasses}
        >
          {isLoading ? "..." : "Sign In"}
        </button>
      )}

      <Dialog
        open={isOpen}
        onClose={() => !isLoading && setIsOpen(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto max-w-sm rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-xl w-full">
            <Dialog.Title className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
              {isForgotPassword ? "Reset Password" : "Sign In"}
            </Dialog.Title>

            {error && (
              <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
                {error}
              </div>
            )}

            <div className="space-y-4">
              {isForgotPassword ? (
                <>
                  {resetEmailSent ? (
                    <div className="text-green-600 text-center">
                      If an account exists with this email, you will receive
                      password reset instructions.
                    </div>
                  ) : (
                    <>
                      <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <button
                        onClick={handleForgotPassword}
                        disabled={isLoading}
                        className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                      >
                        {isLoading ? "Sending..." : "Send Reset Link"}
                      </button>
                      <button
                        onClick={() => {
                          setIsForgotPassword(false);
                          setError(null);
                          setResetEmailSent(false);
                        }}
                        className="w-full text-gray-600 hover:text-gray-900"
                      >
                        Back to Sign In
                      </button>
                    </>
                  )}
                </>
              ) : (
                <div className="space-y-4">
                  <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    onClick={() => handleLogin("password")}
                    disabled={isLoading}
                    className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isLoading ? "Signing in..." : "Sign In"}
                  </button>
                  <button
                    onClick={() => {
                      setIsForgotPassword(true);
                      setError(null);
                    }}
                    className="w-full text-gray-600 hover:text-gray-900"
                  >
                    Forgot Password?
                  </button>
                </div>
              )}

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white dark:bg-gray-800 text-gray-500">
                    Or continue with
                  </span>
                </div>
              </div>

              <button
                onClick={() => handleLogin("google")}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 bg-white border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                Google
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </>
  );
}
