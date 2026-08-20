"use client";

import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { WhatsAppFab } from "@/components/layout/whatsapp-fab";

type Dept = {
  id: string;
  name: string;
  slug: string;
  categories: Array<{
    id: string;
    name: string;
    slug: string;
    children: Array<{ id: string; name: string; slug: string }>;
  }>;
};

export function SiteShell({
  children,
  departments,
  whatsappPhone,
  businessPhone,
  serviceHours,
  businessEmail,
  businessAddress,
}: {
  children: React.ReactNode;
  departments: Dept[];
  whatsappPhone: string;
  businessPhone: string;
  serviceHours: string;
  businessEmail: string;
  businessAddress: string;
}) {
  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:bg-accent focus:px-3 focus:py-2 focus:text-white"
      >
        Skip to content
      </a>
      <Header departments={departments} whatsappPhone={whatsappPhone} />
      <main id="main" className="flex-1">
        {children}
      </main>
      <Footer
        phone={businessPhone}
        whatsappPhone={whatsappPhone}
        email={businessEmail}
        address={businessAddress}
        serviceHours={serviceHours}
        departments={departments}
      />
      <WhatsAppFab phone={whatsappPhone} />
    </>
  );
}
