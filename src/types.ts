export type SpreadId = "career" | "relationships" | "choice" | "day";

export type PositionLensId =
  | "energy"
  | "format"
  | "block"
  | "advice"
  | "self"
  | "other"
  | "connection"
  | "hidden"
  | "pull"
  | "resistance"
  | "risk"
  | "potential"
  | "dayEnergy"
  | "challenge"
  | "resource";

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

export interface SpreadPosition {
  id: string;
  title: string;
  lensId: PositionLensId;
  shows: string;
  verbs: string[];
  phrases: string[];
  attention: string;
  avoid: string;
}

export interface Spread {
  id: SpreadId;
  title: string;
  exampleQuestion: string;
  description: string;
  contextLens: string;
  positions: SpreadPosition[];
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
  spreadHints: Record<SpreadId, string>;
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

export interface PositionMeaning {
  id: PositionLensId;
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

export type ReadingCard =
  | { type: "minor"; suitId: SuitId; rankId: RankId }
  | { type: "court"; suitId: SuitId; courtId: CourtId }
  | { type: "major"; majorId: MajorId };

export interface ReadingInput {
  spreadId: SpreadId;
  positionId: string;
  orientation: Orientation;
  card: ReadingCard;
}

export interface ReadingResult {
  cardName: string;
  spreadTitle: string;
  positionTitle: string;
  summary: string;
  verbs: string[];
  phrases: string[];
  attention: string;
  avoid: string;
  parts: string[];
}
