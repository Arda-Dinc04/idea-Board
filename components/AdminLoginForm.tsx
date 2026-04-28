"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, LockKeyhole } from "lucide-react";
import { toast } from "sonner";
import { loginAdmin } from "@/lib/actions";
import { PRESET_ADMIN_ACCOUNTS } from "@/lib/admin-presets";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function AdminLoginForm() {
  const router = useRouter();
  const [selectedAdmin, setSelectedAdmin] = useState<string>(PRESET_ADMIN_ACCOUNTS[0].email);
  const [customEmail, setCustomEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isPending, startTransition] = useTransition();
  const email = selectedAdmin === "custom" ? customEmail : selectedAdmin;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    startTransition(async () => {
      const result = await loginAdmin({ email, password });

      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      toast.success("Signed in.");
      router.replace("/admin");
      router.refresh();
    });
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <Select value={selectedAdmin} onValueChange={setSelectedAdmin}>
        <SelectTrigger className="h-11 w-full rounded-lg bg-card">
          <SelectValue placeholder="Choose admin" />
        </SelectTrigger>
        <SelectContent>
          {PRESET_ADMIN_ACCOUNTS.map((admin) => (
            <SelectItem key={admin.email} value={admin.email}>
              {admin.label} - {admin.email}
            </SelectItem>
          ))}
          <SelectItem value="custom">Other admin email</SelectItem>
        </SelectContent>
      </Select>
      {selectedAdmin === "custom" ? (
        <Input
          value={customEmail}
          onChange={(event) => setCustomEmail(event.target.value)}
          type="email"
          autoComplete="email"
          placeholder="Admin email"
          className="h-11 rounded-lg bg-card"
          required
        />
      ) : null}
      <div className="relative">
        <Input
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          type={showPassword ? "text" : "password"}
          autoComplete="current-password"
          placeholder="Password"
          className="h-11 rounded-lg bg-card pr-11"
          required
        />
        <button
          type="button"
          onClick={() => setShowPassword((prev) => !prev)}
          aria-label={showPassword ? "Hide password" : "Show password"}
          aria-pressed={showPassword}
          className="absolute inset-y-0 right-0 flex items-center justify-center px-3 text-muted-foreground transition-colors hover:text-foreground focus-visible:text-foreground focus-visible:outline-none"
          tabIndex={0}
        >
          {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
      <Button type="submit" size="lg" className="h-11 w-full rounded-lg" disabled={isPending}>
        <LockKeyhole />
        {isPending ? "Signing in" : "Sign in"}
      </Button>
    </form>
  );
}
