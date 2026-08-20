import { prisma } from "@/lib/db";
import { SettingsForm } from "@/components/admin/settings-form";
import { requireAdminPage } from "@/lib/admin-page";

export const dynamic = "force-dynamic";
export const metadata = { title: "Settings" };

export default async function AdminSettingsPage() {
  await requireAdminPage("settings");

  const rows = await prisma.siteSetting.findMany({ orderBy: { key: "asc" } });
  const initial: Record<string, string> = {};
  for (const row of rows) initial[row.key] = row.value;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted">Site and WhatsApp configuration</p>
      </div>
      <SettingsForm initial={initial} />
    </div>
  );
}
