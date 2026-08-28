/** Minimum fields before a product can appear on the shop. */
export function productReadyToPublish(product: {
  name?: string | null;
  sku?: string | null;
  price?: number | null;
  imageCount: number;
}) {
  const name = product.name?.trim() ?? "";
  const sku = product.sku?.trim() ?? "";
  const price = product.price;
  return Boolean(name && sku && price != null && !Number.isNaN(Number(price)) && product.imageCount >= 1);
}
