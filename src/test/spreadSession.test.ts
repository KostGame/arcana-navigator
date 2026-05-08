import { describe, expect, it } from "vitest";
import {
  cancelEditPosition,
  changeSessionQuestionType,
  clearPosition,
  clearSession,
  composeSpreadSessionReadings,
  composeSpreadSummary,
  createSpreadSession,
  editPosition,
  findNextAvailablePositionId,
  selectCardForAvailablePosition,
  selectCardForActivePosition,
  selectCardForPosition,
  setActivePosition,
} from "../lib/spreadSession";
import type { PositionCardSelection } from "../types";

const tenCups: PositionCardSelection = {
  cardKind: "minor",
  card: { type: "minor", suitId: "cups", rankId: "ten" },
  orientation: "upright",
};

const moon: PositionCardSelection = {
  cardKind: "major",
  card: { type: "major", majorId: "moon" },
  orientation: "upright",
};

const sevenSwords: PositionCardSelection = {
  cardKind: "minor",
  card: { type: "minor", suitId: "swords", rankId: "seven" },
  orientation: "reversed",
};

const defaultEightCups: PositionCardSelection = {
  cardKind: "minor",
  card: { type: "minor", suitId: "cups", rankId: "eight" },
  orientation: "upright",
};

describe("spread session state", () => {
  it("fixes the selected card to the active position", () => {
    const session = selectCardForActivePosition(createSpreadSession("three-advice"), tenCups);

    expect(session.cardsByPosition["three-situation"]).toEqual(tenCups);
    expect(session.lastUpdatedPositionId).toBe("three-situation");
  });

  it("fixes the current picker card by explicit action without changing controls", () => {
    const session = selectCardForActivePosition(createSpreadSession("three-advice"), defaultEightCups);

    expect(session.cardsByPosition["three-situation"]).toEqual(defaultEightCups);
    expect(session.activePositionId).toBe("three-influence");
  });

  it("moves the active position to the next empty position after selection", () => {
    const session = selectCardForActivePosition(createSpreadSession("three-advice"), tenCups);

    expect(session.activePositionId).toBe("three-influence");
  });

  it("does not clear selected cards when active position changes", () => {
    const withCard = selectCardForActivePosition(createSpreadSession("three-advice"), tenCups);
    const changed = setActivePosition(withCard, "three-direction");

    expect(changed.activePositionId).toBe("three-direction");
    expect(changed.cardsByPosition["three-situation"]).toEqual(tenCups);
  });

  it("does not overwrite a filled position without editPosition", () => {
    const withCard = selectCardForActivePosition(createSpreadSession("three-advice"), tenCups);
    const activeAgain = setActivePosition(withCard, "three-situation");
    const blocked = selectCardForActivePosition(activeAgain, moon);

    expect(blocked.cardsByPosition["three-situation"]).toEqual(tenCups);
  });

  it("adds a reference card to the active empty position", () => {
    const session = selectCardForAvailablePosition(createSpreadSession("three-advice"), moon);

    expect(session.cardsByPosition["three-situation"]).toEqual(moon);
    expect(session.activePositionId).toBe("three-influence");
  });

  it("adds a reference card to the next empty position when active is filled", () => {
    const withCard = selectCardForActivePosition(createSpreadSession("three-advice"), tenCups);
    const activeAgain = setActivePosition(withCard, "three-situation");
    const updated = selectCardForAvailablePosition(activeAgain, moon);

    expect(updated.cardsByPosition["three-situation"]).toEqual(tenCups);
    expect(updated.cardsByPosition["three-influence"]).toEqual(moon);
    expect(updated.activePositionId).toBe("three-direction");
  });

  it("adds a reference card to a specific empty position", () => {
    const session = selectCardForPosition(createSpreadSession("three-advice"), "three-direction", moon);

    expect(session.cardsByPosition["three-direction"]).toEqual(moon);
    expect(session.activePositionId).toBe("three-advice");
  });

  it("does not overwrite a specific filled position from reference", () => {
    const withCard = selectCardForPosition(createSpreadSession("three-advice"), "three-direction", tenCups);
    const blocked = selectCardForPosition(withCard, "three-direction", moon);

    expect(blocked.cardsByPosition["three-direction"]).toEqual(tenCups);
    expect(blocked.cardsByPosition["three-direction"]).not.toEqual(moon);
  });

  it("does not overwrite existing cards when every position is filled from reference", () => {
    let session = createSpreadSession("past-present-future");

    session = selectCardForAvailablePosition(session, tenCups);
    session = selectCardForAvailablePosition(session, moon);
    session = selectCardForAvailablePosition(session, sevenSwords);

    const snapshot = session.cardsByPosition;
    const blocked = selectCardForAvailablePosition(session, defaultEightCups);

    expect(findNextAvailablePositionId(session)).toBeUndefined();
    expect(blocked.cardsByPosition).toEqual(snapshot);
  });

  it("allows replacing a card after editPosition", () => {
    const withCard = selectCardForActivePosition(createSpreadSession("three-advice"), tenCups);
    const editing = editPosition(withCard, "three-situation");
    const replaced = selectCardForActivePosition(editing, moon);

    expect(replaced.cardsByPosition["three-situation"]).toEqual(moon);
    expect(replaced.editingPositionId).toBeUndefined();
  });

  it("cancels editing without losing or replacing the card", () => {
    const withCard = selectCardForActivePosition(createSpreadSession("three-advice"), tenCups);
    const editing = editPosition(withCard, "three-situation");
    const canceled = cancelEditPosition(editing);
    const blocked = selectCardForActivePosition(canceled, moon);

    expect(canceled.editingPositionId).toBeUndefined();
    expect(canceled.cardsByPosition["three-situation"]).toEqual(tenCups);
    expect(blocked.cardsByPosition["three-situation"]).toEqual(tenCups);
  });

  it("clears one position", () => {
    const first = selectCardForActivePosition(createSpreadSession("three-advice"), tenCups);
    const second = selectCardForActivePosition(first, moon);
    const cleared = clearPosition(second, "three-situation");

    expect(cleared.cardsByPosition["three-situation"]).toBeUndefined();
    expect(cleared.cardsByPosition["three-influence"]).toEqual(moon);
    expect(cleared.activePositionId).toBe("three-situation");
  });

  it("clears the whole spread session", () => {
    const first = selectCardForActivePosition(createSpreadSession("three-advice"), tenCups);
    const second = selectCardForActivePosition(first, moon);
    const cleared = clearSession(second);

    expect(cleared.cardsByPosition).toEqual({});
    expect(cleared.activePositionId).toBe("three-situation");
  });

  it("keeps cards and recomputes readings when question type changes", () => {
    const withCard = selectCardForActivePosition(createSpreadSession("three-advice", "relationships"), moon);
    const relationshipReading = composeSpreadSessionReadings(withCard)[0].reading.summary;
    const careerSession = changeSessionQuestionType(withCard, "career");
    const careerReading = composeSpreadSessionReadings(careerSession)[0].reading.summary;

    expect(careerSession.cardsByPosition["three-situation"]).toEqual(moon);
    expect(careerReading).not.toBe(relationshipReading);
  });

  it("returns a reading for every filled position", () => {
    const first = selectCardForActivePosition(createSpreadSession("three-advice"), tenCups);
    const second = selectCardForActivePosition(first, moon);
    const third = selectCardForActivePosition(second, sevenSwords);
    const readings = composeSpreadSessionReadings(third);

    expect(readings).toHaveLength(3);
    expect(readings.map((item) => item.positionId)).toEqual(["three-situation", "three-influence", "three-direction"]);
  });

  it("changes summary title from intermediate to final when all required positions are filled", () => {
    let session = createSpreadSession("past-present-future");

    session = selectCardForActivePosition(session, tenCups);
    expect(composeSpreadSummary(session).title).toBe("Промежуточный вывод");

    session = selectCardForActivePosition(session, moon);
    session = selectCardForActivePosition(session, sevenSwords);

    expect(composeSpreadSummary(session).title).toBe("Итог расклада");
  });

  it("keeps spread summary compact without full reading summaries", () => {
    const first = selectCardForActivePosition(createSpreadSession("three-advice"), tenCups);
    const second = selectCardForActivePosition(first, moon);
    const readings = composeSpreadSessionReadings(second);
    const summary = composeSpreadSummary(second);

    expect(summary.text).toContain("Заполнено: 2/4");
    expect(summary.text).toContain("Линия:");
    expect(summary.text).toContain("Акцент:");
    expect(summary.text).toContain("Фраза:");
    expect(summary.text).toContain(readings[0].reading.cardName);
    expect(summary.text).toContain(readings[1].reading.cardName);
    expect(summary.focus.length).toBeGreaterThan(0);
    expect(summary.line).toHaveLength(2);
    expect(summary.speechPhrase.length).toBeGreaterThan(0);
    expect(summary.speechPhrase).toContain(readings[0].reading.shortMeaning);
    expect(summary.speechPhrase).not.toContain("Похоже, сейчас главная тема");
    expect(summary.text).not.toContain(readings[0].reading.summary);
    expect(summary.text.length).toBeLessThan(700);
  });

  it("adds advice as a short separate line when advice position is filled", () => {
    let session = createSpreadSession("three-advice");

    session = selectCardForActivePosition(session, tenCups);
    session = selectCardForActivePosition(session, moon);
    session = selectCardForActivePosition(session, sevenSwords);
    session = selectCardForActivePosition(session, defaultEightCups);

    const summary = composeSpreadSummary(session);

    expect(summary.title).toBe("Итог расклада");
    expect(summary.advice).toContain("8");
    expect(summary.text).toContain("Совет:");
  });
});
