import { SiteShell } from "@/components/layout/site-shell";
import { getNavigationTree, getSiteSetting } from "@/lib/catalogue";
import { getWhatsAppPhone } from "@/lib/whatsapp-server";

/** Avoid needing DATABASE_URL during `next build` page data collection on Vercel. */
export const dynamic = "force-dynamic";

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const [departments, whatsappPhone, businessPhone, serviceHours, businessEmail, businessAddress] =
    await Promise.all([
      getNavigationTree(),
      getWhatsAppPhone(),
      getSiteSetting("business_phone", "+44 7887 539426"),
      getSiteSetting("service_hours", "Mon–Sat, 9:00–18:00 GMT"),
      getSiteSetting("business_email", "hello@denard.co.uk"),
      getSiteSetting("business_address", "England, United Kingdom"),
    ]);

  const navDepartments = departments.map((d) => ({
    id: d.id,
    name: d.name,
    slug: d.slug,
    categories: d.categories.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      children: c.children.map((ch) => ({ id: ch.id, name: ch.name, slug: ch.slug })),
    })),
  }));

  return (
    <SiteShell
      departments={navDepartments}
      whatsappPhone={whatsappPhone}
      businessPhone={businessPhone}
      serviceHours={serviceHours}
      businessEmail={businessEmail}
      businessAddress={businessAddress}
    >
      {children}
    </SiteShell>
  );
}
