"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import useSWR from "swr";
import { Github, Loader2, LogOut, PenSquare, Upload, User2, CheckCheck, KeyRound, Heart, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProfileAvatar } from "@/components/profile/ProfileAvatar";
import {
  AccountNotificationBadge,
  EMPTY_INTERACTION_UNREAD,
  useInteractionNotificationSummary,
  type InteractionNotificationsResponse,
} from "@/components/account/interaction-notification-summary";
import { ACCOUNT_AVATAR_KEY, ACCOUNT_PROFILE_KEY, ACCOUNT_VIEWER_KEY, INTERACTION_NOTIFICATIONS_KEY, INTERACTION_NOTIFICATIONS_READ_KEY } from "@/lib/account-client";
import { clearPendingAuthNotice, writePendingAuthNotice } from "@/lib/auth-notice";
import { fetchJson } from "@/lib/client/http";
import {
  accountViewerResponseSchema,
  displayNameDraftSchema,
  interactionNotificationsResponseSchema,
  markNotificationsReadBodySchema,
  okOnlyResponseSchema,
  passwordDraftSchema,
} from "@/lib/schemas/account";
import { avatarFileSchema } from "@/lib/schemas/primitives";
import { firstIssueMessage } from "@/lib/schemas/runtime";
import { absoluteUrl } from "@/lib/site";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import type { InteractionNotification, ViewerSession } from "@/lib/types";
import { useAuth } from "@/components/providers/AuthProvider";
import { cn } from "@/lib/utils";
import type { z } from "zod";

type AccountViewerResponse = z.infer<typeof accountViewerResponseSchema>;
type InteractionChannel = "likes" | "replies";

const REQUEST_FAILED_MESSAGE = "REQUEST_FAILED";
const SAME_ORIGIN_NO_STORE_INIT = {
  cache: "no-store",
  credentials: "same-origin",
} satisfies RequestInit;
const JSON_REQUEST_HEADERS = {
  "Content-Type": "application/json",
};
const EMPTY_NOTIFICATIONS: InteractionNotification[] = [];

function passwordUpdateErrorMessage(error: unknown, hasPasswordIdentity: boolean) {
  const fallbackMessage = hasPasswordIdentity
    ? "密码更新失败，请稍后重试。"
    : "密码设置失败，请稍后重试。";

  if (!(error instanceof Error)) {
    return fallbackMessage;
  }

  const normalized = error.message.trim().toLowerCase();

  if (
    normalized.includes("different from the old password") ||
    normalized.includes("new password should be different") ||
    normalized.includes("same password") ||
    normalized.includes("same as the old password")
  ) {
    return "新密码不能和旧密码相同，请换一个密码。";
  }

  if (normalized.includes("password should be at least")) {
    return "密码至少需要 6 位。";
  }

  if (normalized.includes("auth session missing") || normalized.includes("session")) {
    return "登录状态已失效，请重新登录后再试。";
  }

  return fallbackMessage;
}

async function fetchSessionJson<T>(url: string, schema: z.ZodType<T>) {
  return fetchJson(url, SAME_ORIGIN_NO_STORE_INIT, REQUEST_FAILED_MESSAGE, schema);
}

function interactionChannel(notification: InteractionNotification): InteractionChannel {
  return notification.kind === "post_reaction" || notification.kind === "comment_like" ? "likes" : "replies";
}

function interactionActionLabel(notification: InteractionNotification) {
  if (notification.kind === "post_comment") {
    return "评论了你的文章";
  }

  if (notification.kind === "comment_reply") {
    return "回复了你的评论";
  }

  if (notification.kind === "comment_like") {
    return "赞了你的评论";
  }

  return "欣赏了你的文章";
}

function interactionHref(notification: InteractionNotification) {
  const anchorId = notification.kind === "comment_reply"
    ? notification.replyId
    : notification.kind === "post_comment" || notification.kind === "comment_like"
      ? notification.targetCommentId
      : null;

  return `/posts/${notification.postSlug}${anchorId ? `#comment-${anchorId}` : ""}`;
}

function channelUnreadCount(unread: typeof EMPTY_INTERACTION_UNREAD, channel: InteractionChannel) {
  return channel === "likes" ? unread.likes : unread.replies;
}

