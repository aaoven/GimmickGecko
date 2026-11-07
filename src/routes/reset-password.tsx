import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { KeyRound } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAccount } from "@/components/AccountSession";
import { passwordSchema } from "@/lib/account-schema";
import { AccountField } from "@/components/AccountFields";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/reset-password")({ head: () => ({ meta: [{ title: "Reset Password — Gimmick Gecko" }, { name: "description", content: "Choose a new password for your Gimmick Gecko account." }, { property: "og:title", content: "Reset your Gimmick Gecko password" }, { property: "og:description", content: "Securely recover access to your account." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }), component: ResetPassword });
function ResetPassword() {
  const { recovery, user, loading } = useAccount();
  const [fromLink, setFromLink] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  useEffect(() => { setFromLink(new URLSearchParams(window.location.hash.slice(1)).get("type") === "recovery"); }, []);
  const valid = !!user && (recovery || fromLink);
  async function submit(e: FormEvent) {
    e.preventDefault(); setError("");
    if (!valid) { setError("Open a fresh password reset link from your email."); return; }
    const parsed = passwordSchema.safeParse(password);
    if (!parsed.success) { setError(parsed.error.issues[0]?.message ?? "Check your password."); return; }
    if (password !== confirm) { setError("Your passwords don’t match."); return; }
    setBusy(true);
    try { const { error: updateError } = await supabase.auth.updateUser({ password: parsed.data }); if (updateError) setError("Couldn’t reset your password. Request a new reset link and try again."); else { setDone(true); setPassword(""); setConfirm(""); } } catch { setError("Please try again."); } finally { setBusy(false); }
  }
  return <main className="mx-auto max-w-lg px-4 py-10"><h1 className="mb-8 font-pixel text-lg leading-relaxed text-primary">Choose a new password</h1>{done ? <><p role="status" className="mb-6">Your password has been updated.</p><Button asChild><Link to="/account">Your account</Link></Button></> : loading ? <p>Checking your reset link…</p> : !valid ? <><p role="alert" className="mb-6">This reset link is missing or expired. Request a new one.</p><Button asChild><Link to="/auth">Back to login</Link></Button></> : <form onSubmit={submit} className="space-y-5"><AccountField id="new-password" label="New password (8+ characters)" type="password" autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)} maxLength={128} required /><AccountField id="confirm-password" label="Confirm password" type="password" autoComplete="new-password" value={confirm} onChange={e => setConfirm(e.target.value)} maxLength={128} required />{error && <p role="alert" className="text-destructive">{error}</p>}<Button disabled={busy} type="submit"><KeyRound />{busy ? "Please wait…" : "Update password"}</Button></form>}</main>;
}