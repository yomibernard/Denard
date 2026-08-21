"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Login failed");
        return;
      }
      router.push("/admin");
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="w-full max-w-sm space-y-4 rounded-lg border border-line bg-white p-8 shadow-sm">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-accent">Denard</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink">Admin sign in</h1>
        <p className="mt-1 text-sm text-muted">Use your staff credentials to continue.</p>
      </div>
      {error ? (
        <p className="rounded border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger">{error}</p>
      ) : null}
      <div>
        <label htmlFor="email" className="mb-1 block text-xs font-medium text-ink-soft">
          Email
        </label>
        <input
          id="email"
          type="email"
          required
          autoComplete="username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="h-10 w-full rounded border border-line px-3 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
        />
      </div>
      <div>
        <label htmlFor="password" className="mb-1 block text-xs font-medium text-ink-soft">
          Password
        </label>
        <input
          id="password"
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="h-10 w-full rounded border border-line px-3 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="h-10 w-full rounded bg-accent text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-60"
      >
        {loading ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
