"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useTransition,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import dynamic from "next/dynamic";
import { usePathname, useRouter } from "next/navigation";
import type { Session, User } from "@supabase/supabase-js";
import { useSWRConfig } from "swr";
import { toast } from "sonner";
import {
  clearPendingAuthNotice,
  readPendingAuthNotice,
  subscribePendingAuthNotice,
  type PendingAuthNotice,
} from "@/lib/auth-notice";
import {
  ACCOUNT_VIEWER_KEY,
  isIdentityDependentSwrKey,
} from "@/lib/account-client";
import { fetchJson } from "@/lib/client/http";
import { normalizeAuthDialogMode, safeAppPath, type AuthDialogMode } from "@/lib/navigation";
import { readJsonStorage, removeStorageItem, versionedStorageKey, writeJsonStorage } from "@/lib/client/storage";
import { accountViewerResponseSchema } from "@/lib/schemas/account";
import { cachedProfileSchema } from "@/lib/schemas/auth";
import { pendingAuthDialogQuerySchema } from "@/lib/schemas/navigation";
import {
  cachedProfileFromViewer,
  type CachedProfile,
  viewerSessionFromCachedProfile,
} from "@/lib/profile";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import type { ViewerSession } from "@/lib/types";
import type { z } from "zod";

interface AuthContextValue {
  loading: boolean;
  session: Session | null;
  viewer: ViewerSession | null;
  startSignIn: (next?: string) => void;
  openAuthDialog: (next?: string) => void;
  signOut: (next?: string) => Promise<void>;
  refreshViewer: () => Promise<void>;
  applyAccountSnapshot: (snapshot: AccountViewerResponse) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);
type AccountViewerResponse = z.infer<typeof accountViewerResponseSchema>;
type AccountMutate = ReturnType<typeof useSWRConfig>["mutate"];
type PendingNoticePromiseRef = {
  current: Promise<boolean> | null;
};

type AuthSessionSnapshot = {
  loading: boolean;
  session: Session | null;
  viewer: ViewerSession | null;
};

type AuthDialogState = {
  open: boolean;
  next: string;
  mode: AuthDialogMode;
  seed: number;
};

type PendingAuthDialogRequest = {
  signature: string;
  next: string;
  mode: AuthDialogMode;
  error: string | null;
  cleanedUrl: string;
};

const PROFILE_CACHE_VERSION = "v6";
const SAME_ORIGIN_NO_STORE_INIT = {
  cache: "no-store",
  credentials: "same-origin",
} satisfies RequestInit;
const DEFAULT_AUTH_SESSION_SNAPSHOT: AuthSessionSnapshot = {
  loading: true,
  session: null,
  viewer: null,
};
const DEFAULT_AUTH_DIALOG_STATE: AuthDialogState = {
  open: false,
  next: "/",
  mode: "sign-in",
  seed: 0,
};
const AUTH_DIALOG_QUERY_KEYS = ["auth", "next", "mode", "error"] as const;
const AuthDialog = dynamic(() => import("@/components/auth/AuthDialog").then((module) => module.AuthDialog), {
  ssr: false,
});

const authSessionListeners = new Set<() => void>();

let authSessionSnapshot = DEFAULT_AUTH_SESSION_SNAPSHOT;
let authStoreStarted = false;
let profileHydrationVersion = 0;
let syncSessionStateRef: ((incomingSession?: Session | null) => Promise<void>) | null = null;

function profileCacheKey(userId: string) {
  return versionedStorageKey("echoes-profile", PROFILE_CACHE_VERSION, userId);
}

function trimDialogError(error: string | null | undefined) {
  return error?.trim() || null;
}

function buildOpenedAuthDialogState(
  currentState: AuthDialogState,
  options: {
    next?: string;
    mode?: AuthDialogMode;
  }
): AuthDialogState {
  return {
    open: true,
    next: safeAppPath(options.next),
    mode: options.mode ?? "sign-in",
    seed: currentState.seed + 1,
  };
}

