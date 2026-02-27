import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Echoes | Article Editor",
  description: "撰写与编辑文章",
};

export default function EditorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
