import type { UserRole } from "@/generated/prisma/client";

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
};

/** Permission matrix for admin navigation */
export const ROLE_PERMISSIONS: Record<
  UserRole,
  {
    products: boolean;
    catalogue: boolean;
    enquiries: boolean;
    users: boolean;
    settings: boolean;
    reports: boolean;
  }
> = {
  SUPER_ADMIN: {
    products: true,
    catalogue: true,
    enquiries: true,
    users: true,
    settings: true,
    reports: true,
  },
  BUSINESS_OWNER: {
    products: true,
    catalogue: true,
    enquiries: true,
    users: true,
    settings: true,
    reports: true,
  },
  PRODUCT_MANAGER: {
    products: true,
    catalogue: true,
    enquiries: false,
    users: false,
    settings: false,
    reports: true,
  },
  CATALOGUE_ADMIN: {
    products: true,
    catalogue: true,
    enquiries: false,
    users: false,
    settings: false,
    reports: false,
  },
  SALES_REP: {
    products: false,
    catalogue: false,
    enquiries: true,
    users: false,
    settings: false,
    reports: false,
  },
  CUSTOMER_SERVICE: {
    products: false,
    catalogue: false,
    enquiries: true,
    users: false,
    settings: false,
    reports: false,
  },
  MARKETING: {
    products: true,
    catalogue: true,
    enquiries: false,
    users: false,
    settings: false,
    reports: true,
  },
  REPORTING: {
    products: false,
    catalogue: false,
    enquiries: false,
    users: false,
    settings: false,
    reports: true,
  },
};
