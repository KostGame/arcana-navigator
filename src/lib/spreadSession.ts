import { getSpreadLayout } from "../data/spreadLayouts";
import { composeReading } from "./reading";
import type {
  PositionCardSelection,
  QuestionTypeId,
  SpreadLayout,
  SpreadLayoutId,
  SpreadSession,
  SpreadSessionPositionReading,
  SpreadSummary,
} from "../types";

export function createSpreadSession(layoutId: SpreadLayoutId, questionTypeId?: QuestionTypeId): SpreadSession {
  const layout = requireLayout(layoutId);

  return {
    layoutId,
    questionTypeId: questionTypeId ?? layout.defaultQuestionTypeId,
    activePositionId: layout.positions[0].id,
    cardsByPosition: {},
  };
}

export function setActivePosition(session: SpreadSession, positionId: string): SpreadSession {
  const layout = requireLayout(session.layoutId);

  if (!layout.positions.some((position) => position.id === positionId)) {
    return session;
  }

  return {
    ...session,
    activePositionId: positionId,
    editingPositionId: session.editingPositionId === positionId ? positionId : undefined,
  };
}

export function selectCardForActivePosition(
  session: SpreadSession,
  selection: PositionCardSelection,
): SpreadSession {
  const activePositionId = session.activePositionId;
  const hasExistingCard = Boolean(session.cardsByPosition[activePositionId]);
  const canReplace = session.editingPositionId === activePositionId;

  if (hasExistingCard && !canReplace) {
    return session;
  }

  const updated: SpreadSession = {
    ...session,
    cardsByPosition: {
      ...session.cardsByPosition,
      [activePositionId]: selection,
    },
    editingPositionId: undefined,
    lastUpdatedPositionId: activePositionId,
  };

  return moveToNextEmptyPosition(updated);
}

export function editPosition(session: SpreadSession, positionId: string): SpreadSession {
  const layout = requireLayout(session.layoutId);

  if (!layout.positions.some((position) => position.id === positionId)) {
    return session;
  }

  return {
    ...session,
    activePositionId: positionId,
    editingPositionId: positionId,
  };
}

export function cancelEditPosition(session: SpreadSession): SpreadSession {
  return {
    ...session,
    editingPositionId: undefined,
  };
}

export function clearPosition(session: SpreadSession, positionId: string): SpreadSession {
  if (!session.cardsByPosition[positionId]) {
    return session;
  }

  const { [positionId]: _removed, ...cardsByPosition } = session.cardsByPosition;

  return {
    ...session,
    cardsByPosition,
    activePositionId: positionId,
    editingPositionId: undefined,
    lastUpdatedPositionId: positionId,
  };
}

export function clearSession(session: SpreadSession): SpreadSession {
  const layout = requireLayout(session.layoutId);

  return {
    layoutId: session.layoutId,
    questionTypeId: session.questionTypeId,
    activePositionId: layout.positions[0].id,
    cardsByPosition: {},
  };
}

export function changeSessionQuestionType(session: SpreadSession, questionTypeId: QuestionTypeId): SpreadSession {
  return {
    ...session,
    questionTypeId,
    editingPositionId: undefined,
  };
}

export function changeSessionLayout(
  _session: SpreadSession,
  layoutId: SpreadLayoutId,
  questionTypeId?: QuestionTypeId,
): SpreadSession {
  const layout = requireLayout(layoutId);

  return {
    layoutId,
    questionTypeId: questionTypeId ?? layout.defaultQuestionTypeId,
    activePositionId: layout.positions[0].id,
    cardsByPosition: {},
  };
}

export function findNextAvailablePositionId(session: SpreadSession): string | undefined {
  const layout = requireLayout(session.layoutId);

  if (!session.cardsByPosition[session.activePositionId]) {
    return session.activePositionId;
  }

  const currentIndex = layout.positions.findIndex((position) => position.id === session.activePositionId);
  const positionsAfterCurrent = currentIndex >= 0 ? layout.positions.slice(currentIndex + 1) : layout.positions;

  return (
    positionsAfterCurrent.find((position) => !session.cardsByPosition[position.id]) ??
    layout.positions.find((position) => !session.cardsByPosition[position.id])
  )?.id;
}

