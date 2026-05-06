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
  selectCardForActivePosition,
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
});
