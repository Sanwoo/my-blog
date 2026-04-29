"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import type { TocItem } from "@/lib/types";

type ArticleMobilePanelName = "toc" | "adjacent";

type ArticleReadingContextValue = {
  progress: number;
  activeId: string | null;
};

type ArticleMobilePanelContextValue = {
  openMobilePanel: ArticleMobilePanelName | null;
  toggleMobilePanel: (panel: ArticleMobilePanelName) => void;
  closeMobilePanel: () => void;
};

type ArticleReadingSnapshot = {
  progress: number;
  activeId: string | null;
};

type ArticleReadingStoreOptions = {
  container?: HTMLElement | null;
};

function createInitialSnapshot(items: TocItem[]): ArticleReadingSnapshot {
  return {
    progress: 0,
    activeId: items[0]?.id ?? null,
  };
}

function escapeHeadingSelector(id: string) {
  if (typeof CSS !== "undefined" && typeof CSS.escape === "function") {
    return `#${CSS.escape(id)}`;
  }

  return `#${id.replaceAll('"', '\\"')}`;
}

function createArticleReadingStore(initialItems: TocItem[], options?: ArticleReadingStoreOptions) {
  const items = initialItems;
  let container = options?.container ?? null;
  const getContainer = () => container;
  let snapshot = createInitialSnapshot(items);
  const listeners = new Set<() => void>();
  let frameId = 0;
  let observer: IntersectionObserver | null = null;
  let scrollListenerAttached = false;
  let scrollTarget: Window | HTMLElement | null = null;

  const emitChange = () => {
    listeners.forEach((listener) => listener());
  };

  const findScopedElement = <T extends Element>(selector: string) => {
    const container = getContainer();
    return (container ?? document).querySelector<T>(selector);
  };

  const setSnapshot = (nextSnapshot: ArticleReadingSnapshot) => {
    if (
      snapshot.progress === nextSnapshot.progress &&
      snapshot.activeId === nextSnapshot.activeId
    ) {
      return;
    }

    snapshot = nextSnapshot;
    emitChange();
  };

  const updateProgress = () => {
    const article = findScopedElement<HTMLElement>("article[data-reading-progress]");

    if (!article) {
      setSnapshot({
        progress: 0,
        activeId: items[0]?.id ?? null,
      });
      return;
    }

    const container = getContainer();
    const articleBox = article.getBoundingClientRect();
    const viewportHeight = container ? container.clientHeight : window.innerHeight;
    const viewportTop = container ? container.getBoundingClientRect().top : 0;
    const contentHeight = articleBox.height - viewportHeight;
    const progress =
      contentHeight <= 0
        ? 100
        : Math.min(100, Math.ceil((Math.max(0, viewportTop - articleBox.top) / contentHeight) * 100));

    setSnapshot({
      progress,
      activeId: snapshot.activeId,
    });
  };

  const connectHeadingObserver = () => {
    observer?.disconnect();
    observer = null;

    if (items.length === 0) {
      setSnapshot({
        progress: snapshot.progress,
        activeId: null,
      });
      return;
    }

    const headings = items
      .map((item) => findScopedElement<HTMLElement>(escapeHeadingSelector(item.id)))
      .filter((node): node is HTMLElement => Boolean(node));

    if (headings.length === 0) {
      setSnapshot({
        progress: snapshot.progress,
        activeId: items[0]?.id ?? null,
      });
      return;
    }

    observer = new IntersectionObserver(
      (entries) => {
        const visibleEntry = entries
          .filter((entry) => entry.isIntersecting)
          .toSorted((left, right) => left.boundingClientRect.top - right.boundingClientRect.top)[0];

        if (!visibleEntry?.target.id || visibleEntry.target.id === snapshot.activeId) {
          return;
        }

        setSnapshot({
          progress: snapshot.progress,
          activeId: visibleEntry.target.id,
        });
      },
      {
        root: getContainer(),
        rootMargin: "-20% 0px -55% 0px",
        threshold: [0, 0.25, 1],
      }
    );

    headings.forEach((heading) => observer?.observe(heading));
  };

  const flushLayoutSnapshot = () => {
    frameId = 0;
    updateProgress();
    connectHeadingObserver();
  };

  const onScroll = () => {
    if (frameId) {
      return;
    }

    frameId = window.requestAnimationFrame(() => {
      frameId = 0;
      updateProgress();
    });
  };

  const onResize = () => {
    if (frameId) {
      return;
    }

    frameId = window.requestAnimationFrame(flushLayoutSnapshot);
  };

  const attachScrollTarget = () => {
    if (typeof window === "undefined") {
      return;
    }

    const nextTarget = getContainer() ?? window;
    if (scrollTarget === nextTarget) {
      return;
    }

    scrollTarget?.removeEventListener("scroll", onScroll);
    scrollTarget = nextTarget;
    scrollTarget.addEventListener("scroll", onScroll, { passive: true });
  };

  const start = () => {
    if (scrollListenerAttached || typeof window === "undefined") {
      return;
    }

    scrollListenerAttached = true;
    attachScrollTarget();
    window.addEventListener("resize", onResize, { passive: true });
    frameId = window.requestAnimationFrame(flushLayoutSnapshot);
  };

  const stop = () => {
    if (!scrollListenerAttached || typeof window === "undefined") {
      return;
    }

    scrollListenerAttached = false;
    scrollTarget?.removeEventListener("scroll", onScroll);
    scrollTarget = null;
    window.removeEventListener("resize", onResize);

    if (frameId) {
      window.cancelAnimationFrame(frameId);
      frameId = 0;
    }

    observer?.disconnect();
    observer = null;
  };

  return {
    setContainer(nextContainer: HTMLElement | null) {
      if (container === nextContainer) {
        return;
      }

      container = nextContainer;

      if (!scrollListenerAttached || typeof window === "undefined") {
        return;
      }

      attachScrollTarget();

      if (frameId) {
        window.cancelAnimationFrame(frameId);
      }

      frameId = window.requestAnimationFrame(flushLayoutSnapshot);
    },
    getSnapshot() {
      return snapshot;
    },
    subscribe(listener: () => void) {
      if (typeof window === "undefined") {
        return () => undefined;
      }

      listeners.add(listener);

      if (listeners.size === 1) {
        start();
      }

      return () => {
        listeners.delete(listener);

        if (listeners.size === 0) {
          stop();
        }
      };
    },
  };
}

