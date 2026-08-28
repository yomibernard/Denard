import { prisma } from "@/lib/db";
import { productReadyToPublish } from "@/lib/product-publish";
import { tagProductWithJewelleryCategories } from "@/lib/jewellery-taxonomy";

/** Publish a draft product when name, SKU, price and at least one image are set. */
export async function autoPublishProductIfReady(productId: string) {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: { _count: { select: { images: true } } },
  });
  if (!product || product.status === "PUBLISHED") return product;

  if (
    !productReadyToPublish({
      name: product.name,
      sku: product.sku,
      price: product.price,
      imageCount: product._count.images,
    })
  ) {
    return product;
  }

  const updated = await prisma.product.update({
    where: { id: productId },
    data: {
      status: "PUBLISHED",
      publishedAt: product.publishedAt ?? new Date(),
      isNew: true,
    },
  });

  await tagProductWithJewelleryCategories(productId);
  return updated;
}

export async function productImageCount(productId: string) {
  return prisma.productImage.count({ where: { productId } });
}
