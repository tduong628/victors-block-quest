import { describe, it, expect, vi, beforeEach } from "vitest";
import { shouldTriggerDiscover, DISCOVER_TRIGGER_RADIUS } from "./useMonumentDiscover";

describe("shouldTriggerDiscover", () => {
  it("triggers when the player is within the radius and not already discovered", () => {
    expect(shouldTriggerDiscover(0, 0, 1, 1, false)).toBe(true);
  });

  it("does not trigger when the player is outside the radius", () => {
    expect(shouldTriggerDiscover(0, 0, DISCOVER_TRIGGER_RADIUS + 5, 0, false)).toBe(false);
  });

  it("does not re-trigger once already discovered, even if still in radius", () => {
    expect(shouldTriggerDiscover(0, 0, 1, 1, true)).toBe(false);
  });

  it("triggers exactly at the boundary radius (inclusive edge documented, not accidental)", () => {
    expect(shouldTriggerDiscover(0, 0, DISCOVER_TRIGGER_RADIUS, 0, false)).toBe(true);
  });
});
