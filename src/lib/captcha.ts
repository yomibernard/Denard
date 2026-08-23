/** Optional Cloudflare Turnstile. Skips when secret is unset (dev). */
export async function verifyTurnstile(token: string | undefined, ip?: string) {
  const secret = process.env.TURNSTILE_SECRET_KEY?.trim();
  if (!secret) return { ok: true, skipped: true as const };
  if (!token) return { ok: false, skipped: false as const, error: "Verification required" };

  try {
    const body = new URLSearchParams({ secret, response: token });
    if (ip) body.set("remoteip", ip);
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body,
    });
    const data = (await res.json()) as { success?: boolean };
    return { ok: Boolean(data.success), skipped: false as const };
  } catch {
    return { ok: false, skipped: false as const, error: "Verification failed" };
  }
}

export const verifyTurnstileToken = verifyTurnstile;
