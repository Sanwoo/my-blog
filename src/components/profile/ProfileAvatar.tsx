"use client";

import { useEffect, useState } from "react";
import { Avatar } from "@/components/ui/avatar";
import { avatarInitialFromProfile, avatarInitialFromViewer } from "@/lib/identity";
import type { ViewerProfile, ViewerSession } from "@/lib/types";
import { cn } from "@/lib/utils";

type BaseProps = {
  alt?: string;
  className?: string;
  imageClassName?: string;
  fallbackClassName?: string;
};

type ViewerAvatarProps = BaseProps & {
  viewer: Pick<ViewerSession, "displayName" | "avatarUrl" | "email">;
  profile?: never;
};

type PublicProfileAvatarProps = BaseProps & {
  profile: Pick<ViewerProfile, "displayName" | "avatarUrl" | "handle">;
  viewer?: never;
};

export function ProfileAvatar(props: ViewerAvatarProps | PublicProfileAvatarProps) {
  let displayName: string;
  let avatarUrl: string | null;
  let fallbackIdentity: string;
  let fallbackInitial: string;
  const viewer = props.viewer;

  if (viewer) {
    displayName = viewer.displayName;
    avatarUrl = viewer.avatarUrl;
    fallbackIdentity = viewer.email;
    fallbackInitial = avatarInitialFromViewer(viewer);
  } else {
    displayName = props.profile.displayName;
    avatarUrl = props.profile.avatarUrl;
    fallbackIdentity = props.profile.handle;
    fallbackInitial = avatarInitialFromProfile(props.profile);
  }

  const nextAvatarUrl = avatarUrl?.trim() || null;
  const [resolvedAvatar, setResolvedAvatar] = useState(() => ({
    src: nextAvatarUrl,
    identityKey: fallbackIdentity,
  }));

  useEffect(() => {
    if (!nextAvatarUrl || resolvedAvatar.src === nextAvatarUrl) {
      return;
    }

    let cancelled = false;
    const image = new window.Image();
    const resolveAvatar = () => {
      if (!cancelled) {
        setResolvedAvatar({
          src: nextAvatarUrl,
          identityKey: fallbackIdentity,
        });
      }
    };

    image.onload = resolveAvatar;
    image.onerror = () => undefined;

    image.src = nextAvatarUrl;

    if (image.complete && image.naturalWidth > 0) {
      queueMicrotask(resolveAvatar);
    }

    return () => {
      cancelled = true;
    };
  }, [fallbackIdentity, nextAvatarUrl, resolvedAvatar.src]);

  const canShowResolvedImage =
    resolvedAvatar.identityKey === fallbackIdentity ||
    nextAvatarUrl === resolvedAvatar.src;
  const visibleSrc = nextAvatarUrl && canShowResolvedImage ? resolvedAvatar.src : null;

  return (
    <Avatar className={cn("relative", props.className)}>
      {visibleSrc ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={visibleSrc}
          alt={props.alt ?? displayName}
          className={cn("size-full object-cover", props.imageClassName)}
        />
      ) : (
        <span
          className={cn(
            "flex size-full items-center justify-center bg-muted/40 text-sm font-semibold text-foreground",
            props.fallbackClassName
          )}
        >
          {fallbackInitial}
        </span>
      )}
    </Avatar>
  );
}
