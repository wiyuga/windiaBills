"use client";

import React, { useState } from "react";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { app } from "@/lib/firebaseConfig";
import { useRouter } from "next/navigation";

export default function PortalLoginPage() {
  // 1) Declare your state here
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  // 2) Grab the Next.js router
  const router = useRouter();

  // 3) Define handleLogin _after_ your hooks so it can see `email` & `password`
  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const auth = getAuth(app);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/portal/dashboard");
    } catch (err: any) {
      setError(err.message);
    }
  };

  // 4) JSX (your form) references the same `email`, `password`, etc.
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded shadow-md">
        <h2 className="text-2xl font-bold text-center">Portal Login</h2>
        {error && <p className="text-red-500 text-center text-sm">{error}</p>}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              className="mt-1 block w-full px-3 py-2 border rounded-md"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              className="mt-1 block w-full px-3 py-2 border rounded-md"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button
            type="submit"
            className="w-full py-2 px-4 rounded-md bg-indigo-600 text-white"
          >
            Sign in
          </button>
        </form>
      </div>
    </div>
  );
}