function getCurrentAppLocation() {
  return `${window.location.pathname}${window.location.search}${window.location.hash}`;
}

function readPendingAuthDialogRequest(pathname: string): PendingAuthDialogRequest | null {
  const params = new URLSearchParams(window.location.search);
  const parsed = pendingAuthDialogQuerySchema.safeParse(Object.fromEntries(params.entries()));
  if (!parsed.success) {
    return null;
  }

  const cleanedParams = new URLSearchParams(params);

  for (const key of AUTH_DIALOG_QUERY_KEYS) {
    cleanedParams.delete(key);
  }

  const cleanedQuery = cleanedParams.toString();

  return {
    signature: params.toString(),
    next: safeAppPath(parsed.data.next),
    mode: normalizeAuthDialogMode(parsed.data.mode),
    error: trimDialogError(parsed.data.error),
    cleanedUrl: `${pathname}${cleanedQuery ? `?${cleanedQuery}` : ""}${window.location.hash}`,
  };
}

function readProfileCache(userId: string): CachedProfile | null {
  const parsed = readJsonStorage(profileCacheKey(userId), cachedProfileSchema);
  return parsed
    ? {
        ...parsed,
        avatarUrl: parsed.avatarUrl ?? null,
      }
    : null;
}

function writeProfileCache(userId: string, profile: CachedProfile) {
  writeJsonStorage(profileCacheKey(userId), profile);
}

function clearProfileCache(userId: string) {
  removeStorageItem(profileCacheKey(userId));
}

function emitAuthSessionChange() {
  authSessionListeners.forEach((listener) => listener());
}

function setAuthSessionSnapshot(nextSnapshot: AuthSessionSnapshot) {
  if (
    authSessionSnapshot.loading === nextSnapshot.loading &&
    authSessionSnapshot.session === nextSnapshot.session &&
    authSessionSnapshot.viewer === nextSnapshot.viewer
  ) {
    return;
  }

  authSessionSnapshot = nextSnapshot;
  emitAuthSessionChange();
}

function getAuthSessionSnapshot() {
  return authSessionSnapshot;
}

function setAuthenticatedViewer(user: User, session: Session, nextViewer: ViewerSession | null) {
  setAuthSessionSnapshot({
    loading: false,
    session,
    viewer: nextViewer ?? viewerSessionFromCachedProfile(user),
  });
}

function applyViewerSnapshot(nextViewer: ViewerSession) {
  const currentSession = authSessionSnapshot.session;

  if (currentSession?.user.id === nextViewer.id) {
    writeProfileCache(nextViewer.id, cachedProfileFromViewer(nextViewer));
  }

  setAuthSessionSnapshot({
    loading: false,
    session: currentSession,
    viewer: nextViewer,
  });
}

function setSignedOutSession() {
  profileHydrationVersion += 1;
  setAuthSessionSnapshot({
    loading: false,
    session: null,
    viewer: null,
  });
}

function ensureAuthStoreStarted() {
  if (authStoreStarted || typeof window === "undefined") {
    return;
  }

  authStoreStarted = true;
  const supabase = getSupabaseBrowser();

  const hydrateCanonicalViewer = async (user: User, session: Session) => {
    const hydrationVersion = ++profileHydrationVersion;
    let snapshot: AccountViewerResponse | null = null;

    try {
      snapshot = await fetchCanonicalAccountViewerSnapshot();
    } catch (error) {
      console.error("[hydrateCanonicalViewer]", error);
    }

    if (!snapshot) {
      return;
    }

    if (
      hydrationVersion !== profileHydrationVersion ||
      authSessionSnapshot.session?.user.id !== user.id
    ) {
      return;
    }

    writeProfileCache(user.id, cachedProfileFromViewer(snapshot.viewer));
    setAuthSessionSnapshot({
      loading: false,
      session,
      viewer: snapshot.viewer,
    });
  };

  const syncSessionState = async (incomingSession: Session | null | undefined) => {
    const nextSession =
      incomingSession ??
      (await supabase.auth.getSession().then((result) => result.data.session).catch(() => null));

    if (!nextSession?.user) {
      setSignedOutSession();
      return;
    }

    const cachedProfile = readProfileCache(nextSession.user.id);
    const fallbackViewer =
      authSessionSnapshot.viewer?.id === nextSession.user.id ? authSessionSnapshot.viewer : null;

    setAuthenticatedViewer(
      nextSession.user,
      nextSession,
      viewerSessionFromCachedProfile(nextSession.user, cachedProfile, {
        fallbackIsAuthor: fallbackViewer?.isAuthor,
      })
    );

    await hydrateCanonicalViewer(nextSession.user, nextSession);
  };

  syncSessionStateRef = syncSessionState;
  void syncSessionState(undefined);

  supabase.auth.onAuthStateChange((_event, nextSession) => {
    void syncSessionState(nextSession);
  });
}

