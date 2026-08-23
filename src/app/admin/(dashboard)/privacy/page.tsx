import { format } from "date-fns";
import { prisma } from "@/lib/db";
import { requireAdminPage } from "@/lib/admin-page";

export const dynamic = "force-dynamic";
export const metadata = { title: "Privacy requests" };

export default async function AdminPrivacyPage() {
  await requireAdminPage("settings");
  const rows = await prisma.privacyRequest.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Privacy requests</h1>
        <p className="mt-1 text-sm text-muted">UK GDPR access, correction and erasure requests from the privacy page.</p>
      </div>
      <div className="overflow-x-auto rounded-lg border border-line bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#f8faf9] text-xs uppercase text-muted">
            <tr>
              <th className="px-4 py-2.5">When</th>
              <th className="px-4 py-2.5">Kind</th>
              <th className="px-4 py-2.5">Name</th>
              <th className="px-4 py-2.5">Contact</th>
              <th className="px-4 py-2.5">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted">
                  No requests yet
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="border-t border-line align-top">
                  <td className="px-4 py-2.5 text-xs">{format(r.createdAt, "dd MMM yyyy HH:mm")}</td>
                  <td className="px-4 py-2.5">{r.kind}</td>
                  <td className="px-4 py-2.5">{r.name}</td>
                  <td className="px-4 py-2.5 text-xs">
                    {r.email}
                    {r.phone ? <div>{r.phone}</div> : null}
                    {r.details ? <p className="mt-1 text-muted">{r.details}</p> : null}
                  </td>
                  <td className="px-4 py-2.5">{r.status}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
