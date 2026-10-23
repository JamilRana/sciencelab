"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  CheckCircle2,
  Clock,
  Calendar,
  AlertCircle,
  XCircle,
  UserCheck,
  CalendarDays,
  Sparkles,
} from "lucide-react";
import {
  getInAppNotificationsAction,
  markNotificationReadAction,
  acknowledgeNotificationAction,
} from "@/app/actions/notifications";
import { toast } from "sonner";

interface NotificationItem {
  id: number;
  userId: number;
  kind: string;
  title: string;
  body: string;
  href?: string | null;
  sessionId?: number | null;
  createdAt: string | Date;
  readAt?: string | Date | null;
}

export function NotificationsMenu() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await getInAppNotificationsAction(15);
      if (res.success && res.data) {
        setNotifications(res.data as any);
        setUnreadCount(res.unreadCount || 0);
      }
    } catch (err) {
      // Non-critical background failure
      console.warn("Could not fetch notifications:", err);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();

    // Periodic poll every 60 seconds
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleToggle = () => {
    if (!isOpen) {
      fetchNotifications();
    }
    setIsOpen(!isOpen);
  };

  const handleMarkAllRead = async () => {
    try {
      await markNotificationReadAction("all");
      setUnreadCount(0);
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, readAt: new Date().toISOString() }))
      );
    } catch (err) {
      console.error("Mark all read failed:", err);
    }
  };

  const handleClickItem = async (notification: NotificationItem) => {
    if (!notification.readAt) {
      try {
        await markNotificationReadAction(notification.id);
        setUnreadCount((c) => Math.max(0, c - 1));
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notification.id ? { ...n, readAt: new Date().toISOString() } : n
          )
        );
      } catch (err) {
        console.error("Mark item read failed:", err);
      }
    }

    setIsOpen(false);

    if (notification.href) {
      router.push(notification.href);
    }
  };

  const handleAcknowledgeItem = async (notification: NotificationItem) => {
    try {
      const res = await acknowledgeNotificationAction(notification.id);
      if (res.success) {
        setUnreadCount((c) => Math.max(0, c - 1));
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notification.id ? { ...n, readAt: new Date().toISOString() } : n
          )
        );
        toast.success("Notice marked as seen");
      } else {
        toast.error(res.error || "Failed to acknowledge notice");
      }
    } catch (err) {
      console.error("Acknowledge notice failed:", err);
    }
  };

  const formatRelativeTime = (dateInput: string | Date) => {
    const d = new Date(dateInput);
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - d.getTime()) / 1000);

    if (diffSec < 60) return "Just now";
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    const days = Math.floor(diffSec / 86400);
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const getNotificationIcon = (kind: string) => {
    switch (kind) {
      case "CANCEL":
        return <XCircle className="h-3.5 w-3.5 text-rose-600" />;
      case "SCHEDULE_CHANGE":
      case "RESCHEDULE":
        return <Clock className="h-3.5 w-3.5 text-amber-600" />;
      case "ASSIGN":
        return <UserCheck className="h-3.5 w-3.5 text-blue-600" />;
      case "DAILY_DIGEST":
        return <CalendarDays className="h-3.5 w-3.5 text-indigo-600" />;
      case "PLANNING_REMINDER":
        return <AlertCircle className="h-3.5 w-3.5 text-orange-600" />;
      default:
        return <Bell className="h-3.5 w-3.5 text-zinc-600" />;
    }
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={handleToggle}
        className="relative p-2 text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100 rounded-lg transition-colors focus-ring"
        title="Notifications"
        aria-label="Notifications"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full bg-rose-600 text-[9px] font-bold text-white ring-2 ring-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 md:w-96 bg-white rounded-xl shadow-xl border border-zinc-200 py-2 z-50 animate-in fade-in-50 zoom-in-95 duration-100">
          <div className="px-3.5 py-2 flex items-center justify-between border-b border-zinc-100 mb-1">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-zinc-800">Notifications</span>
              {unreadCount > 0 && (
                <span className="text-[10px] bg-indigo-50 text-indigo-700 font-medium px-1.5 py-0.5 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-[11px] text-indigo-600 hover:text-indigo-800 font-medium hover:underline focus:outline-none"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-[380px] overflow-y-auto divide-y divide-zinc-50">
            {notifications.length === 0 ? (
              <div className="py-8 px-4 text-center">
                <Bell className="h-6 w-6 text-zinc-300 mx-auto mb-2 stroke-[1.5]" />
                <p className="text-xs text-zinc-500 font-medium">No notifications yet</p>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Routine changes and daily schedule digests will appear here.
                </p>
              </div>
            ) : (
              notifications.map((n) => {
                const isUnread = !n.readAt;
                return (
                  <div
                    key={n.id}
                    onClick={() => handleClickItem(n)}
                    className={`px-3.5 py-2.5 hover:bg-zinc-50 transition-colors flex items-start gap-2.5 cursor-pointer ${
                      isUnread ? "bg-indigo-50/30" : ""
                    }`}
                  >
                    <div
                      className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${
                        isUnread ? "bg-white shadow-xs border border-zinc-100" : "bg-zinc-100"
                      }`}
                    >
                      {getNotificationIcon(n.kind)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <p
                          className={`text-xs truncate ${
                            isUnread ? "font-semibold text-zinc-900" : "font-medium text-zinc-700"
                          }`}
                        >
                          {n.title}
                        </p>
                        <span className="text-[10px] text-zinc-400 shrink-0">
                          {formatRelativeTime(n.createdAt)}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-600 line-clamp-2 leading-relaxed">
                        {n.body}
                      </p>
                    </div>
                    {isUnread && (
                      <div className="flex flex-col items-end gap-1 shrink-0 mt-0.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-indigo-600" />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAcknowledgeItem(n);
                          }}
                          className="text-[10px] font-medium text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-1.5 py-0.5 rounded transition-colors"
                          title="Mark as seen"
                        >
                          Seen
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
