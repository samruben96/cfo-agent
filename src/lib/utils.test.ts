import { describe, expect, it } from "vitest";

import { cn } from "./utils";

describe("cn utility", () => {
  it("merges class names correctly", () => {
    const result = cn("px-4", "py-2", "bg-primary");
    expect(result).toBe("px-4 py-2 bg-primary");
  });

  it("handles conditional classes", () => {
    const isActive = true;
    const result = cn("base", isActive && "active");
    expect(result).toBe("base active");
  });

  it("deduplicates conflicting Tailwind classes", () => {
    const result = cn("px-4", "px-2");
    expect(result).toBe("px-2");
  });
});
