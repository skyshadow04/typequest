"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type AdminUser = {
  id: string;
  email: string;
  createdAt: string;
  lastSignInAt: string | null;
  disabled: boolean;
};

async function requestAdminApi(method: "GET" | "PATCH", body?: object) {
  const supabase = createSupabaseBrowserClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    throw new Error("Please sign in with an administrator account.");
  }

  const response = await fetch("/api/admin/users", {
    method,
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error ?? "Admin request failed.");
  }

  return result;
}

export default function AdminPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [message, setMessage] = useState("Checking admin access...");
  const [loading, setLoading] = useState(true);
  const [updatingUserId, setUpdatingUserId] = useState("");

  useEffect(() => {
    let active = true;

    async function loadUsers() {
      try {
        const result = await requestAdminApi("GET");
        if (!active) return;
        setUsers(result.users);
        setMessage("");
      } catch (error) {
        if (!active) return;
        setMessage(error instanceof Error ? error.message : "Unable to load users.");
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadUsers();
    return () => {
      active = false;
    };
  }, []);

  async function setUserEnabled(user: AdminUser, enabled: boolean) {
    setUpdatingUserId(user.id);
    setMessage("");
    try {
      await requestAdminApi("PATCH", { userId: user.id, enabled });
      setUsers((currentUsers) =>
        currentUsers.map((current) =>
          current.id === user.id ? { ...current, disabled: !enabled } : current
        )
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to update account.");
    } finally {
      setUpdatingUserId("");
    }
  }

  return (
    <main className="min-h-screen bg-[#100f19] p-6 text-white">
      <div className="mx-auto max-w-5xl">
        <Link href="/" className="text-sm text-amber-300 hover:underline">
          Back to TypeQuest
        </Link>
        <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black text-amber-300">Admin</h1>
            <p className="mt-2 text-gray-400">Manage registered user accounts.</p>
          </div>
          {!loading && !message && (
            <p className="rounded-lg border border-white/10 bg-white/5 px-4 py-2">
              Users: <strong>{users.length}</strong>
            </p>
          )}
        </div>

        {message && (
          <p role="status" className="mt-6 rounded-lg border border-white/10 bg-white/5 p-4 text-gray-300">
            {message}
          </p>
        )}

        {!loading && !message && (
          <div className="mt-8 overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full min-w-[700px] text-left text-sm">
              <thead className="bg-white/5 text-gray-300">
                <tr>
                  <th className="p-4">Email</th>
                  <th className="p-4">Created</th>
                  <th className="p-4">Last sign in</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-t border-white/10">
                    <td className="p-4">{user.email}</td>
                    <td className="p-4">{new Date(user.createdAt).toLocaleDateString()}</td>
                    <td className="p-4">
                      {user.lastSignInAt
                        ? new Date(user.lastSignInAt).toLocaleDateString()
                        : "Never"}
                    </td>
                    <td className="p-4">
                      <span className={user.disabled ? "text-red-300" : "text-green-300"}>
                        {user.disabled ? "Disabled" : "Enabled"}
                      </span>
                    </td>
                    <td className="p-4">
                      <button
                        type="button"
                        disabled={updatingUserId === user.id}
                        onClick={() => void setUserEnabled(user, user.disabled)}
                        className="rounded-md border border-white/20 px-3 py-2 hover:bg-white/10 disabled:opacity-50"
                      >
                        {updatingUserId === user.id
                          ? "Updating..."
                          : user.disabled
                            ? "Enable"
                            : "Disable"}
                      </button>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-gray-400">
                      No registered users.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
