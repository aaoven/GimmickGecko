import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ComponentProps } from "react";

export function AccountField({ label, id, ...props }: ComponentProps<typeof Input> & { label: string; id: string }) {
  return <div className="space-y-2"><Label htmlFor={id}>{label}</Label><Input id={id} className="h-12 bg-input" {...props} /></div>;
}