export function selectCardForAvailablePosition(
  session: SpreadSession,
  selection: PositionCardSelection,
): SpreadSession {
  const targetPositionId = findNextAvailablePositionId(session);

  if (!targetPositionId) {
    return session;
  }

  return selectCardForActivePosition(
    {
      ...session,
      activePositionId: targetPositionId,
      editingPositionId: undefined,
    },
    selection,
  );
}

export function moveToNextEmptyPosition(session: SpreadSession): SpreadSession {
  const layout = requireLayout(session.layoutId);
  const currentIndex = layout.positions.findIndex((position) => position.id === session.activePositionId);
  const positionsAfterCurrent = currentIndex >= 0 ? layout.positions.slice(currentIndex + 1) : layout.positions;
  const nextPosition =
    positionsAfterCurrent.find((position) => !session.cardsByPosition[position.id]) ??
    layout.positions.find((position) => !session.cardsByPosition[position.id]);

  if (!nextPosition) {
    return session;
  }

  return {
    ...session,
    activePositionId: nextPosition.id,
  };
}

export function composeSpreadSessionReadings(session: SpreadSession): SpreadSessionPositionReading[] {
  const layout = requireLayout(session.layoutId);

  return layout.positions
    .map((position) => {
      const selection = session.cardsByPosition[position.id];

      if (!selection) {
        return undefined;
      }

      return {
        positionId: position.id,
        positionTitle: position.title,
        selection,
        reading: composeReading({
          spreadId: session.layoutId,
          questionTypeId: session.questionTypeId,
          positionId: position.id,
          orientation: selection.orientation,
          card: selection.card,
        }),
      };
    })
    .filter((item): item is SpreadSessionPositionReading => Boolean(item));
}

export function composeSpreadSummary(session: SpreadSession): SpreadSummary {
  const layout = requireLayout(session.layoutId);
  const requiredPositions = layout.positions.filter((position) => !position.optional);
  const totalCount = requiredPositions.length;
  const filledRequired = requiredPositions.filter((position) => session.cardsByPosition[position.id]);
  const readings = composeSpreadSessionReadings(session);
  const isComplete = filledRequired.length === totalCount;
  const title = isComplete ? "Итог расклада" : "Промежуточный вывод";

  if (readings.length === 0) {
    return {
      title,
      filledCount: 0,
      totalCount,
      text: `Заполнено: 0/${totalCount}`,
      focus: [],
      line: [],
      speechPhrase: "Выберите карту для первой позиции.",
    };
  }

  const focus = readings.flatMap((item) => item.reading.verbs.slice(0, 2)).filter(unique).slice(0, 8);
  const line = readings.map((item) => `${item.positionTitle} — ${item.reading.cardName}`);
  const speechPhrase = buildSpeechPhrase(readings);
  const adviceReading = readings.find((item) => layout.positions.find((position) => position.id === item.positionId)?.role === "advice");
  const advice = adviceReading
    ? `${adviceReading.reading.cardName}: ${adviceReading.reading.shortMeaning}`
    : undefined;
  const text = `Заполнено: ${filledRequired.length}/${totalCount}. Линия: ${line.join(" · ")}. Акцент: ${focus.slice(0, 5).join(", ")}. Фраза: ${speechPhrase}${advice ? ` Совет: ${advice}` : ""}`;

  return {
    title,
    filledCount: filledRequired.length,
    totalCount,
    text,
    focus,
    line,
    speechPhrase,
    advice,
  };
}

export function hasSessionCards(session: SpreadSession): boolean {
  return Object.keys(session.cardsByPosition).length > 0;
}

function requireLayout(layoutId: SpreadLayoutId): SpreadLayout {
  const layout = getSpreadLayout(layoutId);

  if (!layout) {
    throw new Error(`Unknown spread layout: ${layoutId}`);
  }

  return layout;
}

function unique(value: string, index: number, array: string[]) {
  return array.indexOf(value) === index;
}

function buildSpeechPhrase(readings: SpreadSessionPositionReading[]) {
  const firstThree = readings.slice(0, 3);
  const line = firstThree
    .map((item) => `${item.positionTitle.toLowerCase()} — ${item.reading.shortMeaning}`)
    .join("; ");

  return `Расклад показывает: ${line}.`;
}
