"use client";

import { CheckIcon, DownloadIcon, PlusSquareIcon, ShareIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useT } from "@/lib/i18n/client";
import { promptInstall, useInstallState } from "@/lib/install-prompt";

export function InstallApp() {
  const state = useInstallState();
  const t = useT();

  if (state === "unknown") return <Skeleton className="h-9 w-48" />;

  if (state === "standalone" || state === "installed") {
    return (
      <p className="flex items-center gap-2 text-sm">
        <CheckIcon className="size-4 shrink-0 text-income" />
        {state === "standalone" ? t("install.standalone") : t("install.installed")}
      </p>
    );
  }

  if (state === "prompt") {
    return (
      <Button variant="outline" className="self-start" onClick={() => void promptInstall()}>
        <DownloadIcon /> {t("install.add")}
      </Button>
    );
  }

  if (state === "ios") {
    return (
      <ol className="flex flex-col gap-2 text-sm">
        <li className="flex flex-wrap items-center gap-1.5">
          <Step n={1} />
          {t.rich("install.iosStep1", {
            icon: <ShareIcon className="size-4 text-primary" aria-hidden />,
            share: <span className="font-medium">{t("install.iosShare")}</span>,
          })}
        </li>
        <li className="flex flex-wrap items-center gap-1.5">
          <Step n={2} />
          {t.rich("install.iosStep2", {
            icon: <PlusSquareIcon className="size-4" aria-hidden />,
            add: <span className="font-medium">{t("install.iosAdd")}</span>,
          })}
        </li>
      </ol>
    );
  }

  return (
    <p className="text-sm text-muted-foreground">
      {t.rich("install.other", {
        add: <span className="font-medium text-foreground">{t("install.otherAdd")}</span>,
        install: <span className="font-medium text-foreground">{t("install.otherInstall")}</span>,
      })}
    </p>
  );
}

function Step({ n }: { n: number }) {
  return (
    <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
      {n}
    </span>
  );
}
