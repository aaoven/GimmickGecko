import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { ConceptStars } from "@/lib/skills";
import { Button } from "@/components/ui/button";

export function SkillsetBreakdown({ stats }: { stats: ConceptStars[] }) {
  const [expanded, setExpanded] = useState(false);
  const visibleStats = expanded ? stats : stats.slice(0, 8);

  return (
    <>
      <ul id="skillset-concepts" aria-label="Concept star totals" className="space-y-4">
        {visibleStats.map((s) => (
          <li key={s.concept}>
            <div className="mb-1 flex items-baseline justify-between gap-3">
              <span className="min-w-0 break-words font-pixel text-[9px] uppercase leading-relaxed">{s.concept}</span>
              <span className="shrink-0 text-sm text-muted-foreground"><span className="text-accent">★</span> {s.earned} / {s.possible} stars</span>
            </div>
            <div className="flex h-4 w-full bg-secondary" role="img" aria-label={`${s.concept}: ${s.earned} of ${s.possible} possible stars`}>
              <div className="h-full bg-primary" style={{ width: `${s.possible ? (s.earned / s.possible) * 100 : 0}%` }} />
            </div>
          </li>
        ))}
      </ul>
      {stats.length > 8 && (
        <Button type="button" variant="outline" size="sm" className="mt-5" aria-expanded={expanded} aria-controls="skillset-concepts" onClick={() => setExpanded((value) => !value)}>
          {expanded ? "Show less" : "Show more"}
          {expanded ? <ChevronUp aria-hidden="true" /> : <ChevronDown aria-hidden="true" />}
        </Button>
      )}
    </>
  );
}