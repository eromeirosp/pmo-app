import { describe, it, expect } from "vitest";
import { cn } from "../utils";

describe("cn", () => {
  it("merges simple class names", () => {
    expect(cn("px-2", "py-1")).toBe("px-2 py-1");
  });

  it("resolves conflicting Tailwind classes (last wins)", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
  });

  it("handles conditional classes", () => {
    expect(cn("base", false && "hidden", "flex")).toBe("base flex");
  });

  it("handles undefined and null inputs", () => {
    expect(cn("base", undefined, null, "flex")).toBe("base flex");
  });

  it("returns empty string with no inputs", () => {
    expect(cn()).toBe("");
  });
});
