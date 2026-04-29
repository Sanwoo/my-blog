import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Writer's desk",
  description: "作者写作与发布后台",
};

export default function EditorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
