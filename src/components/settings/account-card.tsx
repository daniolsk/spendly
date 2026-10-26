"use client";

import { useTheme } from "next-themes";
import { LogOutIcon, MonitorIcon, MoonIcon, SunIcon } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { initials, useSignOut, type MenuUser } from "@/components/shell/user-menu";
import { useMounted } from "@/hooks/use-media-query";

export function AccountCard({ user }: { user: MenuUser }) {
  const { theme, setTheme } = useTheme();
  const signOut = useSignOut();
  const mounted = useMounted();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <Avatar className="size-10">
          {user.image ? <AvatarImage src={user.image} alt="" referrerPolicy="no-referrer" /> : null}
          <AvatarFallback>{initials(user.name)}</AvatarFallback>
        </Avatar>
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate font-medium">{user.name}</span>
          <span className="truncate text-sm text-muted-foreground">{user.email}</span>
        </div>
        <Button variant="outline" onClick={signOut}>
          <LogOutIcon /> Sign out
        </Button>
      </div>
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium">Theme</span>
        <ToggleGroup type="single" variant="outline" value={mounted ? theme : ""} onValueChange={(v) => v && setTheme(v)}>
          <ToggleGroupItem value="light" aria-label="Light">
            <SunIcon />
          </ToggleGroupItem>
          <ToggleGroupItem value="dark" aria-label="Dark">
            <MoonIcon />
          </ToggleGroupItem>
          <ToggleGroupItem value="system" aria-label="System">
            <MonitorIcon />
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
    </div>
  );
}
