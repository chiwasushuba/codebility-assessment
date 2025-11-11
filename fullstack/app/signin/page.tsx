'use client';
import { useState } from "react";
import { auth } from "@/lib/firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider
} from "firebase/auth";
import { useRouter } from "next/navigation";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();
  const provider = new GoogleAuthProvider();

  const handleSignUp = async () => {
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      router.push("/");
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleSignIn = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/todo");
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await signInWithPopup(auth, provider);
      router.push("/todo");
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="max-w-md mx-auto p-4 flex flex-col gap-3">
      <h1 className="text-2xl font-bold">Sign In / Sign Up</h1>
      {error && <p className="text-red-500">{error}</p>}
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        className="border px-2 py-1 rounded"
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        className="border px-2 py-1 rounded"
      />
      <div className="flex gap-2">
        <button onClick={handleSignUp} className="bg-green-500 text-white px-3 py-1 rounded">
          Sign Up
        </button>
        <button onClick={handleSignIn} className="bg-blue-500 text-white px-3 py-1 rounded">
          Sign In
        </button>
      </div>
      <div className="mt-2">
        <button
          onClick={handleGoogleSignIn}
          className="bg-red-500 text-white px-3 py-1 rounded w-full"
        >
          Sign in with Google
        </button>
      </div>
    </div>
  );
}