function InteractionNotificationItem({
  notification,
  onSelect,
}: {
  notification: InteractionNotification;
  onSelect: (notification: InteractionNotification) => void;
}) {
  const Icon = interactionChannel(notification) === "replies" ? MessageCircle : Heart;

  return (
    <Link
      href={interactionHref(notification)}
      className="block rounded-2xl border border-border/60 bg-background/70 px-4 py-3 transition-colors hover:bg-muted/35 [contain-intrinsic-size:0_5.75rem] [content-visibility:auto]"
      onClick={() => onSelect(notification)}
    >
      <div className="flex items-start gap-3">
        <ProfileAvatar profile={notification.actor} className="size-9" />
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">{notification.actor.displayName}</span>
            <span>{interactionActionLabel(notification)}</span>
            <span>{notification.formattedDateTime}</span>
            {!notification.readAt ? <Badge variant="muted">新</Badge> : null}
          </div>
          {notification.bodySnippet ? (
            <p className="line-clamp-2 text-sm leading-6 text-muted-foreground">{notification.bodySnippet}</p>
          ) : null}
          <p className="flex items-center gap-1.5 truncate text-xs text-muted-foreground">
            <Icon className="size-3.5 shrink-0" aria-hidden />
            <span className="truncate">《{notification.postTitle}》</span>
          </p>
        </div>
      </div>
    </Link>
  );
}

