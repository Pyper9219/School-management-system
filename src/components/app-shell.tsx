import { useMemo } from "react";
import { LogOut, Megaphone } from "lucide-react";
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupLabel, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { longDate } from "@/src/lib/format";
import { Link, useRoute } from "@/src/lib/router";
import { navGroups } from "@/src/lib/nav";
import { ROLE_LABEL, useSchool } from "@/src/lib/store";
import { useSchoolIndex } from "@/src/lib/selectors";
import { AvatarCircle, Pill } from "@/src/components/kit";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { currentUser, signOut, db, asOf } = useSchool();
  const index = useSchoolIndex();
  const route = useRoute();

  const term = db.terms.find((t) => t.id === db.currentTermId);
  const alerts = useMemo(() => (currentUser ? index.announcementsFor(currentUser).filter((a) => Date.now() - new Date(a.publishedAt).getTime() < 7 * 86_400_000).length : 0), [currentUser, index]);
  const openRegisters = index.openRegisterClasses(asOf);

  if (!currentUser) return null;

  return (
    <SidebarProvider className="min-h-dvh bg-background">
      <Sidebar collapsible="icon" className="border-sidebar-border bg-sidebar text-sidebar-foreground">
        <SidebarHeader className="gap-2 py-4 group-data-[collapsible=icon]:py-3">
          <div className="flex items-center gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-full border border-sidebar-primary/50 font-display text-sm font-semibold text-sidebar-primary">
              MG
            </span>
            <div className="grid min-w-0 leading-tight group-data-[collapsible=icon]:hidden">
              <span className="font-display truncate text-[15px] font-semibold text-sidebar-foreground">Meridian Grove</span>
              <span className="truncate text-[11px] text-sidebar-foreground/60">Academy · {term?.academicYear}</span>
            </div>
          </div>
        </SidebarHeader>

        <SidebarContent className="scrollbar-thin">
          {navGroups(currentUser.role).map(({ group, items }) => (
            <SidebarGroup key={group} className="py-1">
              <SidebarGroupLabel className="text-[10px] font-semibold tracking-[0.14em] text-sidebar-foreground/45 uppercase group-data-[collapsible=icon]:hidden">
                {group}
              </SidebarGroupLabel>
              <SidebarMenu>
                {items.map((item) => {
                  const active = route.path === item.path || route.path.startsWith(`${item.path}/`);
                  return (
                    <SidebarMenuItem key={item.path}>
                      <SidebarMenuButton asChild isActive={active} tooltip={item.label} className="rounded-md data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium data-[active=true]:text-sidebar-accent-foreground">
                        <Link to={item.path}>
                          <item.icon />
                          <span>{item.label}</span>
                          {item.path === "/attendance" && openRegisters.length ? (
                            <span className="nums ml-auto rounded-full bg-sidebar-primary px-1.5 text-[10px] font-semibold text-sidebar-primary-foreground">{openRegisters.length}</span>
                          ) : null}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroup>
          ))}
        </SidebarContent>

        <SidebarFooter className="border-t border-sidebar-border/70 py-3">
          <div className="flex items-center gap-2.5 group-data-[collapsible=icon]:justify-center">
            <AvatarCircle name={currentUser.name} color={currentUser.color} size={32} />
            <div className="min-w-0 leading-tight group-data-[collapsible=icon]:hidden">
              <p className="truncate text-[13px] font-medium">{currentUser.name}</p>
              <p className="truncate text-[11px] text-sidebar-foreground/55">{ROLE_LABEL[currentUser.role]}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={signOut}
            className="mt-1 w-full justify-start text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
          >
            <LogOut className="size-4" />
            <span className="group-data-[collapsible=icon]:hidden">Sign out</span>
          </Button>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset className="min-w-0 bg-background">
        <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-3 border-b border-border/70 bg-background/85 px-4 backdrop-blur md:px-6">
          <SidebarTrigger className="size-8" aria-label="Toggle navigation" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{currentUser.title}</p>
            <p className="truncate text-xs text-muted-foreground">{longDate(asOf)} · {term?.name}</p>
          </div>
          <Link to="/announcements" className="hidden sm:block">
            <Pill tone={alerts > 0 ? "warn" : "neutral"} className="gap-1.5">
              <Megaphone className="size-3" />
              {alerts} notice{alerts === 1 ? "" : "s"} this week
            </Pill>
          </Link>
        </header>
        <div className={cn("mx-auto w-full max-w-[1400px] flex-1 px-4 py-5 md:px-6 md:py-7")}>{children}</div>
        <Separator />
        <footer className="mx-auto w-full max-w-[1400px] px-4 py-4 text-xs text-muted-foreground md:px-6">
          Meridian Grove Academy · {db.settings.address} · {db.settings.phone}. Records shown are sample school data for demonstration.
        </footer>
      </SidebarInset>
    </SidebarProvider>
  );
}
