import "server-only";

export type SendEmailInput = {
  to: string | string[];
  subject: string;
  text: string;
  html?: string;
};

export type SendEmailResult =
  | { sent: true; id?: string }
  | { sent: false; skipped: true; reason: string }
  | { sent: false; error: string };

/**
 * Send transactional email via Resend when RESEND_API_KEY is set.
 * Silently skips when unconfigured so WhatsApp-first flow still works.
 */
export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    return { sent: false, skipped: true, reason: "RESEND_API_KEY not set" };
  }

  const from =
    process.env.EMAIL_FROM?.trim() ||
    process.env.EMAIL_FROM_ADDRESS?.trim() ||
    "Denard <onboarding@resend.dev>";

  const to = Array.isArray(input.to) ? input.to : [input.to];
  if (!to.length || !to[0]) {
    return { sent: false, skipped: true, reason: "No recipient" };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to,
        subject: input.subject,
        text: input.text,
        html: input.html ?? `<pre style="font-family:sans-serif;white-space:pre-wrap">${escapeHtml(input.text)}</pre>`,
      }),
    });

    const data = (await res.json().catch(() => ({}))) as { id?: string; message?: string };
    if (!res.ok) {
      return { sent: false, error: data.message || `Resend HTTP ${res.status}` };
    }
    return { sent: true, id: data.id };
  } catch (err) {
    return { sent: false, error: err instanceof Error ? err.message : "Email failed" };
  }
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function notifyNewEnquiry(opts: {
  reference: string;
  customerName: string;
  customerPhone: string;
  itemSummary: string;
  adminUrl: string;
  trackUrl: string;
}): Promise<SendEmailResult> {
  const to =
    process.env.ENQUIRY_NOTIFY_EMAIL?.trim() ||
    process.env.ADMIN_DEFAULT_EMAIL?.trim() ||
    "";

  if (!to) {
    return { sent: false, skipped: true, reason: "ENQUIRY_NOTIFY_EMAIL not set" };
  }

  const text = [
    `New Denard enquiry ${opts.reference}`,
    "",
    `Customer: ${opts.customerName}`,
    `Phone: ${opts.customerPhone}`,
    `Items: ${opts.itemSummary}`,
    "",
    `Admin: ${opts.adminUrl}`,
    `Track: ${opts.trackUrl}`,
  ].join("\n");

  return sendEmail({
    to,
    subject: `[Denard] New enquiry ${opts.reference}`,
    text,
  });
}
