import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import WorldHud from "./WorldHud";

describe("WorldHud", () => {
  it("shows both language dots, highlighting the active one", () => {
    const { rerender } = render(<WorldHud activeLang="en" />);
    expect(screen.getByTestId("hud-dot-en")).toHaveAttribute("data-active", "true");
    expect(screen.getByTestId("hud-dot-vi")).toHaveAttribute("data-active", "false");

    rerender(<WorldHud activeLang="vi" />);
    expect(screen.getByTestId("hud-dot-en")).toHaveAttribute("data-active", "false");
    expect(screen.getByTestId("hud-dot-vi")).toHaveAttribute("data-active", "true");
  });

  it("shows neither dot active when no language is playing", () => {
    render(<WorldHud activeLang={null} />);
    expect(screen.getByTestId("hud-dot-en")).toHaveAttribute("data-active", "false");
    expect(screen.getByTestId("hud-dot-vi")).toHaveAttribute("data-active", "false");
  });
});
