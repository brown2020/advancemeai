"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";

export default function PracticeDebug() {
  const { user, isLoading } = useAuth();
  const [firebaseConfig, setFirebaseConfig] = useState<
    Record<string, string | undefined>
  >({});
  const [openaiKey, setOpenaiKey] = useState<string | undefined>();
  const [navigated, setNavigated] = useState(true);

  useEffect(() => {
    // Check Firebase config
    setFirebaseConfig({
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    });

    // Handle navigation events
    const handleRouteChange = () => {
      setNavigated(true);
    };

    window.addEventListener("popstate", handleRouteChange);

    return () => {
      window.removeEventListener("popstate", handleRouteChange);
    };
  }, []);

  // Debug click handler
  const handleDebugClick = () => {
    // Navigate to practice page with test parameter for development
    window.location.href = "/practice?test=true";
  };

  return (
    <div className="p-4 mt-8 bg-yellow-50 border border-yellow-200 rounded-lg">
      <h2 className="text-xl font-bold mb-4">Practice Debug Information</h2>

      <div className="mb-4">
        <h3 className="font-semibold mb-1">Auth Status:</h3>
        <p>Loading: {isLoading ? "Yes" : "No"}</p>
        <p>
          User: {user ? `Authenticated (${user.email})` : "Not authenticated"}
        </p>
      </div>

      <div className="mb-4">
        <h3 className="font-semibold mb-1">Firebase Config:</h3>
        <ul className="list-disc pl-5">
          {Object.entries(firebaseConfig).map(([key, value]) => (
            <li key={key}>
              {key}: {value ? `Set (${value.substring(0, 3)}...)` : "Not set"}
            </li>
          ))}
        </ul>
      </div>

      <div className="mb-4">
        <h3 className="font-semibold mb-1">Navigation:</h3>
        <p>Navigation successful: {navigated ? "Yes" : "No"}</p>
      </div>

      <div className="mt-4">
        <button
          onClick={handleDebugClick}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Access Practice with Test Flag
        </button>
      </div>
    </div>
  );
}
