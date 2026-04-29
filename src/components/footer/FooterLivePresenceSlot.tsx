"use client";

import dynamic from "next/dynamic";

const FooterLivePresence = dynamic(
  () => import("@/components/footer/FooterLivePresence").then((module) => module.FooterLivePresence),
  {
    ssr: false,
    loading: () => <p>正在同步在线人数</p>,
  }
);

export function FooterLivePresenceSlot() {
  return <FooterLivePresence />;
}
