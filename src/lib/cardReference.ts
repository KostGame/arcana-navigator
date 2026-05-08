import { courtCards } from "../data/court";
import { majors } from "../data/majors";
import { ranks } from "../data/ranks";
import { suits } from "../data/suits";
import type {
  CourtId,
  CourtMeaning,
  MajorArcana,
  PositionCardSelection,
  RankId,
  RankMeaning,
  SuitId,
  SuitMeaning,
} from "../types";

export type CardReferenceFilter =
  | "all"
  | "major"
  | "minor"
  | "court"
  | SuitId
  | `rank-${RankId}`
  | `court-${CourtId}`;
export type CardReferenceKind = "major" | "minor" | "court" | "suit" | "rank";

export interface CardReferenceFilterOption {
  id: CardReferenceFilter;
  label: string;
  ariaLabel: string;
  title: string;
}

export interface CardReferenceEntry {
  id: string;
  kind: CardReferenceKind;
  filter: CardReferenceFilter;
  filters: CardReferenceFilter[];
  title: string;
  shortMeaning: string;
  verbs: string[];
  summary: string;
  plus?: string;
  minus?: string;
  advice?: string;
  attention?: string;
  avoid?: string;
  build?: string;
  archetype?: string;
  stage?: string;
  selection?: Pick<PositionCardSelection, "cardKind" | "card">;
}

const minorShortMeanings: Partial<Record<string, string>> = {
  "cups:eight": "уход от того, что не наполняет",
  "cups:ten": "эмоциональная полнота и свой круг",
  "cups:seven": "варианты, фантазии и риск распыления",
};

const courtShortMeanings: Partial<Record<string, string>> = {
  "pentacles:page": "практический шаг, навык и обучение",
};

export const cardReferenceFilterGroups: Array<{ title: string; options: CardReferenceFilterOption[] }> = [
  {
    title: "Тип",
    options: [
      { id: "all", label: "Все", ariaLabel: "Показать все записи", title: "Все" },
      { id: "major", label: "★", ariaLabel: "Показать старшие арканы", title: "Старшие арканы" },
      { id: "minor", label: "◆", ariaLabel: "Показать младшие карты", title: "Младшие карты" },
      { id: "court", label: "♛", ariaLabel: "Показать придворные карты", title: "Придворные карты" },
    ],
  },
  {
    title: "Масть",
    options: [
      { id: "wands", label: "Ж", ariaLabel: "Показать Жезлы", title: "Жезлы" },
      { id: "cups", label: "К", ariaLabel: "Показать Кубки", title: "Кубки" },
      { id: "swords", label: "М", ariaLabel: "Показать Мечи", title: "Мечи" },
      { id: "pentacles", label: "П", ariaLabel: "Показать Пентакли", title: "Пентакли" },
    ],
  },
  {
    title: "Ранг",
    options: [
      { id: "rank-ace", label: "Туз", ariaLabel: "Показать Тузы", title: "Туз" },
      { id: "rank-two", label: "2", ariaLabel: "Показать двойки", title: "2" },
      { id: "rank-three", label: "3", ariaLabel: "Показать тройки", title: "3" },
      { id: "rank-four", label: "4", ariaLabel: "Показать четвёрки", title: "4" },
      { id: "rank-five", label: "5", ariaLabel: "Показать пятёрки", title: "5" },
      { id: "rank-six", label: "6", ariaLabel: "Показать шестёрки", title: "6" },
      { id: "rank-seven", label: "7", ariaLabel: "Показать семёрки", title: "7" },
      { id: "rank-eight", label: "8", ariaLabel: "Показать восьмёрки", title: "8" },
      { id: "rank-nine", label: "9", ariaLabel: "Показать девятки", title: "9" },
      { id: "rank-ten", label: "10", ariaLabel: "Показать десятки", title: "10" },
      { id: "court-page", label: "Пж", ariaLabel: "Показать Пажей", title: "Паж" },
      { id: "court-knight", label: "Рц", ariaLabel: "Показать Рыцарей", title: "Рыцарь" },
      { id: "court-queen", label: "Крл", ariaLabel: "Показать Королев", title: "Королева" },
      { id: "court-king", label: "Кр", ariaLabel: "Показать Королей", title: "Король" },
    ],
  },
];

export const cardReferenceFilters = cardReferenceFilterGroups.flatMap((group) => group.options);

export function buildCardReferenceEntries(): CardReferenceEntry[] {
  return [
    ...majors.map(majorEntry),
    ...suits.flatMap((suit) => ranks.map((rank) => minorEntry(suit, rank))),
    ...suits.flatMap((suit) => courtCards.map((court) => courtEntry(suit, court))),
    ...suits.map(suitEntry),
    ...ranks.map(rankEntry),
  ];
}

