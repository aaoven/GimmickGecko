import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { BarChart3, LogOut, Save, Target, UserRound } from "lucide-react";
import { getProfile, saveProfile } from "@/lib/account.functions";
import { getMyAttempts, getRecommendations } from "@/lib/attempts.functions";
import { accuracy, computeSkillBreakdown } from "@/lib/skills";
import { profileSchema } from "@/lib/account-schema";
import { useAccount } from "@/components/AccountSession";
import { AccountField } from "@/components/AccountFields";
import { AnswerChecker } from "@/components/AnswerChecker";
import { DifficultyStars } from "@/components/DifficultyStars";
import { MathText } from "@/components/MathText";
import { stripMathDelimiters } from "@/lib/math-text";
import { Button, buttonVariants } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/account")({
  head: () => ({ meta: [ { title: "Your Account — Gimmick Gecko" }, { name: "description", content: "Manage your Gimmick Gecko username and personal profile." }, { property: "og:title", content: "Your Gimmick Gecko Account" }, { property: "og:description", content: "Manage your math practice profile." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" } ] }),
  component: AccountPage,
});
function AccountPage() {
  const fetchProfile = useServerFn(getProfile);
  const updateProfile = useServerFn(saveProfile);
  const fetchAttempts = useServerFn(getMyAttempts);
  const fetchRecommendations = useServerFn(getRecommendations);
  const { user } = useAccount();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const query = useQuery({ queryKey: ["profile", user?.id], queryFn: () => fetchProfile() });
  const attemptsQuery = useQuery({ queryKey: ["attempts", user?.id], queryFn: () => fetchAttempts() });
  const recsQuery = useQuery({ queryKey: ["recommendations", user?.id], queryFn: () => fetchRecommendations() });
  const stats = useMemo(() => computeSkillBreakdown(attemptsQuery.data ?? []), [attemptsQuery.data]);
  const maxTotal = Math.max(1, ...stats.map((s) => s.possible));
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (query.data) { setUsername(query.data.username); setDisplayName(query.data.display_name); setBio(query.data.bio); } }, [query.data]);
  async function submit(e: FormEvent) {
    e.preventDefault(); setError(""); setSaved(false);
    const result = profileSchema.safeParse({ username, display_name: displayName, bio });
    if (!result.success) { setError(result.error.issues[0]?.message ?? "Check your profile."); return; }
    setBusy(true);
    try { const response = await updateProfile({ data: result.data }); if (response.error) setError(response.error); else { setSaved(true); await queryClient.invalidateQueries({ queryKey: ["profile"] }); } }
    catch { setError("Your profile could not be saved. Try again."); } finally { setBusy(false); }
  }
  async function signOut() {
    setBusy(true); setError("");
    await queryClient.cancelQueries(); queryClient.clear();
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) { setError("Could not sign out. Please try again."); setBusy(false); return; }
    await navigate({ to: "/auth", replace: true });
  }
  return <main className="mx-auto max-w-2xl px-4 py-10"><div className="mb-7 flex items-center gap-3"><UserRound className="h-7 w-7 text-accent" /><h1 className="font-pixel text-lg text-primary">Your account</h1></div><p className="mb-8 break-all text-muted-foreground">{user?.email}</p>
    {query.isPending ? <p role="status">Loading your profile…</p> : query.isError ? <><p role="alert">Your profile couldn’t be loaded.</p><Button onClick={() => void query.refetch()}>Try again</Button></> : <form onSubmit={submit} className="space-y-5"><AccountField id="profile-username" label="Username" value={username} onChange={e => { setUsername(e.target.value); setSaved(false); }} maxLength={24} required /><AccountField id="profile-name" label="Display name" value={displayName} onChange={e => { setDisplayName(e.target.value); setSaved(false); }} maxLength={80} /><div className="space-y-2"><Label htmlFor="bio">About you</Label><Textarea id="bio" value={bio} onChange={e => { setBio(e.target.value); setSaved(false); }} maxLength={500} rows={4} className="bg-input" /></div><Button type="submit" disabled={busy}><Save />{busy ? "Please wait…" : "Save profile"}</Button></form>}
    {error && <p role="alert" className="mt-4 text-destructive">{error}</p>}{saved && <p role="status" className="mt-4 text-primary">Profile saved.</p>}
    <section className="mt-10 border-t-4 border-border pt-6">
      <div className="mb-1 flex items-center gap-3"><BarChart3 className="h-6 w-6 text-accent" /><h2 className="font-pixel text-sm text-primary">Skillset breakdown</h2></div>
      <p className="mb-5 text-sm text-muted-foreground">Stars earned from each question’s best score.</p>
      {attemptsQuery.isPending ? (
        <p role="status">Loading your skillset…</p>
      ) : attemptsQuery.isError ? (
        <p role="alert" className="text-destructive">Your skillset couldn't be loaded.</p>
      ) : stats.length === 0 ? (
        <p className="text-muted-foreground">No attempts yet. <Link to="/problems" className="text-accent underline">Answer some problems</Link> and your graph will grow here.</p>
      ) : (
        <>
          <ul className="space-y-4">
            {stats.map((s) => (
              <li key={s.concept}>
                <div className="mb-1 flex items-baseline justify-between gap-3">
                  <span className="font-pixel text-[9px] uppercase">{s.concept}</span>
                  <span className="text-sm text-muted-foreground">{s.earned}/{s.possible} stars · {accuracy(s)}%</span>
                </div>
                <div className="flex h-4 w-full bg-secondary" role="img" aria-label={`${s.concept}: ${s.earned} of ${s.possible} stars earned`}>
                  <div className="h-full bg-primary" style={{ width: `${(s.earned / maxTotal) * 100}%` }} />
                  <div className="h-full bg-destructive" style={{ width: `${((s.possible - s.earned) / maxTotal) * 100}%` }} />
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><span className="inline-block h-3 w-3 bg-primary" /> Earned</span>
            <span className="flex items-center gap-1"><span className="inline-block h-3 w-3 bg-destructive" /> Unearned</span>
          </div>
        </>
      )}
    </section>
    <section className="mt-10 border-t-4 border-border pt-6">
      <div className="mb-1 flex items-center gap-3"><Target className="h-6 w-6 text-accent" /><h2 className="font-pixel text-sm text-primary">Recommended for you</h2></div>
      {recsQuery.isPending ? (
        <p role="status">Loading recommendations…</p>
      ) : recsQuery.isError ? (
        <p role="alert" className="text-destructive">Recommendations couldn't be loaded.</p>
      ) : recsQuery.data.problems.length === 0 ? (
        (attemptsQuery.data?.length ?? 0) === 0 ? (
          <p className="text-muted-foreground">Answer some problems in the <Link to="/problems" className="text-accent underline">problem bank</Link> and the gecko will suggest what to practice next.</p>
        ) : (
          <p className="text-muted-foreground">You've solved every problem in the bank — nice work!</p>
        )
      ) : (
        <>
          <p className="mb-5 text-sm text-muted-foreground">
            Picked from the problem bank to train your weakest concepts: {recsQuery.data.weakest.map((s) => s.concept).join(", ")}.
          </p>
          <div className="space-y-4">
            {recsQuery.data.problems.map((p) => {
              const weak = new Set(recsQuery.data.weakest.map((s) => s.concept));
              return (
                <article key={p.id} className="bg-card p-5 pixel-box">
                  <div className="mb-3 flex flex-wrap items-center gap-3">
                    <span className="bg-primary px-2 py-1 font-pixel text-[10px] text-primary-foreground">
                      {p.contest} {p.year}{p.problem_number ? ` #${p.problem_number}` : ""}
                    </span>
                    <DifficultyStars value={p.difficulty} />
                  </div>
                  <p className="mb-4 leading-relaxed"><MathText text={p.statement} /></p>
                  <div className="mb-4 flex flex-wrap gap-2">
                    {p.concepts.map((c) => (
                      <span key={c} className={`px-2 py-0.5 text-xs ${weak.has(c) ? "bg-accent text-accent-foreground" : "bg-secondary text-muted-foreground"}`}>{c}</span>
                    ))}
                  </div>
                  <Link to="/" search={{ problem: p.statement, problemId: p.id }} className={buttonVariants({ size: "sm" })}>Get gecko hints</Link>
                  <AnswerChecker answer={p.answer} problemId={p.id} />
                </article>
              );
            })}
          </div>
        </>
      )}
    </section>
    <div className="mt-10 border-t-4 border-border pt-6"><Button variant="outline" disabled={busy} onClick={signOut}><LogOut />Sign out</Button></div>
  </main>;
}