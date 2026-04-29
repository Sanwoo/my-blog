import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  usePathname: () => "/account",
}));

vi.mock("@/components/providers/AuthProvider", () => ({
  useAuth: () => ({
    applyAccountSnapshot: vi.fn(),
    refreshViewer: vi.fn(),
    session: null,
    viewer: null,
  }),
}));

import { AccountNotificationBadge } from "@/components/account/interaction-notification-summary";

describe("AccountNotificationBadge", () => {
  it("does not render for zero notifications", () => {
    const { container } = render(<AccountNotificationBadge count={0} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders a red numeric badge capped at 99+", () => {
    render(<AccountNotificationBadge count={120} />);
    expect(screen.getByText("99+")).toBeInTheDocument();
    expect(screen.getByText("99+")).toHaveClass("bg-red-500");
  });

  it("renders inline without floating positioning", () => {
    render(<AccountNotificationBadge count={3} variant="inline" />);
    expect(screen.getByText("3")).toHaveClass("static");
    expect(screen.getByText("3")).not.toHaveClass("absolute");
  });
});
