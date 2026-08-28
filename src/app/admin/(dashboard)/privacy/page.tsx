import { prisma } from "@/lib/db";
import { requireAdminPage } from "@/lib/admin-page";
import { PrivacyRequestsTable } from "@/components/admin/privacy-requests-table";

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
        <p className="mt-1 text-sm text-muted">
          UK GDPR access, correction and erasure requests from the privacy page. Update status as you
          handle each request (aim to respond within 30 days).
        </p>
      </div>
      <PrivacyRequestsTable
        initial={rows.map((r) => ({
          id: r.id,
          kind: r.kind,
          name: r.name,
          email: r.email,
          phone: r.phone,
          details: r.details,
          status: r.status,
          createdAt: r.createdAt.toISOString(),
          resolvedAt: r.resolvedAt?.toISOString() ?? null,
        }))}
      />
    </div>
  );
}