export function AccountCenterContent({
  viewer,
  open,
  onClose,
  signOut,
  compact = false,
  isSigningOut = false,
  className,
}: {
  viewer: ViewerSession;
  open: boolean;
  onClose: () => void;
  signOut: () => Promise<void>;
  compact?: boolean;
  isSigningOut?: boolean;
  className?: string;
}) {
  const pathname = usePathname();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { applyAccountSnapshot, refreshViewer, session, viewer: contextViewer } = useAuth();
  const [displayNameDraft, setDisplayNameDraft] = useState(viewer.displayName);
  const [passwordDraft, setPasswordDraft] = useState("");
  const [passwordConfirmDraft, setPasswordConfirmDraft] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [isLinkingGithub, setIsLinkingGithub] = useState(false);
  const [isMarkingNotifications, setIsMarkingNotifications] = useState(false);
  const [activeInteractionChannel, setActiveInteractionChannel] = useState<InteractionChannel>("likes");

  const interactionSummary = useInteractionNotificationSummary(Boolean(viewer));

  const { data: accountData, mutate: mutateAccount } = useSWR<AccountViewerResponse>(
    open ? ACCOUNT_VIEWER_KEY : null,
    (url: string) => fetchSessionJson(url, accountViewerResponseSchema)
  );

  const { data: notificationsData, mutate: mutateNotifications } = useSWR<InteractionNotificationsResponse>(
    open ? INTERACTION_NOTIFICATIONS_KEY : null,
    (url: string) => fetchSessionJson(url, interactionNotificationsResponseSchema)
  );

  const visibleViewer = contextViewer?.id === viewer.id ? contextViewer : viewer;
  const profile = accountData?.profile;
  const fallbackUnread = profile
    ? {
        ...EMPTY_INTERACTION_UNREAD,
        total: profile.unreadInteractionCount,
      }
    : EMPTY_INTERACTION_UNREAD;
  const unread = notificationsData?.unread ?? interactionSummary.data?.unread ?? fallbackUnread;
  const unreadCount = unread.total;
  const notifications = notificationsData?.notifications ?? EMPTY_NOTIFICATIONS;
  const activeNotifications = notifications.filter(
    (notification) => interactionChannel(notification) === activeInteractionChannel
  );
  const hasGithubIdentity = profile?.hasGithubIdentity ?? false;
  const hasPasswordIdentity = profile?.hasPasswordIdentity ?? true;
  const canUploadAvatar = session?.user.id === visibleViewer.id;
  const profileSectionsClassName = compact ? "space-y-4" : "space-y-5";

  const syncReturnedAccount = async (snapshot: AccountViewerResponse) => {
    setDisplayNameDraft(snapshot.viewer.displayName);
    await applyAccountSnapshot(snapshot);
  };

  const refreshNotificationState = async () => {
    await Promise.all([mutateNotifications(), interactionSummary.mutate(), mutateAccount()]);
  };

  const handleSaveDisplayName = async () => {
    if (isSavingProfile) {
      return;
    }

    const nextDisplayName = displayNameDraftSchema.safeParse(displayNameDraft);
    if (!nextDisplayName.success) {
      toast.error(firstIssueMessage(nextDisplayName.error, "昵称不能为空。"));
      return;
    }

    setIsSavingProfile(true);

    try {
      const result = await fetchJson(
        ACCOUNT_PROFILE_KEY,
        {
          method: "PATCH",
          headers: JSON_REQUEST_HEADERS,
          body: JSON.stringify({
            displayName: nextDisplayName.data,
          }),
        },
        "PROFILE_UPDATE_FAILED",
        accountViewerResponseSchema
      );

      await syncReturnedAccount(result);
      toast.success("昵称已经更新。");
    } catch {
      toast.error("昵称更新失败，请稍后重试。");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleAvatarUpload = async (file: File | null) => {
    if (!file || isUploadingAvatar) {
      return;
    }

    const nextFile = avatarFileSchema.safeParse(file);
    if (!nextFile.success) {
      toast.error(firstIssueMessage(nextFile.error, "请选择要上传的头像图片。"));
      return;
    }

    setIsUploadingAvatar(true);

    try {
      const formData = new FormData();
      formData.append("file", nextFile.data);

      const result = await fetchJson(
        ACCOUNT_AVATAR_KEY,
        {
          method: "POST",
          body: formData,
        },
        "AVATAR_UPLOAD_FAILED",
        accountViewerResponseSchema
      );

      await syncReturnedAccount(result);
      toast.success("头像已经更新。");
    } catch {
      toast.error("头像上传失败，请换一张图片再试。");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleSavePassword = async () => {
    if (isSavingPassword) {
      return;
    }

    const nextPassword = passwordDraftSchema.safeParse({
      password: passwordDraft,
      passwordConfirm: passwordConfirmDraft,
    });
    if (!nextPassword.success) {
      toast.error(firstIssueMessage(nextPassword.error, "请输入两次密码。"));
      return;
    }

    setIsSavingPassword(true);

    try {
      const supabase = getSupabaseBrowser();
      const { error } = await supabase.auth.updateUser({
        password: nextPassword.data.password,
      });

      if (error) {
        throw error;
      }

      setPasswordDraft("");
      setPasswordConfirmDraft("");
      toast.success(hasPasswordIdentity ? "密码已经更新。" : "密码已经设置，可以使用邮箱密码登录了。");
      await refreshViewer();
    } catch (error) {
      toast.error(passwordUpdateErrorMessage(error, hasPasswordIdentity));
    } finally {
      setIsSavingPassword(false);
    }
  };

  const handleConnectGithub = async () => {
    if (isLinkingGithub) {
      return;
    }

    setIsLinkingGithub(true);

    try {
      writePendingAuthNotice({ kind: "github-link" });
      const supabase = getSupabaseBrowser();
      const { error } = await supabase.auth.linkIdentity({
        provider: "github",
        options: {
          redirectTo: absoluteUrl(`/auth/callback?next=${encodeURIComponent(pathname || "/")}`),
        },
      });

      if (error) {
        throw error;
      }
    } catch {
      clearPendingAuthNotice();
      toast.error("GitHub 连接失败，请稍后重试。");
      setIsLinkingGithub(false);
    }
  };

  const markNotificationsRead = async (ids?: string[]) => {
    if (isMarkingNotifications) {
      return;
    }

    const payload = markNotificationsReadBodySchema.safeParse(
      ids && ids.length > 0 ? { ids } : { all: true }
    );
    if (!payload.success) {
      toast.error(firstIssueMessage(payload.error, "缺少通知标识。"));
      return;
    }

    setIsMarkingNotifications(true);

    try {
      await fetchJson(
        INTERACTION_NOTIFICATIONS_READ_KEY,
        {
          method: "POST",
          headers: JSON_REQUEST_HEADERS,
          body: JSON.stringify(payload.data),
        },
        "NOTIFICATIONS_FAILED",
        okOnlyResponseSchema
      );

      await refreshNotificationState();
    } catch {
      toast.error("通知状态更新失败。");
    } finally {
      setIsMarkingNotifications(false);
    }
  };

  return (
    <div className={cn("max-h-[min(78vh,42rem)] overflow-y-auto pr-1", profileSectionsClassName, className)}>
      <section className="space-y-4 rounded-[1.45rem] border border-border/70 bg-card/75 p-4">
        <div className="flex items-center gap-3">
          <span className="relative shrink-0">
            <ProfileAvatar viewer={visibleViewer} className="size-14" />
            <AccountNotificationBadge count={unreadCount} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate text-base font-medium text-foreground">{visibleViewer.displayName}</p>
            </div>
            <p className="truncate text-sm text-muted-foreground">{visibleViewer.email}</p>
            <p className="truncate text-xs text-muted-foreground">{visibleViewer.handle}</p>
          </div>
        </div>

        <div className="grid gap-3">
          <label className="grid gap-2 text-sm">
            <span className="text-muted-foreground">昵称</span>
            <Input value={displayNameDraft} onChange={(event) => setDisplayNameDraft(event.target.value)} maxLength={40} />
          </label>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" className="rounded-2xl" onClick={() => void handleSaveDisplayName()} disabled={isSavingProfile}>
              {isSavingProfile ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <User2 className="size-4" aria-hidden />}
              保存昵称
            </Button>
            {canUploadAvatar ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-2xl"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingAvatar}
                >
                  {isUploadingAvatar ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Upload className="size-4" aria-hidden />}
                  上传头像
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(event) => {
                    const file = event.target.files?.[0] ?? null;
                    void handleAvatarUpload(file);
                    event.currentTarget.value = "";
                  }}
                />
              </>
            ) : null}
          </div>
        </div>
      </section>

      <section className="space-y-4 rounded-[1.45rem] border border-border/70 bg-card/75 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-foreground">互动消息</p>
            <p className="text-sm text-muted-foreground">赞、欣赏、评论和回复会按频道收在这里。</p>
          </div>
          {unreadCount > 0 ? (
            <Button type="button" variant="ghost" className="rounded-2xl" onClick={() => void markNotificationsRead()} disabled={isMarkingNotifications}>
              {isMarkingNotifications ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <CheckCheck className="size-4" aria-hidden />}
              全部已读
            </Button>
          ) : null}
        </div>

        <div className="grid grid-cols-2 gap-2 rounded-2xl bg-muted/35 p-1" role="tablist" aria-label="互动消息频道">
          {(["likes", "replies"] as const).map((channel) => {
            const isActive = activeInteractionChannel === channel;
            const count = channelUnreadCount(unread, channel);
            return (
              <button
                key={channel}
                type="button"
                role="tab"
                aria-selected={isActive}
                className={cn(
                  "inline-flex min-h-10 items-center justify-center gap-2 rounded-[1rem] px-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground",
                  isActive && "bg-background text-foreground shadow-xs"
                )}
                onClick={() => setActiveInteractionChannel(channel)}
              >
                {channel === "likes" ? <Heart className="size-4" aria-hidden /> : <MessageCircle className="size-4" aria-hidden />}
                <span>{channel === "likes" ? "赞和互动" : "评论和回复"}</span>
                {count > 0 ? <Badge variant="muted" className="px-2 py-0 tracking-normal normal-case">{count > 99 ? "99+" : count}</Badge> : null}
              </button>
            );
          })}
        </div>

        {activeNotifications.length > 0 ? (
          <div className="space-y-2">
            {activeNotifications.map((notification) => (
              <InteractionNotificationItem
                key={notification.id}
                notification={notification}
                onSelect={(item) => {
                  onClose();
                  if (!item.readAt) {
                    void markNotificationsRead([item.id]);
                  }
                }}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border/70 px-4 py-6 text-sm text-muted-foreground">
            {activeInteractionChannel === "likes" ? "暂时还没有新的赞和欣赏。" : "暂时还没有新的评论或回复。"}
          </div>
        )}
      </section>

      <section className="space-y-3 rounded-[1.45rem] border border-border/70 bg-card/75 p-4">
        <div>
          <p className="text-sm font-medium text-foreground">登录方式与安全</p>
          <p className="text-sm text-muted-foreground">可以补充 GitHub 登录，或者为当前账号设置密码。</p>
        </div>
        {!hasGithubIdentity ? (
          <Button type="button" variant="outline" className="w-full justify-start rounded-2xl" onClick={() => void handleConnectGithub()} disabled={isLinkingGithub}>
            {isLinkingGithub ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Github className="size-4" aria-hidden />}
            连接 GitHub
          </Button>
        ) : (
          <div className="inline-flex items-center gap-2 rounded-full bg-muted/45 px-3 py-1.5 text-sm text-muted-foreground">
            <Github className="size-4" aria-hidden />
            GitHub 已连接
          </div>
        )}
        <div className="grid gap-2">
          <Input
            type="password"
            autoComplete="new-password"
            value={passwordDraft}
            onChange={(event) => setPasswordDraft(event.target.value)}
            placeholder={hasPasswordIdentity ? "输入新的密码" : "为这个账号设置密码"}
          />
          <Input
            type="password"
            autoComplete="new-password"
            value={passwordConfirmDraft}
            onChange={(event) => setPasswordConfirmDraft(event.target.value)}
            placeholder="再次输入密码"
          />
          <Button type="button" variant="outline" className="justify-start rounded-2xl" onClick={() => void handleSavePassword()} disabled={isSavingPassword}>
            {isSavingPassword ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <KeyRound className="size-4" aria-hidden />}
            {hasPasswordIdentity ? "更新密码" : "设置密码"}
          </Button>
        </div>
      </section>

      <section className="grid gap-2 rounded-[1.45rem] border border-border/70 bg-card/75 p-4">
        {visibleViewer.isAuthor ? (
          <Button asChild variant="outline" className="justify-start rounded-2xl" onClick={onClose}>
            <Link href="/editor">
              <PenSquare className="size-4" aria-hidden />
              写作台
            </Link>
          </Button>
        ) : null}
        <Button type="button" variant="outline" className="justify-start rounded-2xl" onClick={() => void signOut()} disabled={isSigningOut}>
          {isSigningOut ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <LogOut className="size-4" aria-hidden />}
          退出登录
        </Button>
      </section>
    </div>
  );
}
