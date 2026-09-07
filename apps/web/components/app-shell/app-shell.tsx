"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, Menu, Package, Search } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { authClient, useSession } from "@/lib/auth-client";
import { useMe } from "@/hooks/use-me";
import { NAV_GROUPS } from "./nav-items";
import { OfflineBanner } from "./offline-banner";
import { NotificationBell } from "./notification-bell";

function initials(name: string) {
  return name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();
}

function NavLinks({ onNavigate, mobile = false }: { onNavigate?: () => void; mobile?: boolean }) {
  const pathname = usePathname();
  const { data: me } = useMe();
  return (
    <nav className={cn("flex overflow-y-auto", mobile ? "flex-col gap-5 p-3" : "flex-col gap-5 p-3")}>
      {NAV_GROUPS.map((group, groupIndex) => {
        const items = group.items.filter((item) => !item.requires || me?.permissions.includes(item.requires));
        if (!items.length) return null;
        return <div key={group.label ?? `group-${groupIndex}`} className="flex flex-col gap-1">
          {group.label && <span className="px-3 pb-1 text-[10px] font-semibold tracking-[0.16em] text-sidebar-foreground/45 uppercase">{group.label}</span>}
          {items.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return <Link key={item.href} href={item.href} onClick={onNavigate} className={cn("group flex min-h-10 items-center gap-3 rounded-xl border border-transparent px-3 py-2 text-sm font-medium transition-colors", active ? "border-sidebar-primary/20 bg-sidebar-accent text-sidebar-accent-foreground shadow-sm" : "text-sidebar-foreground/72 hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground")}>
              <Icon className={cn("size-4", active && "text-sidebar-primary")} />{item.label}
            </Link>;
          })}
        </div>;
      })}
    </nav>
  );
}

function MobileBottomNav() {
  const pathname = usePathname();
  const { data: me } = useMe();
  const allItems = NAV_GROUPS.flatMap((group) => group.items).filter((item) => !item.requires || me?.permissions.includes(item.requires));
  const primaryHrefs = ["/", "/scan", "/cylinders", "/sales"];
  const items = primaryHrefs.map((href) => allItems.find((item) => item.href === href)).filter(Boolean) as typeof allItems;
  const hasMoreActive = allItems.some((item) => !primaryHrefs.includes(item.href) && pathname.startsWith(item.href));
  return <nav aria-label="Primary navigation" className="fixed inset-x-3 bottom-3 z-30 grid h-[72px] grid-cols-5 items-center rounded-[22px] border border-primary/15 bg-card/95 px-2 shadow-2xl shadow-primary/20 backdrop-blur-xl md:hidden">
    {items.map((item) => {
      const Icon = item.icon;
      const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
      return <Link key={item.href} href={item.href} className={cn("flex min-w-0 flex-col items-center gap-1 rounded-2xl px-1 py-2 text-[10px] font-semibold text-muted-foreground transition-all", active && "bg-primary text-primary-foreground shadow-lg shadow-primary/25")}>
        <Icon className="size-5" /><span className="truncate">{item.label}</span>
      </Link>;
    })}
    <Sheet>
      <SheetTrigger render={<button type="button" className={cn("flex min-w-0 flex-col items-center gap-1 rounded-2xl px-1 py-2 text-[10px] font-semibold text-muted-foreground transition-all", hasMoreActive && "bg-primary text-primary-foreground shadow-lg shadow-primary/25")} />}>
        <Menu className="size-5" /><span>More</span>
      </SheetTrigger>
      <SheetContent side="bottom" className="rounded-t-[28px] px-4 pb-8 pt-3">
        <SheetTitle className="px-2 pb-3 text-left text-lg">All workspace tools</SheetTitle>
        <div className="grid grid-cols-3 gap-2">
          {allItems.filter((item) => !primaryHrefs.includes(item.href)).map((item) => { const Icon = item.icon; return <Link key={item.href} href={item.href} className="flex min-h-20 flex-col items-center justify-center gap-2 rounded-2xl bg-muted/70 px-2 text-center text-xs font-medium transition-colors hover:bg-primary/10 hover:text-primary"><Icon className="size-5" /><span>{item.label}</span></Link>; })}
        </div>
      </SheetContent>
    </Sheet>
  </nav>;
}

function UserMenu() {
  const router = useRouter();
  const { data: session } = useSession();
  const user = session?.user;
  async function handleLogout() { await authClient.signOut(); router.push("/login"); router.refresh(); }
  if (!user) return null;
  return <DropdownMenu><DropdownMenuTrigger render={<Button variant="ghost" className="h-9 gap-2 px-2" />}><Avatar className="size-7"><AvatarFallback className="text-xs">{initials(user.name)}</AvatarFallback></Avatar><span className="hidden text-sm font-medium sm:inline">{user.name}</span></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuLabel className="font-normal"><div className="flex flex-col gap-0.5"><span className="text-sm font-medium">{user.name}</span><span className="text-xs text-muted-foreground">{user.email}</span></div></DropdownMenuLabel><DropdownMenuSeparator /><DropdownMenuItem onClick={handleLogout} variant="destructive"><LogOut className="size-4" />Log out</DropdownMenuItem></DropdownMenuContent></DropdownMenu>;
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  return <div className="flex min-h-screen w-full"><aside className="hidden w-64 shrink-0 bg-sidebar text-sidebar-foreground md:flex md:flex-col"><div className="flex h-20 items-center gap-3 border-b border-sidebar-border px-5"><div className="flex size-10 items-center justify-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"><Package className="size-5" /></div><div className="min-w-0"><p className="truncate text-sm font-bold tracking-tight">CylinderOS</p><p className="text-[10px] tracking-[0.14em] text-sidebar-foreground/50 uppercase">Operations hub</p></div></div><NavLinks /></aside><div className="flex min-h-screen flex-1 flex-col"><OfflineBanner /><header className="sticky top-0 z-20 flex h-16 items-center gap-2 border-b border-border/70 bg-background/90 px-3 backdrop-blur sm:px-6"><Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}><SheetTrigger render={<Button variant="outline" size="icon" className="md:hidden" />}><Menu className="size-5" /></SheetTrigger><SheetContent side="left" className="w-64 p-0"><SheetTitle className="flex h-16 items-center gap-3 border-b px-4 font-semibold"><div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground"><Package className="size-4" /></div>CylinderOS</SheetTitle><NavLinks mobile onNavigate={() => setMobileNavOpen(false)} /></SheetContent></Sheet><div className="hidden min-w-0 flex-1 items-center gap-2 md:flex"><Search className="size-4 text-muted-foreground" /><span className="text-sm text-muted-foreground">Operations overview</span></div><div className="flex flex-1 items-center gap-2 md:hidden"><div className="flex size-8 items-center justify-center rounded-xl bg-primary text-primary-foreground"><Package className="size-4" /></div><div><p className="text-sm font-bold leading-none">CylinderOS</p><p className="mt-1 text-[10px] text-muted-foreground">Operations hub</p></div></div><NotificationBell /><UserMenu /></header><main className="flex-1 overflow-y-auto px-4 py-5 pb-24 sm:px-6 sm:py-7 sm:pb-24 lg:px-8">{children}</main><MobileBottomNav /></div></div>;
}