const ArticleReadingContext = createContext<ArticleReadingContextValue>({
  progress: 0,
  activeId: null,
});
const ArticleMobilePanelContext = createContext<ArticleMobilePanelContextValue | null>(null);

export function ArticleReadingProvider({
  items,
  container,
  children,
}: {
  items: TocItem[];
  container?: HTMLElement | null;
  children: ReactNode;
}) {
  const [initialItems] = useState(items);
  const [itemIds] = useState(() => new Set(initialItems.map((item) => item.id)));
  const [openMobilePanel, setOpenMobilePanel] = useState<ArticleMobilePanelName | null>(null);
  const [store] = useState(() =>
    createArticleReadingStore(initialItems, {
      container: container ?? null,
    })
  );
  const { progress, activeId } = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getSnapshot
  );
  const firstItemId = initialItems[0]?.id ?? null;

  const visibleActiveId =
    activeId && itemIds.has(activeId) ? activeId : firstItemId;
  const closeMobilePanel = () => {
    setOpenMobilePanel(null);
  };
  const toggleMobilePanel = (panel: ArticleMobilePanelName) => {
    setOpenMobilePanel((currentPanel) => (currentPanel === panel ? null : panel));
  };
  const readingValue = { progress, activeId: visibleActiveId };
  const mobilePanelValue = {
    openMobilePanel,
    toggleMobilePanel,
    closeMobilePanel,
  };

  useEffect(() => {
    store.setContainer(container ?? null);
  }, [container, store]);

  useEffect(() => {
    if (!openMobilePanel) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpenMobilePanel(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [openMobilePanel]);

  return (
    <ArticleMobilePanelContext.Provider value={mobilePanelValue}>
      <ArticleReadingContext.Provider value={readingValue}>
        {children}
      </ArticleReadingContext.Provider>
    </ArticleMobilePanelContext.Provider>
  );
}

export function useArticleReading() {
  return useContext(ArticleReadingContext);
}

export function useArticleMobilePanel(panel: ArticleMobilePanelName) {
  const context = useContext(ArticleMobilePanelContext);

  if (!context) {
    throw new Error("useArticleMobilePanel must be used within ArticleReadingProvider");
  }

  return {
    open: context.openMobilePanel === panel,
    panelId: `article-mobile-${panel}-panel`,
    togglePanel: () => context.toggleMobilePanel(panel),
    closePanel: context.closeMobilePanel,
  };
}
