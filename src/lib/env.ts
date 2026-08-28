/**
 * Production environment checks. Used by health + instrumentation.
 */

export type EnvCheck = {
  ok: boolean;
  errors: string[];
  warnings: string[];
};

export function checkEnv(opts?: { requireS3?: boolean }): EnvCheck {
  const errors: string[] = [];
  const warnings: string[] = [];
  const isProd = process.env.NODE_ENV === "production";

  const db = process.env.DATABASE_URL?.trim() ?? "";
  if (!db) errors.push("DATABASE_URL is missing");
  else if (!/^postgres(ql)?:\/\//i.test(db)) {
    errors.push("DATABASE_URL must be a PostgreSQL URL");
  }

  const secret = process.env.AUTH_SECRET?.trim() ?? "";
  if (!secret || secret.length < 32 || secret.includes("change-me")) {
    if (isProd) errors.push("AUTH_SECRET must be a random string of at least 32 characters");
    else warnings.push("AUTH_SECRET is weak — set 32+ chars before production");
  }

  const site = process.env.NEXT_PUBLIC_SITE_URL?.trim() ?? "";
  if (!site) {
    if (isProd) errors.push("NEXT_PUBLIC_SITE_URL is missing");
    else warnings.push("NEXT_PUBLIC_SITE_URL is unset");
  } else if (isProd && /localhost/i.test(site)) {
    errors.push("NEXT_PUBLIC_SITE_URL must be https://denard.co.uk in production (not localhost)");
  } else if (isProd && site && !/denard\.co\.uk/i.test(site)) {
    warnings.push("NEXT_PUBLIC_SITE_URL is not denard.co.uk — confirm this is intentional");
  }

  const wa =
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ||
    process.env.WHATSAPP_PHONE ||
    process.env.NEXT_PUBLIC_WHATSAPP_PHONE;
  if (!wa || !/^\d{8,15}$/.test(String(wa).replace(/\D/g, ""))) {
    warnings.push("WhatsApp number env looks empty or invalid (can also set in Admin → Settings)");
  }

  const s3Ready = Boolean(
    process.env.S3_BUCKET &&
      process.env.S3_ACCESS_KEY_ID &&
      process.env.S3_SECRET_ACCESS_KEY &&
      (process.env.S3_PUBLIC_BASE_URL || process.env.S3_ENDPOINT),
  );
  if (opts?.requireS3 || (isProd && process.env.ALLOW_LOCAL_MEDIA !== "true")) {
    if (!s3Ready) {
      if (isProd) {
        errors.push(
          "S3/R2 media is required in production (set S3_BUCKET, keys, and S3_PUBLIC_BASE_URL). Set ALLOW_LOCAL_MEDIA=true only for emergency.",
        );
      } else {
        warnings.push("S3/R2 media is not configured — uploads will use local public/uploads");
      }
    }
  }

  if (!process.env.RESEND_API_KEY && !process.env.SMTP_URL) {
    warnings.push("No email provider configured (RESEND_API_KEY) — enquiry email alerts disabled");
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    warnings.push("Stripe not configured — card payment links disabled (WhatsApp / offline payment still work)");
  } else if (!process.env.STRIPE_WEBHOOK_SECRET && process.env.NODE_ENV === "production") {
    warnings.push("STRIPE_WEBHOOK_SECRET missing — payment confirmations will not auto-update");
  }

  return { ok: errors.length === 0, errors, warnings };
}

export function assertProductionEnv() {
  if (process.env.NODE_ENV !== "production") return;
  const result = checkEnv();
  for (const w of result.warnings) console.warn(`[denard] ${w}`);
  if (!result.ok) {
    console.error("[denard] Production env check failed:\n- " + result.errors.join("\n- "));
  }
}
