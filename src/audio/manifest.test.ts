import { describe, it, expect, vi, beforeEach } from "vitest";
import { getItemAudio, playSequential, UI_PHRASE_IDS } from "./manifest";

describe("getItemAudio", () => {
  it("returns en/vi audio paths following the naming convention for a known item", () => {
    const clips = getItemAudio("letter-A");
    expect(clips.en.src).toBe("/audio/en_letter-A.mp3");
    expect(clips.vi.src).toBe("/audio/vi_letter-A.mp3");
  });
});

describe("UI_PHRASE_IDS", () => {
  it("includes the fixed reward/instruction phrases the spec calls out", () => {
    expect(UI_PHRASE_IDS).toContain("correct");
    expect(UI_PHRASE_IDS).toContain("try_again");
    expect(UI_PHRASE_IDS).toContain("level_complete");
  });
});

describe("playSequential", () => {
  beforeEach(() => {
    // jsdom's HTMLMediaElement has no real playback; stub play()/onended wiring per clip.
    vi.stubGlobal("Audio", vi.fn().mockImplementation(() => {
      const instance: any = { play: vi.fn().mockResolvedValue(undefined), onended: null, onerror: null };
      // simulate playback finishing on next microtask so playSequential's promise resolves
      queueMicrotask(() => instance.onended && instance.onended());
      return instance;
    }));
  });

  it("plays clips in order and resolves once the last one ends", async () => {
    await expect(
      playSequential([{ src: "/audio/en_letter-A.mp3" }, { src: "/audio/vi_letter-A.mp3" }])
    ).resolves.toBeUndefined();
  });

  it("does not throw if a clip fails to load (missing file before audio is generated)", async () => {
    vi.stubGlobal("Audio", vi.fn().mockImplementation(() => {
      const instance: any = { play: vi.fn().mockRejectedValue(new Error("404")), onended: null, onerror: null };
      queueMicrotask(() => instance.onerror && instance.onerror(new Event("error")));
      return instance;
    }));
    await expect(playSequential([{ src: "/audio/en_missing.mp3" }])).resolves.toBeUndefined();
  });
});
