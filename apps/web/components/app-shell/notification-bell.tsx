"use client";

import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
  useUnreadNotificationCount,
} from "@/hooks/use-notifications";
import { cn } from "@/lib/utils";

function timeAgo(iso: string) {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

/** §46 Notifications — polled (30s), no push infra. Bell + unread badge in the app header. */
export function NotificationBell() {
  const { data: unreadCount = 0 } = useUnreadNotificationCount();
  const { data: notifications } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="relative" />}>
        <Bell className="size-4" />
        {Boolean(unreadCount) && (
          <span className="absolute top-0.5 right-0.5 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between font-normal">
          <span className="text-sm font-medium">Notifications</span>
          {Boolean(unreadCount) && (
            <button
              onClick={() => markAllRead.mutate()}
              className="text-xs text-primary hover:underline"
              type="button"
            >
              Mark all read
            </button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {notifications?.length === 0 && (
          <p className="px-2 py-4 text-center text-sm text-muted-foreground">No notifications yet.</p>
        )}
        <div className="max-h-96 overflow-y-auto">
          {notifications?.map((n) => (
            <DropdownMenuItem
              key={n.id}
              className={cn("flex flex-col items-start gap-0.5 whitespace-normal", !n.isRead && "bg-muted/50")}
              onClick={() => !n.isRead && markRead.mutate(n.id)}
            >
              <span className="flex w-full items-center justify-between gap-2 text-sm font-medium">
                {n.title}
                {!n.isRead && <span className="size-2 shrink-0 rounded-full bg-primary" />}
              </span>
              <span className="text-xs text-muted-foreground">{n.message}</span>
              <span className="text-[11px] text-muted-foreground">{timeAgo(n.createdAt)}</span>
            </DropdownMenuItem>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
