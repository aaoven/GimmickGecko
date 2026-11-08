import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ComponentProps } from "react";

export function AccountField({ label, id, error, ...props }: ComponentProps<typeof Input> & { label: string; id: string; error?: string | undefined }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} className="h-12 bg-input" aria-invalid={error ? true : undefined} aria-describedby={error ? `${id}-error` : undefined} {...props} />
      {error && (
        <p id={`${id}-error`} role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
