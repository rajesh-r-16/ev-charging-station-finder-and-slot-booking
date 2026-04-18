import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface PasswordStrengthProps {
  password: string;
}

const rules = [
  { label: "At least 8 characters", test: (p: string) => p.length >= 8 },
  { label: "One uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
  { label: "One lowercase letter", test: (p: string) => /[a-z]/.test(p) },
  { label: "One number", test: (p: string) => /[0-9]/.test(p) },
];

export const PasswordStrength = ({ password }: PasswordStrengthProps) => {
  if (!password) return null;

  return (
    <ul className="space-y-1 text-xs">
      {rules.map((rule) => {
        const passed = rule.test(password);
        return (
          <li
            key={rule.label}
            className={cn(
              "flex items-center gap-2",
              passed ? "text-electric-green" : "text-muted-foreground"
            )}
          >
            {passed ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
            {rule.label}
          </li>
        );
      })}
    </ul>
  );
};
