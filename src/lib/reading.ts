import { getCourt } from "../data/court";
import { getMajor } from "../data/majors";
import { getPositionMeaning } from "../data/positionMeanings";
import { getRank } from "../data/ranks";
import { getSpread } from "../data/spreads";
import { getSuit } from "../data/suits";
import type { ReadingInput, ReadingResult, SpreadId } from "../types";

interface ReadingOverride {
  summary: string;
  verbs?: string[];
  phrases?: string[];
  attention?: string;
  avoid?: string;
}

const readingOverrides: Record<string, ReadingOverride> = {
  "career:career-energy:minor:cups:ten": {
    summary:
      "10 Кубков в этой позиции можно читать так: тебя оживляет работа с людьми, ощущение своего круга, эмоциональная отдача и чувство, что результат радует не только тебя.",
    verbs: ["объединять", "поддерживать", "радовать", "сближать"],
    phrases: [
      "Тебя оживляет работа с людьми и ощущение своего круга.",
      "В работе тебе важна эмоциональная отдача и чувство общей радости.",
      "Эта карта даёт опору для роли, где ты создаёшь тёплый результат для группы.",
    ],
    attention: "ищи формат, где есть живой отклик, команда, аудитория или сообщество",
    avoid: "не сводить карту к абстрактному «делай людей счастливыми» без конкретной роли и условий",
  },
  "choice:choice-risk:minor:cups:ten": {
    summary:
      "10 Кубков в позиции риска говорит, что ты можешь идеализировать красивую картинку, обещание гармонии или «идеальный финал» и не заметить практические сложности.",
    verbs: ["идеализировать", "ожидать", "сравнивать", "проверять"],
    phrases: [
      "Риск в том, что красивая картинка может выглядеть убедительнее фактов.",
      "Важно проверить, не покупаешь ли ты обещание идеальной гармонии.",
      "Перед решением стоит увидеть практические условия, а не только счастливый финал.",
    ],
    attention: "сверь ожидания с ресурсами, сроками, обязанностями и реальными договорённостями",
    avoid: "не читать риск как запрет на радость; речь о проверке идеализации",
  },
};

export function composeReading(input: ReadingInput): ReadingResult {
  const spread = getSpread(input.spreadId);
  if (!spread) {
    throw new Error(`Unknown spread: ${input.spreadId}`);
  }

  const position = spread.positions.find((item) => item.id === input.positionId);
  if (!position) {
    throw new Error(`Unknown position: ${input.positionId}`);
  }

  const lens = getPositionMeaning(position.lensId);
  if (!lens) {
    throw new Error(`Unknown position lens: ${position.lensId}`);
  }

  const base = buildCardReading(input, spread.id);
  const override = readingOverrides[buildOverrideKey(input)];
  const orientation = orientationText(input.orientation);

  const summaryCore = override?.summary ?? base.summary;
  const summary =
    input.orientation === "reversed"
      ? `${summaryCore} В перевёрнутом положении сначала ищи блок, перекос или задержку качества: тема есть, но проявляется не напрямую.`
      : summaryCore;

  const verbs = uniqueWords([
    ...(override?.verbs ?? []),
    ...position.verbs,
    ...lens.verbs,
    ...base.verbs,
  ]).slice(0, 12);

  const phrases = (override?.phrases ?? buildPhrases(base.cardName, spread.contextLens, position.phrases, lens.phrases)).slice(0, 4);
  const attention = [override?.attention ?? `${position.attention}. ${lens.attention}.`, orientation.attention].filter(Boolean).join(" ");
  const avoid = [override?.avoid ?? `${position.avoid}. ${lens.avoid}.`, orientation.avoid].filter(Boolean).join(" ");

  return {
    cardName: base.cardName,
    spreadTitle: spread.title,
    positionTitle: position.title,
    summary,
    verbs,
    phrases,
    attention,
    avoid,
    parts: [
      spread.contextLens,
      position.shows,
      lens.summary,
      base.parts.join(" "),
      orientation.part,
    ],
  };
}