function subscribeAuthSession(listener: () => void) {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  ensureAuthStoreStarted();
  authSessionListeners.add(listener);

  return () => {
    authSessionListeners.delete(listener);
  };
}

async function signOutAuthSession() {
  const supabase = getSupabaseBrowser();
  const currentUserId = authSessionSnapshot.session?.user.id ?? null;
  await supabase.auth.signOut();

  if (currentUserId) {
    clearProfileCache(currentUserId);
  }
}

async function refreshAuthSession() {
  if (typeof window === "undefined") {
    return;
  }

  ensureAuthStoreStarted();
  await syncSessionStateRef?.(undefined);
}

function useAuthSessionStore() {
  return useSyncExternalStore(
    subscribeAuthSession,
    getAuthSessionSnapshot,
    () => DEFAULT_AUTH_SESSION_SNAPSHOT
  );
}

async function fetchCanonicalAccountViewerSnapshot() {
  return fetchJson(
    ACCOUNT_VIEWER_KEY,
    SAME_ORIGIN_NO_STORE_INIT,
    "ACCOUNT_VIEWER_FAILED",
    accountViewerResponseSchema
  );
}

function showPendingAuthNotice(notice: PendingAuthNotice, viewer: ViewerSession) {
  if (notice.kind === "oauth-sign-in") {
    toast.success(`欢迎回来，${viewer.displayName}`);
    return;
  }

  if (notice.kind === "github-link") {
    toast.success("GitHub 已连接到当前账号。");
    return;
  }

  if (notice.kind === "password-sign-in") {
    toast.success(`欢迎回来，${viewer.displayName}`);
    return;
  }

  toast.success(`欢迎你，${viewer.displayName}`);
}

