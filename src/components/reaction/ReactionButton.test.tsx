import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ReactionButton } from "@/components/reaction/ReactionButton";
import { ReactionCount } from "@/components/reaction/ReactionCount";

describe("ReactionButton", () => {
  it("renders count, pressed state, and calls the toggle handler", () => {
    const onToggle = vi.fn();
    render(
      <ReactionButton
        active={false}
        count={7}
        label="欣赏"
        tone="article"
        size="default"
        onToggle={onToggle}
      />
    );

    const button = screen.getByRole("button", { name: /欣赏7/ });
    expect(button).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(button);
    expect(onToggle).toHaveBeenCalledOnce();
    expect(button.querySelector(".motion-safe\\:animate-\\[reaction-heart-pop_520ms_cubic-bezier\\(0\\.22\\,1\\,0\\.36\\,1\\)\\]")).toBeInTheDocument();
  });

  it("does not play the like pop animation when toggling an active reaction off", () => {
    const onToggle = vi.fn();
    render(
      <ReactionButton
        active
        count={7}
        label="欣赏"
        tone="article"
        size="default"
        onToggle={onToggle}
      />
    );

    const button = screen.getByRole("button", { name: /欣赏7/ });
    fireEvent.click(button);
    expect(onToggle).toHaveBeenCalledOnce();
    expect(button.querySelector(".motion-safe\\:animate-\\[reaction-heart-pop_520ms_cubic-bezier\\(0\\.22\\,1\\,0\\.36\\,1\\)\\]")).not.toBeInTheDocument();
  });

  it("disables pending interactions", () => {
    const onToggle = vi.fn();
    render(
      <ReactionButton
        active
        pending
        count={1}
        tone="comment"
        size="sm"
        onToggle={onToggle}
      />
    );

    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(button);
    expect(onToggle).not.toHaveBeenCalled();
  });
});

describe("ReactionCount", () => {
  it("renders the visible count label", () => {
    render(<ReactionCount count={12} />);
    expect(screen.getByText("12 次欣赏")).toBeInTheDocument();
  });
});
