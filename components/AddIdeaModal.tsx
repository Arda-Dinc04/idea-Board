"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { IdeaSubmitForm } from "@/components/IdeaSubmitForm";

export function AddIdeaModal() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button">
          <Plus />
          Add idea
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-lg sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add idea</DialogTitle>
          <DialogDescription>Admin ideas default to Admin unless you type another name.</DialogDescription>
        </DialogHeader>
        <IdeaSubmitForm mode="admin" onSubmitted={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
