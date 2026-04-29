import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ProfileAvatar } from "@/components/profile/ProfileAvatar";

describe("ProfileAvatar", () => {
  it("renders a viewer image when an avatar url is already available", () => {
    render(
      <ProfileAvatar
        viewer={{
          displayName: "Sanwoo",
          email: "sanwoo@example.com",
          avatarUrl: "https://example.test/avatar.png",
        }}
      />
    );

    expect(screen.getByRole("img", { name: "Sanwoo" })).toHaveAttribute("src", "https://example.test/avatar.png");
  });

  it("falls back to profile initials when no image exists", () => {
    render(
      <ProfileAvatar
        profile={{
          displayName: "Echo",
          handle: "@echo",
          avatarUrl: null,
        }}
      />
    );

    expect(screen.getByText("E")).toBeInTheDocument();
  });
});
