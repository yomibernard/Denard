import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { AdminSidebar } from "@/components/admin/sidebar";

export const metadata = {
  title: {
    default: "Admin",
    template: "%s · Denard Admin",
  },
  robots: { index: false, follow: false },
};

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/admin/login");

  return (
    <div className="flex min-h-screen bg-[#f4f6f5] text-ink">
      <AdminSidebar user={session} />
      <div className="flex min-w-0 flex-1 flex-col">
        <main className="flex-1 p-5 md:p-8">{children}</main>
      </div>
    </div>
  );
}