function buildCardReading(input: ReadingInput, spreadId: SpreadId) {
  if (input.card.type === "minor") {
    const suit = requireData(getSuit(input.card.suitId), `Unknown suit: ${input.card.suitId}`);
    const rank = requireData(getRank(input.card.rankId), `Unknown rank: ${input.card.rankId}`);
    const cardName = `${rank.label} ${suit.genitive}`;

    return {
      cardName,
      verbs: [...suit.verbs, ...rank.verbs],
      summary:
        `${cardName} соединяет сферу «${suit.base}» и стадию «${rank.key}». ` +
        `В этом раскладе масть подсказывает: ${suit.spreadHints[spreadId]}. ` +
        `Достоинство добавляет: ${rank.stage}.`,
      parts: [
        `Масть: ${suit.name} — ${suit.base}.`,
        `Достоинство: ${rank.label} — ${rank.stage}.`,
        `Плюс: ${suit.plus}. Минус: ${suit.minus}.`,
      ],
    };
  }

  if (input.card.type === "court") {
    const suit = requireData(getSuit(input.card.suitId), `Unknown suit: ${input.card.suitId}`);
    const court = requireData(getCourt(input.card.courtId), `Unknown court card: ${input.card.courtId}`);
    const cardName = `${court.name} ${suit.genitive}`;

    return {
      cardName,
      verbs: [...suit.verbs, ...court.verbs],
      summary:
        `${cardName} соединяет масть «${suit.name}» и роль «${court.role}». ` +
        `В работе это может быть: ${court.work}. В отношениях: ${court.relationships}.`,
      parts: [
        `Масть: ${suit.name} — ${suit.base}.`,
        `Роль: ${court.name} — ${court.maturity}.`,
        `Минус роли: ${court.minus}.`,
      ],
    };
  }

  const major = requireData(getMajor(input.card.majorId), `Unknown major arcana: ${input.card.majorId}`);

  return {
    cardName: `${major.number} ${major.name}`,
    verbs: major.verbs,
    summary:
      `${major.name} — архетип «${major.archetype}». ` +
      `В плюсе: ${major.plus}. В минусе: ${major.minus}.`,
    parts: [
      `Энергия: ${major.energy}.`,
      `Формат: ${major.format}.`,
      `Препятствие: ${major.obstacle}.`,
      `Совет: ${major.advice}.`,
    ],
  };
}

function buildOverrideKey(input: ReadingInput): string {
  if (input.card.type === "minor") {
    return `${input.spreadId}:${input.positionId}:minor:${input.card.suitId}:${input.card.rankId}`;
  }

  if (input.card.type === "court") {
    return `${input.spreadId}:${input.positionId}:court:${input.card.suitId}:${input.card.courtId}`;
  }

  return `${input.spreadId}:${input.positionId}:major:${input.card.majorId}`;
}

function buildPhrases(cardName: string, contextLens: string, positionPhrases: string[], lensPhrases: string[]) {
  const firstPositionPhrase = positionPhrases[0] ?? "Эту карту можно читать как";
  const firstLensPhrase = lensPhrases[0] ?? "здесь важна тема";

  return [
    `${firstPositionPhrase} ${cardName.toLowerCase()}.`,
    `Похоже, ${firstLensPhrase} через эту карту.`,
    `В контексте расклада: ${contextLens}`,
  ];
}

function orientationText(orientation: ReadingInput["orientation"]) {
  if (orientation === "reversed") {
    return {
      part: "Ориентация: перевёрнутая карта показывает блок, искажение или качество, которое нужно сначала вернуть в рабочее состояние.",
      attention: "Для перевёрнутой карты спроси: что заблокировано, где качество проявляется чрезмерно или чего не хватает?",
      avoid: "Не трактуй переворот как автоматическое «плохо» или как неизбежный провал.",
    };
  }

  return {
    part: "Ориентация: прямая карта проявляет качество напрямую.",
    attention: "",
    avoid: "",
  };
}

function uniqueWords(words: string[]) {
  return [...new Set(words.map((word) => word.trim()).filter(Boolean))];
}

function requireData<T>(value: T | undefined, message: string): T {
  if (!value) {
    throw new Error(message);
  }

  return value;
}
