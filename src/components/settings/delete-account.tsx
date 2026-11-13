"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2Icon } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useT } from "@/lib/i18n/client";
import { deleteAccount } from "@/server/actions";

export function DeleteAccount({ email }: { email: string }) {
  const router = useRouter();
  const t = useT();
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState("");
  const [pending, startTransition] = useTransition();
  const matches = confirm.trim().toLowerCase() === email.toLowerCase();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!matches) return;
    startTransition(async () => {
      const res = await deleteAccount(confirm);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(t("account.deleted"));
      router.replace("/");
      router.refresh();
    });
  }

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (pending) return;
        setOpen(next);
        if (!next) setConfirm("");
      }}
    >
      <AlertDialogTrigger asChild>
        <Button variant="destructive">
          <Trash2Icon /> {t("settings.deleteAccount")}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <form onSubmit={submit} className="grid gap-4">
          <AlertDialogHeader>
            <AlertDialogTitle>{t("account.deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("account.deleteDescription")}</AlertDialogDescription>
          </AlertDialogHeader>
          <Field>
            <FieldLabel htmlFor="delete-account-email" className="block font-normal">
              {t.rich("account.deleteConfirm", { email: <span className="font-medium wrap-anywhere">{email}</span> })}
            </FieldLabel>
            <Input
              id="delete-account-email"
              type="email"
              autoComplete="off"
              autoCapitalize="off"
              spellCheck={false}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              disabled={pending}
            />
          </Field>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>{t("common.cancel")}</AlertDialogCancel>
            <Button type="submit" variant="destructive" disabled={!matches || pending}>
              {pending ? t("account.deleting") : t("settings.deleteAccount")}
            </Button>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
