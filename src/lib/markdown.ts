export interface TOCHeading {
  id: string;
  text: string;
  level: number;
}

export function extractTOC(markdown: string): TOCHeading[] {
  const headings: TOCHeading[] = [];
  const lines = markdown.split("\n");
  let inCodeBlock = false;

  for (const line of lines) {
    if (line.trim().startsWith("```")) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    if (inCodeBlock) continue;

    const match = line.match(/^(#{2,3})\s+(.+)$/);
    if (match) {
      const level = match[1].length;
      const text = match[2].replace(/[*_`\[\]]/g, "").trim();
      const id = text
        .toLowerCase()
        .replace(/[^\w\u4e00-\u9fff]+/g, "-")
        .replace(/^-+|-+$/g, "");
      headings.push({ id, text, level });
    }
  }

  return headings;
}

export function estimateReadingTime(markdown: string): string {
  const text = markdown
    .replace(/```[\s\S]*?```/g, "")
    .replace(/!\[.*?\]\(.*?\)/g, "")
    .replace(/\[([^\]]*)\]\(.*?\)/g, "$1")
    .replace(/[#*_>`~\-|]/g, "")
    .trim();

  const chineseChars = (text.match(/[\u4e00-\u9fff]/g) || []).length;
  const englishWords = text.replace(/[\u4e00-\u9fff]/g, "").split(/\s+/).filter(Boolean).length;

  const chineseReadingSpeed = 400;
  const englishReadingSpeed = 200;
  const minutes = Math.ceil(chineseChars / chineseReadingSpeed + englishWords / englishReadingSpeed);

  return `${Math.max(1, minutes)} 分钟阅读`;
}