export function filterCardReferenceEntries(
  entries: CardReferenceEntry[],
  filter: CardReferenceFilter,
  query: string,
) {
  const normalizedQuery = normalize(query);

  return entries.filter((entry) => {
    const matchesFilter = filter === "all" || entry.filters.includes(filter);
    const matchesQuery = !normalizedQuery || searchText(entry).includes(normalizedQuery);
    return matchesFilter && matchesQuery;
  });
}

function majorEntry(major: MajorArcana): CardReferenceEntry {
  return {
    id: `major-${major.id}`,
    kind: "major",
    filter: "major",
    filters: ["major"],
    title: `${major.number} ${major.name}`,
    shortMeaning: major.shortMeaning,
    verbs: major.verbs,
    summary: `${major.name} — ${major.archetype}. В плюсе: ${major.plus}. В минусе: ${major.minus}.`,
    plus: major.plus,
    minus: major.minus,
    advice: major.advice,
    attention: major.energy,
    avoid: major.obstacle,
    archetype: major.archetype,
    selection: {
      cardKind: "major",
      card: { type: "major", majorId: major.id },
    },
  };
}

function minorEntry(suit: SuitMeaning, rank: RankMeaning): CardReferenceEntry {
  const title = `${rank.label} ${suit.genitive}`;

  return {
    id: `minor-${suit.id}-${rank.id}`,
    kind: "minor",
    filter: suit.id,
    filters: ["minor", suit.id, `rank-${rank.id}`],
    title,
    shortMeaning: minorShortMeanings[`${suit.id}:${rank.id}`] ?? `${rank.shortMeaning} через ${suit.shortMeaning.toLowerCase()}`,
    verbs: unique([...suit.verbs.slice(0, 3), ...rank.verbs]),
    summary: `${title} соединяет масть «${suit.name}» и достоинство «${rank.label}».`,
    plus: suit.plus,
    minus: suit.minus,
    advice: rank.advice,
    attention: rank.energy,
    avoid: rank.obstacle,
    build: `Масть: ${suit.shortMeaning}. Достоинство: ${rank.shortMeaning}.`,
    selection: {
      cardKind: "minor",
      card: { type: "minor", suitId: suit.id, rankId: rank.id },
    },
  };
}

function courtEntry(suit: SuitMeaning, court: CourtMeaning): CardReferenceEntry {
  const title = `${court.name} ${suit.genitive}`;

  return {
    id: `court-${suit.id}-${court.id}`,
    kind: "court",
    filter: "court",
    filters: ["court", suit.id, `court-${court.id}`],
    title,
    shortMeaning: courtShortMeanings[`${suit.id}:${court.id}`] ?? `${court.shortMeaning} в теме ${suit.shortMeaning.toLowerCase()}`,
    verbs: unique([...court.verbs, ...suit.verbs.slice(0, 2)]),
    summary: `${title} соединяет масть «${suit.name}» и роль «${court.name}».`,
    plus: court.work,
    minus: court.minus,
    advice: court.advice,
    attention: court.relationships,
    avoid: "не сводить придворную карту только к конкретному человеку; это может быть роль, стиль поведения или качество",
    build: `Масть: ${suit.shortMeaning}. Роль: ${court.role}.`,
    selection: {
      cardKind: "court",
      card: { type: "court", suitId: suit.id, courtId: court.id },
    },
  };
}

function suitEntry(suit: SuitMeaning): CardReferenceEntry {
  return {
    id: `suit-${suit.id}`,
    kind: "suit",
    filter: suit.id,
    filters: [suit.id],
    title: suit.name,
    shortMeaning: suit.shortMeaning,
    verbs: suit.verbs,
    summary: suit.base,
    plus: suit.plus,
    minus: suit.minus,
    advice: suit.advice,
    avoid: suit.risk,
  };
}

function rankEntry(rank: RankMeaning): CardReferenceEntry {
  return {
    id: `rank-${rank.id}`,
    kind: "rank",
    filter: "all",
    filters: [`rank-${rank.id}`],
    title: rank.label,
    shortMeaning: rank.shortMeaning,
    verbs: rank.verbs,
    summary: rank.stage,
    advice: rank.advice,
    attention: rank.energy,
    avoid: rank.obstacle,
    stage: rank.stage,
  };
}

function searchText(entry: CardReferenceEntry) {
  return normalize(
    [
      entry.title,
      entry.shortMeaning,
      entry.summary,
      entry.plus,
      entry.minus,
      entry.advice,
      entry.attention,
      entry.avoid,
      entry.build,
      entry.archetype,
      entry.stage,
      entry.verbs.join(" "),
    ]
      .filter(Boolean)
      .join(" "),
  );
}

function normalize(value: string) {
  return value.trim().toLocaleLowerCase("ru-RU");
}

function unique(values: string[]) {
  return [...new Set(values)];
}