async function consumePendingAuthNoticeWithCanonicalViewer({
  currentViewer,
  pendingNoticePromiseRef,
  mutate,
}: {
  currentViewer: ViewerSession | null;
  pendingNoticePromiseRef: PendingNoticePromiseRef;
  mutate: AccountMutate;
}) {
  if (pendingNoticePromiseRef.current) {
    return pendingNoticePromiseRef.current;
  }

  const run = (async () => {
    if (!currentViewer) {
      return false;
    }

    const pendingNotice = readPendingAuthNotice();
    if (!pendingNotice) {
      return false;
    }

    let nextViewer = currentViewer;

    try {
      const snapshot = await fetchCanonicalAccountViewerSnapshot();
      nextViewer = snapshot.viewer;
      applyViewerSnapshot(snapshot.viewer);
      await mutate(ACCOUNT_VIEWER_KEY, snapshot, { revalidate: false });
    } catch (error) {
      console.error("[consumePendingAuthNoticeWithCanonicalViewer]", error);
    }

    showPendingAuthNotice(pendingNotice, nextViewer);
    clearPendingAuthNotice();
    return true;
  })();

  pendingNoticePromiseRef.current = run;

  try {
    return await run;
  } finally {
    pendingNoticePromiseRef.current = null;
  }
}

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { mutate } = useSWRConfig();
  const { loading, session, viewer } = useAuthSessionStore();
  const sessionUserId = session?.user.id ?? null;
  const [dialogState, setDialogState] = useState(DEFAULT_AUTH_DIALOG_STATE);
  const handledAuthQueryRef = useRef<string | null>(null);
  const pendingNoticePromiseRef = useRef<Promise<boolean> | null>(null);
  const [, startRouterTransition] = useTransition();

  useEffect(() => {
    if (loading || !sessionUserId || !viewer) {
      return;
    }

    void consumePendingAuthNoticeWithCanonicalViewer({
      currentViewer: viewer,
      pendingNoticePromiseRef,
      mutate,
    });
  }, [loading, mutate, sessionUserId, viewer]);

  useEffect(() => {
    return subscribePendingAuthNotice(() => {
      void consumePendingAuthNoticeWithCanonicalViewer({
        currentViewer: authSessionSnapshot.viewer,
        pendingNoticePromiseRef,
        mutate,
      });
    });
  }, [mutate]);

  function openAuthDialog(next = "/") {
    setDialogState((currentState) =>
      buildOpenedAuthDialogState(currentState, {
        next,
      })
    );
  }

  useEffect(() => {
    const pendingRequest = readPendingAuthDialogRequest(pathname);

    if (!pendingRequest) {
      handledAuthQueryRef.current = null;
      return;
    }

    if (loading) {
      return;
    }

    if (handledAuthQueryRef.current === pendingRequest.signature) {
      return;
    }

    handledAuthQueryRef.current = pendingRequest.signature;

    if (viewer) {
      startRouterTransition(() => {
        router.replace(
          pendingRequest.next !== pathname ? pendingRequest.next : pendingRequest.cleanedUrl,
          { scroll: false }
        );
      });
      return;
    }

    if (pendingRequest.error) {
      clearPendingAuthNotice();
      toast.error(pendingRequest.error);
    }

    startRouterTransition(() => {
      router.replace(pendingRequest.cleanedUrl, { scroll: false });
    });

    const frameId = window.requestAnimationFrame(() => {
      setDialogState((currentState) =>
        buildOpenedAuthDialogState(currentState, {
          next: pendingRequest.next,
          mode: pendingRequest.mode,
        })
      );
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [loading, pathname, router, startRouterTransition, viewer]);

  function handleDialogOpenChange(open: boolean) {
    setDialogState((currentState) => {
      if (open) {
        return currentState.open ? currentState : { ...currentState, open: true };
      }

      if (!currentState.open) {
        return currentState;
      }

      return {
        ...currentState,
        open: false,
      };
    });
  }

  async function signOut(next?: string) {
    const destination = next ?? (typeof window === "undefined" ? "/" : getCurrentAppLocation());

    await signOutAuthSession();
    await Promise.all([
      mutate(ACCOUNT_VIEWER_KEY, undefined, { revalidate: false }),
      mutate(isIdentityDependentSwrKey, undefined, { revalidate: false }),
    ]);
    toast.success("已退出登录");
    startRouterTransition(() => {
      router.push(safeAppPath(destination));
      router.refresh();
    });
  }

  async function refreshViewer() {
    await refreshAuthSession();
    startRouterTransition(() => {
      router.refresh();
    });
  }

  async function applyAccountSnapshot(snapshot: AccountViewerResponse) {
    applyViewerSnapshot(snapshot.viewer);

    await Promise.all([
      mutate(ACCOUNT_VIEWER_KEY, snapshot, { revalidate: false }),
      mutate(isIdentityDependentSwrKey, undefined, { revalidate: true }),
    ]);

    startRouterTransition(() => {
      router.refresh();
    });
  }

  const value: AuthContextValue = {
    loading,
    session,
    viewer,
    startSignIn: openAuthDialog,
    openAuthDialog,
    signOut,
    refreshViewer,
    applyAccountSnapshot,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
      {dialogState.open ? (
        <AuthDialog
          key={dialogState.seed}
          open={dialogState.open}
          onOpenChange={handleDialogOpenChange}
          next={dialogState.next}
          initialMode={dialogState.mode}
        />
      ) : null}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
