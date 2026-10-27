import { cn } from "cn";

const builtAt = process.env.BUILD_TIME ?? "";
const commit = process.env.BUILD_COMMIT ?? "";
const environment = process.env.BUILD_ENV ?? "local";

/** Which build this environment runs: build time (app timezone) + commit, e.g. "Build 27 Oct, 08:41 · f7eba79". */
export function BuildInfo({ className }: { className?: string }) {
  const time = builtAt
    ? new Intl.DateTimeFormat("en-GB", {
        timeZone: process.env.APP_TIMEZONE ?? "Europe/Warsaw",
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(builtAt))
    : null;

  return (
    <p className={cn("tabular text-xs text-muted-foreground", className)}>
      Build {time ? <time dateTime={builtAt} title={builtAt}>{time}</time> : "unknown"}
      {commit ? ` · ${commit}` : null}
      {environment !== "production" ? ` · ${environment}` : null}
    </p>
  );
}
