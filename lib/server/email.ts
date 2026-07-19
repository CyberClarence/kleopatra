/**
 * Sends the 6-digit verification code.
 *
 * Providers (first configured wins):
 *   - Resend (RESEND_API_KEY + EMAIL_FROM)
 *   - Postmark (POSTMARK_API_TOKEN + POSTMARK_FROM_EMAIL)
 * Development: with neither configured, the code is printed to the dev server
 * console and also returned to the client (dev only) so the flow can be
 * exercised end-to-end without an email provider.
 */
export async function sendVerificationCode(
  email: string,
  code: string
): Promise<{ delivered: boolean }> {
  const subject = `${code} is your Kleopatra verification code`;
  const text = `Your Kleopatra verification code is: ${code}\n\nIt expires in 10 minutes. If you did not request this, you can ignore this email.`;
  const html = `<div style="font-family:sans-serif;max-width:480px;margin:0 auto">
    <h2 style="color:#0e7490">Kleopatra</h2>
    <p>Your verification code is:</p>
    <p style="font-size:32px;letter-spacing:8px;font-weight:bold">${code}</p>
    <p style="color:#666">It expires in 10 minutes. If you did not request this, you can ignore this email.</p>
  </div>`;

  if (process.env.RESEND_API_KEY) {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || "Kleopatra <no-reply@kleopatra.app>",
        to: [email],
        subject,
        text,
        html,
      }),
    });
    if (!res.ok) {
      throw new Error(`Email send failed (${res.status}): ${await res.text()}`);
    }
    return { delivered: true };
  }

  if (process.env.POSTMARK_API_TOKEN) {
    const res = await fetch("https://api.postmarkapp.com/email", {
      method: "POST",
      headers: {
        "X-Postmark-Server-Token": process.env.POSTMARK_API_TOKEN,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        From: process.env.EMAIL_FROM || process.env.POSTMARK_FROM_EMAIL,
        To: email,
        Subject: subject,
        TextBody: text,
        HtmlBody: html,
        MessageStream: "outbound",
      }),
    });
    if (!res.ok) {
      throw new Error(`Email send failed (${res.status}): ${await res.text()}`);
    }
    return { delivered: true };
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("No email provider configured (RESEND_API_KEY or POSTMARK_API_TOKEN)");
  }
  console.log(`\n[sync][dev] Verification code for ${email}: ${code}\n`);
  return { delivered: false };
}
