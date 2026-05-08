import { describe, expect, it } from "vitest";
import { buildCardReferenceEntries, filterCardReferenceEntries } from "../lib/cardReference";

describe("card reference", () => {
  const entries = buildCardReferenceEntries();

  it("builds all 22 major arcana", () => {
    const majorEntries = entries.filter((entry) => entry.kind === "major");
    const moon = entries.find((entry) => entry.id === "major-moon");

    expect(majorEntries).toHaveLength(22);
    expect(majorEntries.some((entry) => entry.title.includes("Луна"))).toBe(true);
    expect(moon?.selection).toEqual({
      cardKind: "major",
      card: { type: "major", majorId: "moon" },
    });
  });

  it("builds 8 Cups with a structured short meaning", () => {
    const eightCups = entries.find((entry) => entry.id === "minor-cups-eight");

    expect(eightCups?.title).toBe("8 Кубков");
    expect(eightCups?.shortMeaning).toContain("уход");
    expect(eightCups?.shortMeaning).toContain("не наполняет");
    expect(eightCups?.selection).toEqual({
      cardKind: "minor",
      card: { type: "minor", suitId: "cups", rankId: "eight" },
    });
  });

  it("builds Page of Pentacles with a structured short meaning", () => {
    const pagePentacles = entries.find((entry) => entry.id === "court-pentacles-page");

    expect(pagePentacles?.title).toBe("Паж Пентаклей");
    expect(pagePentacles?.shortMeaning).toContain("практический шаг");
    expect(pagePentacles?.shortMeaning).toContain("обучение");
    expect(pagePentacles?.selection).toEqual({
      cardKind: "court",
      card: { type: "court", suitId: "pentacles", courtId: "page" },
    });
  });

  it("does not expose spread selections for suit and rank helper entries", () => {
    const cups = entries.find((entry) => entry.id === "suit-cups");
    const eight = entries.find((entry) => entry.id === "rank-eight");

    expect(cups?.selection).toBeUndefined();
    expect(eight?.selection).toBeUndefined();
  });

  it("filters and searches expected cards", () => {
    const moon = filterCardReferenceEntries(entries, "major", "Луна");
    const cups = filterCardReferenceEntries(entries, "cups", "8");
    const court = filterCardReferenceEntries(entries, "court", "Паж Пентаклей");
    const minor = filterCardReferenceEntries(entries, "minor", "8 Кубков");
    const rankEight = filterCardReferenceEntries(entries, "rank-eight", "Кубков");
    const page = filterCardReferenceEntries(entries, "court-page", "Пентаклей");

    expect(moon.map((entry) => entry.title)).toContain("XVIII Луна");
    expect(cups.map((entry) => entry.title)).toContain("8 Кубков");
    expect(court.map((entry) => entry.title)).toContain("Паж Пентаклей");
    expect(minor.map((entry) => entry.title)).toContain("8 Кубков");
    expect(rankEight.map((entry) => entry.title)).toContain("8 Кубков");
    expect(page.map((entry) => entry.title)).toContain("Паж Пентаклей");
  });
});
