import { describe, expect, it } from "vitest";
import { positionMeanings } from "../data/positionMeanings";
import { spreads } from "../data/spreads";
import { composeReading } from "../lib/reading";

describe("composeReading", () => {
  it("reads 10 Кубков as career energy through people, circle, and emotional return", () => {
    const reading = composeReading({
      spreadId: "career",
      positionId: "career-energy",
      orientation: "upright",
      card: { type: "minor", suitId: "cups", rankId: "ten" },
    });

    expect(reading.cardName).toBe("10 Кубков");
    expect(reading.summary).toContain("работа с людьми");
    expect(reading.summary).toContain("ощущение своего круга");
    expect(reading.summary).toContain("эмоциональная отдача");
    expect(reading.avoid).not.toContain("единственную профессию");
  });

  it("reads 10 Кубков as choice risk through idealization and practical blind spots", () => {
    const reading = composeReading({
      spreadId: "choice",
      positionId: "choice-risk",
      orientation: "upright",
      card: { type: "minor", suitId: "cups", rankId: "ten" },
    });

    expect(reading.cardName).toBe("10 Кубков");
    expect(reading.summary).toContain("идеализировать красивую картинку");
    expect(reading.summary).toContain("практические сложности");
    expect(reading.avoid).toContain("не читать риск как запрет на радость");
  });
});

describe("data integrity", () => {
  const lensIds = new Set(positionMeanings.map((meaning) => meaning.id));

  it("has positions with valid lenses, phrases, and verbs for every spread", () => {
    expect(spreads).toHaveLength(4);

    for (const spread of spreads) {
      expect(spread.positions.length).toBeGreaterThan(0);
      expect(spread.contextLens.length).toBeGreaterThan(20);

      for (const position of spread.positions) {
        expect(lensIds.has(position.lensId)).toBe(true);
        expect(position.title.length).toBeGreaterThan(0);
        expect(position.shows.length).toBeGreaterThan(10);
        expect(position.verbs.length).toBeGreaterThanOrEqual(3);
        expect(position.phrases.length).toBeGreaterThanOrEqual(2);
        expect(position.attention.length).toBeGreaterThan(10);
        expect(position.avoid.length).toBeGreaterThan(10);
      }
    }
  });
});
