import { describe, it, expect } from "vitest";
import { formatMetric, formatTotals } from "./format";

describe("formatMetric", () => {
  it("uses kg at or above 1000 g", () => {
    expect(formatMetric({ family: "MASS", base: 1200 })).toBe("1.2 kg");
  });

  it("uses g below 1000", () => {
    expect(formatMetric({ family: "MASS", base: 340 })).toBe("340 g");
  });

  it("uses ml and l for volume", () => {
    expect(formatMetric({ family: "VOLUME", base: 30 })).toBe("30 ml");
    expect(formatMetric({ family: "VOLUME", base: 1500 })).toBe("1.5 l");
  });

  it("renders a bare count", () => {
    expect(formatMetric({ family: "COUNT", base: 3 })).toBe("3");
  });
});

describe("formatTotals", () => {
  it("joins un-mergeable quantities with a plus", () => {
    expect(
      formatTotals([
        { family: "MASS", base: 400 },
        { family: "VOLUME", base: 30 },
      ]),
    ).toBe("400 g + 30 ml");
  });
});
