import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ArticleShareControls } from "@/components/article/ArticleShareControls";

const originalClipboardDescriptor = Object.getOwnPropertyDescriptor(navigator, "clipboard");
const originalShareDescriptor = Object.getOwnPropertyDescriptor(navigator, "share");

function restoreNavigatorProperty(name: "clipboard" | "share", descriptor: PropertyDescriptor | undefined) {
  if (descriptor) {
    Object.defineProperty(navigator, name, descriptor);
    return;
  }

  Reflect.deleteProperty(navigator, name);
}

function mockClipboard(writeText = vi.fn().mockResolvedValue(undefined)) {
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: { writeText },
  });

  return writeText;
}

function mockNativeShare(share = vi.fn().mockResolvedValue(undefined)) {
  Object.defineProperty(navigator, "share", {
    configurable: true,
    value: share,
  });

  return share;
}

afterEach(() => {
  vi.restoreAllMocks();
  restoreNavigatorProperty("clipboard", originalClipboardDescriptor);
  restoreNavigatorProperty("share", originalShareDescriptor);
});

describe("ArticleShareControls", () => {
  it("renders link-first share copy and copies an excerpt payload", async () => {
    const writeText = mockClipboard();
    render(<ArticleShareControls slug="quiet-note" title="Quiet Note" excerpt="A small signal." />);

    fireEvent.click(screen.getByRole("button", { name: "分享" }));

    expect(await screen.findByText("复制链接，或带上一段适合转发的摘要。")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "复制摘要" }));

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith("Quiet Note\nA small signal.\nhttp://localhost:3000/posts/quiet-note");
    });
    expect(await screen.findByText("摘要已复制。")).toBeInTheDocument();
  });

  it("copies the canonical article link as the primary action", async () => {
    const writeText = mockClipboard();
    render(<ArticleShareControls slug="quiet-note" title="Quiet Note" />);

    fireEvent.click(screen.getByRole("button", { name: "分享" }));
    fireEvent.click(await screen.findByRole("button", { name: "复制链接" }));

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith("http://localhost:3000/posts/quiet-note");
    });
    expect(await screen.findByText("链接已复制。")).toBeInTheDocument();
  });

  it("reports clipboard failures", async () => {
    mockClipboard(vi.fn().mockRejectedValue(new Error("denied")));
    render(<ArticleShareControls slug="quiet-note" title="Quiet Note" />);

    fireEvent.click(screen.getByRole("button", { name: "分享" }));
    fireEvent.click(await screen.findByRole("button", { name: "复制链接" }));

    expect(await screen.findByText("复制失败，请稍后再试。")).toBeInTheDocument();
  });

  it("uses native share when the browser provides it", async () => {
    const share = mockNativeShare();
    mockClipboard();
    render(<ArticleShareControls slug="quiet-note" title="Quiet Note" excerpt="A small signal." />);

    fireEvent.click(screen.getByRole("button", { name: "分享" }));
    fireEvent.click(await screen.findByRole("button", { name: "系统分享" }));

    await waitFor(() => {
      expect(share).toHaveBeenCalledWith({
        title: "Quiet Note",
        text: "A small signal.",
        url: "http://localhost:3000/posts/quiet-note",
      });
    });
    expect(await screen.findByText("已唤起系统分享。")).toBeInTheDocument();
  });

  it("treats native share cancellation as neutral feedback", async () => {
    mockNativeShare(vi.fn().mockRejectedValue(new DOMException("cancelled", "AbortError")));
    mockClipboard();
    render(<ArticleShareControls slug="quiet-note" title="Quiet Note" />);

    fireEvent.click(screen.getByRole("button", { name: "分享" }));
    fireEvent.click(await screen.findByRole("button", { name: "系统分享" }));

    expect(await screen.findByText("已取消分享。")).toBeInTheDocument();
  });

  it("reports native share failures", async () => {
    mockNativeShare(vi.fn().mockRejectedValue(new Error("share failed")));
    mockClipboard();
    render(<ArticleShareControls slug="quiet-note" title="Quiet Note" />);

    fireEvent.click(screen.getByRole("button", { name: "分享" }));
    fireEvent.click(await screen.findByRole("button", { name: "系统分享" }));

    expect(await screen.findByText("系统分享暂不可用，请复制链接分享。")).toBeInTheDocument();
  });

  it("reports blocked platform windows", async () => {
    mockClipboard();
    vi.spyOn(window, "open").mockReturnValue(null);
    render(<ArticleShareControls slug="quiet-note" title="Quiet Note" />);

    fireEvent.click(screen.getByRole("button", { name: "分享" }));
    fireEvent.click(await screen.findByRole("button", { name: "X" }));

    expect(await screen.findByText("浏览器拦截了新窗口，请复制链接分享。")).toBeInTheDocument();
  });
});
