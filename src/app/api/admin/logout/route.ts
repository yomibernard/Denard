import { destroySession } from "@/lib/auth";
import { jsonOk } from "@/lib/admin-api";

export async function POST() {
  await destroySession();
  return jsonOk({ ok: true });
}
