/**
 * Sends the 6-digit verification code.
 *
 * Production: Resend (https://resend.com) — set RESEND_API_KEY and EMAIL_FROM.
 * Development: if no API key is configured, the code is printed to the dev
 * server console and also returned to the client (dev only) so the flow can be
 * exercised end-to-end without an email provider.
 */
export async function sendVerificationCode(
  email: string,
  code: string
): Promise<{ delivered: boolean }> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || "Kleopatra <no-reply@kleopatra.app>";

  if (!apiKey) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("RESEND_API_KEY is not configured");
    }
    console.log(`\n[sync][dev] Verification code for ${email}: ${code}\n`);
    return { delivered: false };
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [email],
      subject: `${code} is your Kleopatra verification code`,
      text: `Your Kleopatra verification code is: ${code}\n\nIt expires in 10 minutes. If you did not request this, you can ignore this email.`,
      html: `<div style="font-family:sans-serif;max-width:480px;margin:0 auto">
        <h2 style="color:#0e7490">Kleopatra</h2>
        <p>Your verification code is:</p>
        <p style="font-size:32px;letter-spacing:8px;font-weight:bold">${code}</p>
        <p style="color:#666">It expires in 10 minutes. If you did not request this, you can ignore this email.</p>
      </div>`,
    }),
  });

  if (!res.ok) {
    throw new Error(`Email send failed (${res.status}): ${await res.text()}`);
  }
  return { delivered: true };
}
