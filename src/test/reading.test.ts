import { describe, expect, it } from "vitest";
import { positionLenses } from "../data/positionLenses";
import { questionTypes } from "../data/questionTypes";
import { spreadLayouts } from "../data/spreadLayouts";
import { composeReading } from "../lib/reading";

describe("composeReading", () => {
  it("reads Moon differently for relationships", () => {
    const reading = composeReading({
      spreadId: "three-advice",
      questionTypeId: "relationships",
      positionId: "three-influence",
      orientation: "upright",
      card: { type: "major", majorId: "moon" },
    });

    expect(reading.summary).toContain("скрытые чувства");
    expect(reading.summary).toContain("страхи");
    expect(reading.summary).toContain("неясность");
    expect(reading.summary).toContain("фантазии");
    expect(reading.summary).toContain("прояснения");
  });

  it("reads Moon differently for career", () => {
    const reading = composeReading({
      spreadId: "three-advice",
      questionTypeId: "career",
      positionId: "three-influence",
      orientation: "upright",
      card: { type: "major", majorId: "moon" },
    });

    expect(reading.summary).toContain("работу с неочевидным");
    expect(reading.summary).toContain("диагностику");
    expect(reading.summary).toContain("психологию");
    expect(reading.summary).toContain("исследование");
    expect(reading.summary).toContain("творчество");
    expect(reading.summary).toContain("скрытые мотивы");
  });

  it("reads Moon differently for forecast", () => {
    const reading = composeReading({
      spreadId: "forecast",
      questionTypeId: "forecast",
      positionId: "forecast-near",
      orientation: "upright",
      card: { type: "major", majorId: "moon" },
    });

    expect(reading.summary).toContain("пока не всё видно");
    expect(reading.summary).toContain("условия могут быть туманными");
    expect(reading.summary).toContain("окончательный вывод");
    expect(reading.summary).toContain("не делать слишком рано");
  });

  it("reads 10 Cups as relationship harmony and emotional fullness", () => {
    const reading = composeReading({
      spreadId: "relationships",
      questionTypeId: "relationships",
      positionId: "rel-between",
      orientation: "upright",
      card: { type: "minor", suitId: "cups", rankId: "ten" },
    });

    expect(reading.cardName).toBe("10 Кубков");
    expect(reading.shortMeaning).toContain("гармония");
    expect(reading.shortMeaning).toContain("близость");
    expect(reading.summary).toContain("гармонию");
    expect(reading.summary).toContain("близость");
    expect(reading.summary).toContain("образ семьи");
    expect(reading.summary).toContain("эмоциональную полноту");
  });

  it("returns the base short meaning for 10 Cups", () => {
    const reading = composeReading({
      spreadId: "three-advice",
      questionTypeId: "diagnosis",
      positionId: "three-situation",
      orientation: "upright",
      card: { type: "minor", suitId: "cups", rankId: "ten" },
    });

    expect(reading.shortMeaning).toContain("эмоциональная полнота");
    expect(reading.shortMeaning).toContain("свой круг");
  });

  it("reads 10 Cups as choice risk through idealization and practical details", () => {
    const reading = composeReading({
      spreadId: "two-options",
      questionTypeId: "choice",
      positionId: "two-risk",
      orientation: "upright",
      card: { type: "minor", suitId: "cups", rankId: "ten" },
    });

    expect(reading.cardName).toBe("10 Кубков");
    expect(reading.summary).toContain("идеализировать красивую картинку");
    expect(reading.summary).toContain("ожидать идеального результата");
    expect(reading.summary).toContain("практические детали");
    expect(reading.avoid).toContain("не читать риск как запрет на радость");
  });

  it("reads 10 Cups as career energy through people, circle, and emotional return", () => {
    const reading = composeReading({
      spreadId: "career",
      questionTypeId: "career",
      positionId: "career-energy",
      orientation: "upright",
      card: { type: "minor", suitId: "cups", rankId: "ten" },
    });

    expect(reading.cardName).toBe("10 Кубков");
    expect(reading.shortMeaning).toContain("работа с людьми");
    expect(reading.shortMeaning).toContain("свой круг");
    expect(reading.summary).toContain("работа с людьми");
    expect(reading.summary).toContain("ощущение своего круга");
    expect(reading.summary).toContain("эмоциональная отдача");
  });

  it("returns structured short meanings for key cards", () => {
    const devil = composeReading({
      spreadId: "three-advice",
      questionTypeId: "diagnosis",
      positionId: "three-situation",
      orientation: "upright",
      card: { type: "major", majorId: "devil" },
    });
    const pagePentacles = composeReading({
      spreadId: "three-advice",
      questionTypeId: "diagnosis",
      positionId: "three-influence",
      orientation: "upright",
      card: { type: "court", suitId: "pentacles", courtId: "page" },
    });

    expect(devil.shortMeaning).toContain("желание");
    expect(devil.shortMeaning).toContain("привязка");
    expect(devil.shortMeaning).toContain("сильный стимул");
    expect(pagePentacles.shortMeaning).toContain("практический шаг");
    expect(pagePentacles.shortMeaning).toContain("навык");
    expect(pagePentacles.shortMeaning).toContain("обучение");
  });
});

describe("data integrity", () => {
  const roleIds = new Set(positionLenses.map((lens) => lens.role));
  const questionTypeIds = new Set(questionTypes.map((type) => type.id));

  it("has the required spread layouts with valid positions", () => {
    expect(spreadLayouts).toHaveLength(10);

    for (const spread of spreadLayouts) {
      expect(spread.positions.length).toBeGreaterThan(0);
      expect(questionTypeIds.has(spread.defaultQuestionTypeId)).toBe(true);

      for (const position of spread.positions) {
        expect(roleIds.has(position.role)).toBe(true);
        expect(position.title.length).toBeGreaterThan(0);
        expect(position.description.length).toBeGreaterThan(10);
      }
    }
  });

  it("has short meanings for core card data", async () => {
    const [{ suits }, { ranks }, { courtCards }, { majors }] = await Promise.all([
      import("../data/suits"),
      import("../data/ranks"),
      import("../data/court"),
      import("../data/majors"),
    ]);

    for (const item of [...suits, ...ranks, ...courtCards, ...majors]) {
      expect(item.shortMeaning.length).toBeGreaterThan(8);
      expect(item.shortMeaning.split(/\s+/u).length).toBeLessThanOrEqual(8);
    }
  });

  it("has rich enough question types", () => {
    expect(questionTypes).toHaveLength(12);

    for (const type of questionTypes) {
      expect(type.verbs.length).toBeGreaterThanOrEqual(5);
      expect(type.readingFocus.length).toBeGreaterThanOrEqual(5);
      expect(type.avoid.length).toBeGreaterThanOrEqual(3);
      expect(type.starterPhrases.length).toBeGreaterThanOrEqual(3);
      expect(type.positiveCards.length).toBeGreaterThan(20);
      expect(type.tenseCards.length).toBeGreaterThan(20);
    }
  });
});
