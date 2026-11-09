import { describe, expect, it } from "vitest";
import { isCourseComplete, isQuizPassed } from "@/lib/learning";

describe("learning gates", () => {
  it("passes the quiz at the 65 percent threshold", () => {
    expect(isQuizPassed(65)).toBe(true);
    expect(isQuizPassed(64)).toBe(false);
  });

  it("requires the practical review before course completion", () => {
    expect(isCourseComplete({ allSessionsComplete: true, allQuizzesPassed: true, practicalRequired: true, practicalPassed: false })).toBe(false);
    expect(isCourseComplete({ allSessionsComplete: true, allQuizzesPassed: true, practicalRequired: true, practicalPassed: true })).toBe(true);
  });
});