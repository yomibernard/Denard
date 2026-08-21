import { ReviewsModerator } from "@/components/admin/reviews-moderator";
import { prisma } from "@/lib/db";
import { requireAdminPage } from "@/lib/admin-page";

export const dynamic = "force-dynamic";
export const metadata = { title: "Reviews" };

export default async function AdminReviewsPage() {
  await requireAdminPage("products");

  const reviews = await prisma.productReview.findMany({
    orderBy: [{ approved: "asc" }, { createdAt: "desc" }],
    take: 100,
    include: { product: { select: { id: true, name: true, sku: true } } },
  });

  const pending = reviews.filter((r) => !r.approved).length;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Reviews</h1>
        <p className="mt-1 text-sm text-muted">
          Moderate customer reviews before they appear on product pages.
          {pending ? ` ${pending} pending.` : ""}
        </p>
      </div>
      <ReviewsModerator
        reviews={reviews.map((r) => ({
          ...r,
          createdAt: r.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
