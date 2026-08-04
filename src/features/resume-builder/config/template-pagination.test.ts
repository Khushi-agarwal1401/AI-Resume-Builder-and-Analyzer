import { describe, expect, it } from "vitest";
import {
  TEMPLATE_PAGE_SIZE,
  hasMoreTemplates,
  nextVisibleCount,
} from "./template-pagination";

describe("nextVisibleCount", () => {
  it("reveals one page at a time", () => {
    expect(nextVisibleCount(0, 20)).toBe(TEMPLATE_PAGE_SIZE);
    expect(nextVisibleCount(TEMPLATE_PAGE_SIZE, 20)).toBe(TEMPLATE_PAGE_SIZE * 2);
  });

  it("clamps to the total when the final page is partial", () => {
    expect(nextVisibleCount(18, 20)).toBe(20);
    expect(nextVisibleCount(15, 20)).toBe(20);
  });

  it("never grows past the total", () => {
    expect(nextVisibleCount(22, 20)).toBe(20);
  });

  it("respects a custom page size", () => {
    expect(nextVisibleCount(4, 10, 3)).toBe(7);
  });

  it("handles an empty catalog", () => {
    expect(nextVisibleCount(0, 0)).toBe(0);
    expect(nextVisibleCount(TEMPLATE_PAGE_SIZE, 0)).toBe(0);
  });
});

describe("hasMoreTemplates", () => {
  it("is true while cards remain", () => {
    expect(hasMoreTemplates(0, 20)).toBe(true);
    expect(hasMoreTemplates(TEMPLATE_PAGE_SIZE, 20)).toBe(true);
  });

  it("is false once everything is loaded", () => {
    expect(hasMoreTemplates(20, 20)).toBe(false);
    expect(hasMoreTemplates(21, 20)).toBe(false);
  });

  it("is false for an empty catalog", () => {
    expect(hasMoreTemplates(0, 0)).toBe(false);
  });
});
