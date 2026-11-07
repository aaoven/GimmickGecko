import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { LogIn, UserPlus, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAccount } from "@/components/AccountSession";
import { AccountField } from "@/components/AccountFields";
import { Button } from "@/components/ui/button";
import { emailSchema, loginSchema, signupSchema } from "@/lib/account-schema";
import gecko from "@/assets/gecko.png";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [
    { title: "Log in & Sign up — Gimmick Gecko" },
    { name: "description", content: "Create your Gimmick Gecko account or log in to manage your math practice profile." },
    { property: "og:title", content: "Join Gimmick Gecko" },
    { property: "og:description", content: "Your math practice account and profile." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
  ] }), component: AuthPage,
});

function AuthPage() {
  const [mode, setMode] = useState<"login" | "signup" | "forgot">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const { user, recovery } = useAccount();
  const navigate = useNavigate();
  useEffect(() => { if (user && !recovery) void navigate({ to: "/account", replace: true }); }, [user, recovery, navigate]);
  function changeMode(next: typeof mode) { setMode(next); setError(""); setNotice(""); setPassword(""); }
  async function submit(event: FormEvent) {
    event.preventDefault(); setError(""); setNotice("");
    const parsed = mode === "signup" ? signupSchema.safeParse({ username, display_name: displayName, email, password }) : mode === "login" ? loginSchema.safeParse({ email, password }) : emailSchema.safeParse(email);
    if (!parsed.success) { setError(parsed.error.issues[0]?.message ?? "Check your details."); return; }
    setBusy(true);
    try {
      if (mode === "forgot") {
        const result = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}/reset-password` });
        if (result.error) throw result.error;
        setNotice("If an account exists for this email, a password reset link is on its way.");
      } else if (mode === "signup") {
        const details = signupSchema.parse({ username, display_name: displayName, email, password });
        const { data, error: signupError } = await supabase.auth.signUp({ email: details.email, password: details.password, options: { emailRedirectTo: window.location.origin, data: { username: details.username, display_name: details.display_name } } });
        if (signupError) { setError(signupError.message.includes("Database") ? "Signup could not be completed. Try another username or try again later." : signupError.message); return; }
        setPassword("");
        if (data.session) await navigate({ to: "/account", replace: true });
        else setNotice("Check your email to confirm your account, then return here to log in.");
      } else {
        const { error: loginError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (loginError) { setError("Unable to log in. Check your email and password, and confirm your email first."); return; }
        await navigate({ to: "/account", replace: true });
      }
    } catch { setError("We couldn’t complete that request. Please try again."); }
    finally { setBusy(false); }
  }
  return <main className="mx-auto max-w-lg px-4 py-10 sm:py-14">
    <div className="mb-8 flex items-center gap-5"><img src={gecko} alt="Gecko math professor" className="pixelated h-24 w-24 shrink-0 object-contain" /><div><p className="mb-3 font-pixel text-[10px] text-accent">GIMMICK GECKO</p><h1 className="font-pixel text-lg leading-relaxed text-primary">{mode === "signup" ? "Join the class." : mode === "forgot" ? "Reset password." : "Welcome back."}</h1></div></div>
    {mode !== "forgot" && <div className="mb-6 grid grid-cols-2 gap-3"><Button variant={mode === "login" ? "default" : "outline"} onClick={() => changeMode("login")}><LogIn />Log in</Button><Button variant={mode === "signup" ? "default" : "outline"} onClick={() => changeMode("signup")}><UserPlus />Sign up</Button></div>}
    <form onSubmit={submit} className="space-y-5">
      {mode === "signup" && <><AccountField id="username" label="Username" value={username} onChange={e => setUsername(e.target.value)} autoComplete="username" maxLength={24} required /><AccountField id="display-name" label="Display name (optional)" value={displayName} onChange={e => setDisplayName(e.target.value)} autoComplete="nickname" maxLength={80} /></>}
      <AccountField id="email" label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" maxLength={254} required />
      {mode !== "forgot" && <AccountField id="password" label={mode === "signup" ? "Password (8+ characters)" : "Password"} type="password" value={password} onChange={e => setPassword(e.target.value)} autoComplete={mode === "signup" ? "new-password" : "current-password"} maxLength={128} required />}
      {error && <p role="alert" className="text-destructive">{error}</p>}{notice && <p role="status" className="border-l-4 border-primary bg-panel p-4 text-foreground">{notice}</p>}
      <Button type="submit" disabled={busy} className="w-full">{mode === "forgot" ? <Mail /> : mode === "signup" ? <UserPlus /> : <LogIn />}{busy ? "Please wait…" : mode === "signup" ? "Create account" : mode === "forgot" ? "Send reset link" : "Log in"}</Button>
    </form>
    <div className="mt-5 flex flex-wrap items-center justify-between gap-3"><Button variant="link" size="sm" onClick={() => changeMode(mode === "forgot" ? "login" : "forgot")}>{mode === "forgot" ? "Back to login" : "Forgot password?"}</Button><Link to="/" className="text-sm text-muted-foreground underline">Back to hints</Link></div>
  </main>;
}