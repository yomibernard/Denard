"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { format } from "date-fns";

type UserRow = {
  id: string;
  email: string;
  name: string;
  role: string;
  active: boolean;
  phone: string | null;
  lastLoginAt: string | null;
  createdAt: string;
};

const ROLES = [
  "BUSINESS_OWNER",
  "PRODUCT_MANAGER",
  "CATALOGUE_ADMIN",
  "SALES_REP",
  "CUSTOMER_SERVICE",
  "MARKETING",
  "REPORTING",
  "SUPER_ADMIN",
];

export function UsersManager({ users }: { users: UserRow[] }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "SALES_REP",
    phone: "",
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
  });

  function createUser(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Could not create user");
        return;
      }
      setForm({ name: "", email: "", password: "", role: "SALES_REP", phone: "" });
      setMessage(`Created ${data.user?.email}`);
      router.refresh();
    });
  }

  function changeOwnPassword(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const res = await fetch("/api/admin/account/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(passwordForm),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Could not change password");
        return;
      }
      setPasswordForm({ currentPassword: "", newPassword: "" });
      setMessage("Your password was updated.");
    });
  }

  function toggleActive(user: UserRow) {
    startTransition(async () => {
      await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !user.active }),
      });
      router.refresh();
    });
  }

  function resetPassword(user: UserRow) {
    const next = window.prompt(`New temporary password for ${user.email} (min 10 chars, letters + numbers):`);
    if (!next) return;
    startTransition(async () => {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resetPassword: next }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Reset failed");
        return;
      }
      setMessage(`Password reset for ${user.email}`);
    });
  }

  return (
    <div className="space-y-6">
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      {message ? <p className="text-sm text-success">{message}</p> : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <form onSubmit={createUser} className="space-y-3 rounded-lg border border-line bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold">Create staff user</h2>
          <input
            required
            placeholder="Full name"
            className="h-9 w-full rounded border border-line px-3 text-sm"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
          <input
            required
            type="email"
            placeholder="Email"
            className="h-9 w-full rounded border border-line px-3 text-sm"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          />
          <input
            required
            type="password"
            placeholder="Temporary password"
            className="h-9 w-full rounded border border-line px-3 text-sm"
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
          />
          <select
            className="h-9 w-full rounded border border-line px-3 text-sm"
            value={form.role}
            onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r.replace(/_/g, " ")}
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={pending}
            className="h-9 rounded bg-accent px-4 text-sm font-medium text-white disabled:opacity-60"
          >
            {pending ? "Saving…" : "Create user"}
          </button>
        </form>

        <form
          onSubmit={changeOwnPassword}
          className="space-y-3 rounded-lg border border-line bg-white p-4 shadow-sm"
        >
          <h2 className="text-sm font-semibold">Change my password</h2>
          <input
            required
            type="password"
            placeholder="Current password"
            className="h-9 w-full rounded border border-line px-3 text-sm"
            value={passwordForm.currentPassword}
            onChange={(e) => setPasswordForm((f) => ({ ...f, currentPassword: e.target.value }))}
          />
          <input
            required
            type="password"
            placeholder="New password (10+ chars, letters + numbers)"
            className="h-9 w-full rounded border border-line px-3 text-sm"
            value={passwordForm.newPassword}
            onChange={(e) => setPasswordForm((f) => ({ ...f, newPassword: e.target.value }))}
          />
          <button
            type="submit"
            disabled={pending}
            className="h-9 rounded border border-line px-4 text-sm font-medium hover:bg-sand disabled:opacity-60"
          >
            Update password
          </button>
        </form>
      </div>

      <div className="overflow-x-auto rounded-lg border border-line bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#f8faf9] text-xs uppercase text-muted">
            <tr>
              <th className="px-4 py-2.5 font-medium">Name</th>
              <th className="px-4 py-2.5 font-medium">Email</th>
              <th className="px-4 py-2.5 font-medium">Role</th>
              <th className="px-4 py-2.5 font-medium">Active</th>
              <th className="px-4 py-2.5 font-medium">Last login</th>
              <th className="px-4 py-2.5 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-line">
                <td className="px-4 py-2.5 font-medium">{u.name}</td>
                <td className="px-4 py-2.5">{u.email}</td>
                <td className="px-4 py-2.5 text-xs">{u.role.replace(/_/g, " ")}</td>
                <td className="px-4 py-2.5 text-xs">{u.active ? "Yes" : "No"}</td>
                <td className="px-4 py-2.5 text-xs text-muted">
                  {u.lastLoginAt ? format(new Date(u.lastLoginAt), "dd MMM yyyy HH:mm") : "—"}
                </td>
                <td className="px-4 py-2.5">
                  <div className="flex flex-wrap gap-2 text-xs">
                    <button type="button" className="text-accent hover:underline" onClick={() => toggleActive(u)}>
                      {u.active ? "Deactivate" : "Activate"}
                    </button>
                    <button type="button" className="text-accent hover:underline" onClick={() => resetPassword(u)}>
                      Reset password
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
