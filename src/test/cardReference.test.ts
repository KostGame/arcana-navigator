import { describe, expect, it } from "vitest";
import { buildCardReferenceEntries, filterCardReferenceEntries } from "../lib/cardReference";

describe("card reference", () => {
  const entries = buildCardReferenceEntries();

  it("builds all 22 major arcana", () => {
    const majorEntries = entries.filter((entry) => entry.kind === "major");

    expect(majorEntries).toHaveLength(22);
    expect(majorEntries.some((entry) => entry.title.includes("Луна"))).toBe(true);
  });

  it("builds 8 Cups with a structured short meaning", () => {
    const eightCups = entries.find((entry) => entry.id === "minor-cups-eight");

    expect(eightCups?.title).toBe("8 Кубков");
    expect(eightCups?.shortMeaning).toContain("уход");
    expect(eightCups?.shortMeaning).toContain("не наполняет");
  });

  it("builds Page of Pentacles with a structured short meaning", () => {
    const pagePentacles = entries.find((entry) => entry.id === "court-pentacles-page");

    expect(pagePentacles?.title).toBe("Паж Пентаклей");
    expect(pagePentacles?.shortMeaning).toContain("практический шаг");
    expect(pagePentacles?.shortMeaning).toContain("обучение");
  });

  it("filters and searches expected cards", () => {
    const moon = filterCardReferenceEntries(entries, "major", "Луна");
    const cups = filterCardReferenceEntries(entries, "cups", "8");
    const court = filterCardReferenceEntries(entries, "court", "Паж Пентаклей");

    expect(moon.map((entry) => entry.title)).toContain("XVIII Луна");
    expect(cups.map((entry) => entry.title)).toContain("8 Кубков");
    expect(court.map((entry) => entry.title)).toContain("Паж Пентаклей");
  });
});
