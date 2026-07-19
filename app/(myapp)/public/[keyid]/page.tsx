import { redirect } from "next/navigation";

// The old standalone key page is retired. Deep links to a public key now open
// the current app (the Sigil window) with that key pre-selected.
export default async function PublicKeyRedirect({
  params,
}: {
  params: Promise<{ keyid: string }>;
}) {
  const { keyid } = await params;
  redirect(`/?tab=public&key=${encodeURIComponent(keyid)}`);
}
