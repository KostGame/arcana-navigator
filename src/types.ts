export type SpreadLayoutId =
  | "day-card"
  | "three-advice"
  | "past-present-future"
  | "situation-resource"
  | "two-options"
  | "relationships"
  | "inner-state"
  | "action"
  | "forecast"
  | "career";

export type SpreadId = SpreadLayoutId;

export type QuestionTypeId =
  | "diagnosis"
  | "relationships"
  | "choice"
  | "action"
  | "forecast"
  | "inner"
  | "career"
  | "day"
  | "money"
  | "learning"
  | "conflict"
  | "creativity";

export type PositionRole =
  | "energy"
  | "format"
  | "obstacle"
  | "resource"
  | "risk"
  | "advice"
  | "outcome"
  | "hidden"
  | "choice"
  | "past"
  | "present"
  | "future"
  | "influence"
  | "self"
  | "other"
  | "connection"
  | "need"
  | "option";

export type SuitId = "wands" | "cups" | "swords" | "pentacles";
export type RankId = "ace" | "two" | "three" | "four" | "five" | "six" | "seven" | "eight" | "nine" | "ten";
export type CourtId = "page" | "knight" | "queen" | "king";
export type MajorId =
  | "fool"
  | "magician"
  | "high-priestess"
  | "empress"
  | "emperor"
  | "hierophant"
  | "lovers"
  | "chariot"
  | "strength"
  | "hermit"
  | "wheel"
  | "justice"
  | "hanged-man"
  | "death"
  | "temperance"
  | "devil"
  | "tower"
  | "star"
  | "moon"
  | "sun"
  | "judgement"
  | "world";

export type Orientation = "upright" | "reversed";
export type CardKind = "minor" | "court" | "major";

export interface SpreadPosition {
  id: string;
  title: string;
  description: string;
  role: PositionRole;
  optional?: boolean;
}

export interface SpreadLayout {
  id: SpreadLayoutId;
  title: string;
  description: string;
  defaultQuestionTypeId: QuestionTypeId;
  positions: SpreadPosition[];
}

export interface QuestionType {
  id: QuestionTypeId;
  title: string;
  description: string;
  verbs: string[];
  readingFocus: string[];
  positiveCards: string;
  tenseCards: string;
  avoid: string[];
  starterPhrases: string[];
}

export interface SuitMeaning {
  id: SuitId;
  name: string;
  genitive: string;
  base: string;
  verbs: string[];
  plus: string;
  minus: string;
  advice: string;
  risk: string;
  questionHints: Record<QuestionTypeId, string>;
}

export interface RankMeaning {
  id: RankId;
  label: string;
  key: string;
  stage: string;
  verbs: string[];
  energy: string;
  format: string;
  obstacle: string;
  advice: string;
}

export interface CourtMeaning {
  id: CourtId;
  name: string;
  role: string;
  maturity: string;
  verbs: string[];
  relationships: string;
  work: string;
  advice: string;
  minus: string;
}

export interface MajorArcana {
  id: MajorId;
  number: string;
  name: string;
  archetype: string;
  verbs: string[];
  plus: string;
  minus: string;
  energy: string;
  format: string;
  obstacle: string;
  advice: string;
}

export interface PositionLens {
  role: PositionRole;
  title: string;
  summary: string;
  suitPrompt: string;
  rankPrompt: string;
  courtPrompt: string;
  majorPrompt: string;
  verbs: string[];
  phrases: string[];
  attention: string;
  avoid: string;
}

export type PositionMeaning = PositionLens;

export type ReadingCard =
  | { type: "minor"; suitId: SuitId; rankId: RankId }
  | { type: "court"; suitId: SuitId; courtId: CourtId }
  | { type: "major"; majorId: MajorId };

export interface ReadingInput {
  spreadId: SpreadLayoutId;
  questionTypeId: QuestionTypeId;
  positionId: string;
  orientation: Orientation;
  card: ReadingCard;
}

export interface ReadingResult {
  cardName: string;
  spreadTitle: string;
  questionTitle: string;
  positionTitle: string;
  summary: string;
  verbs: string[];
  phrases: string[];
  attention: string;
  avoid: string;
  parts: string[];
}

export interface PositionCardSelection {
  cardKind: CardKind;
  card: ReadingCard;
  orientation: Orientation;
}

export interface SpreadSession {
  layoutId: SpreadLayoutId;
  questionTypeId: QuestionTypeId;
  activePositionId: string;
  cardsByPosition: Record<string, PositionCardSelection>;
  editingPositionId?: string;
  lastUpdatedPositionId?: string;
}

export interface SpreadSessionPositionReading {
  positionId: string;
  positionTitle: string;
  selection: PositionCardSelection;
  reading: ReadingResult;
}

export interface SpreadSummary {
  title: "Промежуточный вывод" | "Итог расклада";
  filledCount: number;
  totalCount: number;
  text: string;
  focus: string[];
}
