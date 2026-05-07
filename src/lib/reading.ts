import { getCourt } from "../data/court";
import { getMajor } from "../data/majors";
import { getPositionLens } from "../data/positionLenses";
import { getQuestionType } from "../data/questionTypes";
import { getRank } from "../data/ranks";
import { getSpreadLayout } from "../data/spreadLayouts";
import { getSuit } from "../data/suits";
import type { QuestionTypeId, ReadingInput, ReadingResult } from "../types";

interface ReadingOverride {
  summary: string;
  shortMeaning?: string;
  verbs?: string[];
  phrases?: string[];
  attention?: string;
  avoid?: string;
}

const readingOverrides: Record<string, ReadingOverride> = {
  "career:career-energy:career:minor:cups:ten": {
    summary:
      "10 Кубков в этой позиции можно читать так: тебя оживляет работа с людьми, ощущение своего круга, эмоциональная отдача и чувство, что результат радует не только тебя.",
    shortMeaning: "работа с людьми, свой круг и эмоциональная отдача",
    verbs: ["объединять", "поддерживать", "радовать", "сближать"],
    phrases: [
      "Тебя оживляет работа с людьми и ощущение своего круга.",
      "В работе тебе важна эмоциональная отдача и чувство общей радости.",
      "Эта карта даёт опору для роли, где ты создаёшь тёплый результат для группы.",
    ],
    attention: "ищи формат, где есть живой отклик, команда, аудитория или сообщество",
    avoid: "не сводить карту к абстрактному «делай людей счастливыми» без конкретной роли и условий",
  },
  "two-options:two-risk:choice:minor:cups:ten": {
    summary:
      "10 Кубков в позиции риска говорит, что можно идеализировать красивую картинку, ожидать идеального результата и не заметить практические детали.",
    shortMeaning: "идеальная картинка вместо практических деталей",
    verbs: ["идеализировать", "ожидать", "сравнивать", "проверять"],
    phrases: [
      "Риск в том, что красивая картинка может выглядеть убедительнее фактов.",
      "Важно проверить, не покупаешь ли ты обещание идеальной гармонии.",
      "Перед решением стоит увидеть практические условия, а не только счастливый финал.",
    ],
    attention: "сверь ожидания с ресурсами, сроками, обязанностями и реальными договорённостями",
    avoid: "не читать риск как запрет на радость; речь о проверке идеализации",
  },
  "*:*:relationships:major:moon": {
    summary:
      "Луна в вопросе отношений показывает скрытые чувства, страхи, неясность, фантазии и необходимость бережного прояснения.",
    shortMeaning: "скрытые чувства, страхи и неясность",
    verbs: ["чувствовать", "прояснять", "замечать", "проверять"],
    phrases: [
      "В отношениях Луна говорит о неясности и скрытом эмоциональном слое.",
      "Здесь важно отличить интуицию от страха.",
      "Лучше прояснять мягко, не додумывая за другого человека.",
    ],
    attention: "смотри на страхи, фантазии, недосказанность и потребность в ясном разговоре",
    avoid: "не утверждай подозрения как факт и не усиливай тревогу",
  },
  "*:*:career:major:moon": {
    summary:
      "Луна в вопросе профессии указывает на работу с неочевидным: диагностику, психологию, исследование, творчество и скрытые мотивы.",
    shortMeaning: "диагностика, творчество и скрытые мотивы",
    verbs: ["исследовать", "диагностировать", "чувствовать", "раскрывать"],
    phrases: [
      "В работе Луна может говорить о задачах, где нужно видеть скрытый слой.",
      "Это может быть диагностика, психология, исследование или творчество.",
      "Важно проверять туманные условия и не идти только за фантазией.",
    ],
    attention: "отмечай неясные условия, скрытые мотивы и способность работать с тонким материалом",
    avoid: "не читать Луну как запрет на профессию; это указание на туман и глубину",
  },
  "*:*:forecast:major:moon": {
    summary:
      "Луна в вопросе прогноза говорит: пока не всё видно, условия могут быть туманными, и окончательный вывод лучше не делать слишком рано.",
    shortMeaning: "туманные условия и ранний вывод",
    verbs: ["проясняться", "ждать", "проверять", "наблюдать"],
    phrases: [
      "В прогнозе Луна показывает период тумана и неполной информации.",
      "Условия ещё могут измениться или проявиться позже.",
      "Сейчас лучше наблюдать и проверять, чем делать окончательный вывод.",
    ],
    attention: "смотри на неполные данные, страхи, фантазии и отложенную ясность",
    avoid: "не выдавай туманную тенденцию за точное предсказание",
  },
  "*:*:relationships:minor:cups:ten": {
    summary:
      "10 Кубков в вопросе отношений можно читать как гармонию, близость, образ семьи, эмоциональную полноту и желание быть своим кругом.",
    shortMeaning: "гармония, близость и образ семьи",
    verbs: ["сближаться", "радоваться", "объединять", "поддерживать"],
    phrases: [
      "В отношениях 10 Кубков говорит о стремлении к гармонии и эмоциональной полноте.",
      "Здесь важен образ семьи, круга или безопасного эмоционального пространства.",
      "Карта даёт фразу про близость, которая хочется разделить.",
    ],
    attention: "проверь, это живое чувство близости или ожидание идеальной картинки",
    avoid: "не обещай вечную гармонию без разговора, выбора и реальных действий",
  },
};

const minorShortMeanings: Partial<Record<string, string>> = {
  "cups:eight": "уход от того, что не наполняет",
  "cups:ten": "эмоциональная полнота и свой круг",
  "cups:seven": "варианты, фантазии и риск распыления",
};

const courtShortMeanings: Partial<Record<string, string>> = {
  "pentacles:page": "практический шаг, навык и обучение",
};

export function composeReading(input: ReadingInput): ReadingResult {
  const spread = requireData(getSpreadLayout(input.spreadId), `Unknown spread layout: ${input.spreadId}`);
  const questionType = requireData(getQuestionType(input.questionTypeId), `Unknown question type: ${input.questionTypeId}`);
  const position = requireData(
    spread.positions.find((item) => item.id === input.positionId),
    `Unknown position: ${input.positionId}`,
  );
  const positionLens = requireData(getPositionLens(position.role), `Unknown position role: ${position.role}`);
  const cardBase = buildCardReading(input, questionType.id);
  const override = findOverride(input);
  const orientation = orientationText(input.orientation);

  const summaryCore = override?.summary ?? [
    cardBase.summary,
    `Позиция «${position.title}» добавляет линзу: ${positionLens.summary.toLowerCase()}`,
    `Тип вопроса «${questionType.title}» просит искать: ${questionType.readingFocus.join(", ")}.`,
  ].join(" ");

  const summary =
    input.orientation === "reversed"
      ? `${summaryCore} В перевёрнутом положении сначала ищи блок, перекос или задержку качества: тема есть, но проявляется не напрямую.`
      : summaryCore;

  const verbs = uniqueWords([
    ...(override?.verbs ?? []),
    ...cardBase.verbs,
    ...positionLens.verbs,
    ...questionType.verbs,
  ]).slice(0, 14);

  const phrases = (
    override?.phrases ??
    buildPhrases(cardBase.cardName, questionType.starterPhrases, positionLens.phrases, position.title)
  ).slice(0, 5);

  const attention = [
    override?.attention ??
      `${position.description}. ${positionLens.attention}. В типе вопроса важно: ${questionType.readingFocus.slice(0, 3).join(", ")}.`,
    orientation.attention,
  ]
    .filter(Boolean)
    .join(" ");

  const avoid = [
    override?.avoid ?? `${positionLens.avoid}. ${questionType.avoid.join("; ")}.`,
    orientation.avoid,
  ]
    .filter(Boolean)
    .join(" ");

  return {
    cardName: cardBase.cardName,
    shortMeaning: override?.shortMeaning ?? cardBase.shortMeaning,
    spreadTitle: spread.title,
    questionTitle: questionType.title,
    positionTitle: position.title,
    summary,
    verbs,
    phrases,
    attention,
    avoid,
    parts: [
      `База карты: ${cardBase.parts.join(" ")}`,
      `Позиция: ${position.title} — ${position.description}.`,
      `Линза позиции: ${positionLens.summary}`,
      `Тип вопроса: ${questionType.description}`,
      `Позитивные карты: ${questionType.positiveCards}.`,
      `Напряжённые карты: ${questionType.tenseCards}.`,
      orientation.part,
    ],
  };
}

function buildCardReading(input: ReadingInput, questionTypeId: QuestionTypeId) {
  if (input.card.type === "minor") {
    const suit = requireData(getSuit(input.card.suitId), `Unknown suit: ${input.card.suitId}`);
    const rank = requireData(getRank(input.card.rankId), `Unknown rank: ${input.card.rankId}`);
    const cardName = `${rank.label} ${suit.genitive}`;

    return {
      cardName,
      shortMeaning:
        minorShortMeanings[`${suit.id}:${rank.id}`] ?? `${rank.shortMeaning} через ${suit.shortMeaning.toLowerCase()}`,
      verbs: [...suit.verbs, ...rank.verbs],
      summary:
        `${cardName} соединяет сферу «${suit.base}» и стадию «${rank.key}». ` +
        `Для этого типа вопроса масть подсказывает: ${suit.questionHints[questionTypeId]}. ` +
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
      shortMeaning:
        courtShortMeanings[`${suit.id}:${court.id}`] ?? `${court.shortMeaning} в теме ${suit.shortMeaning.toLowerCase()}`,
      verbs: [...suit.verbs, ...court.verbs],
      summary:
        `${cardName} соединяет масть «${suit.name}» и роль «${court.role}». ` +
        `В отношениях это может быть: ${court.relationships}. В работе: ${court.work}.`,
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
    shortMeaning: major.shortMeaning,
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

function findOverride(input: ReadingInput): ReadingOverride | undefined {
  const keys = [
    buildOverrideKey(input, input.spreadId, input.positionId),
    buildOverrideKey(input, input.spreadId, "*"),
    buildOverrideKey(input, "*", input.positionId),
    buildOverrideKey(input, "*", "*"),
  ];

  return keys.map((key) => readingOverrides[key]).find(Boolean);
}

function buildOverrideKey(input: ReadingInput, spreadId: string, positionId: string): string {
  if (input.card.type === "minor") {
    return `${spreadId}:${positionId}:${input.questionTypeId}:minor:${input.card.suitId}:${input.card.rankId}`;
  }

  if (input.card.type === "court") {
    return `${spreadId}:${positionId}:${input.questionTypeId}:court:${input.card.suitId}:${input.card.courtId}`;
  }

  return `${spreadId}:${positionId}:${input.questionTypeId}:major:${input.card.majorId}`;
}

function buildPhrases(cardName: string, starterPhrases: string[], positionPhrases: string[], positionTitle: string) {
  return [
    `${starterPhrases[0] ?? "Эту карту можно читать как"} ${cardName.toLowerCase()}.`,
    `${positionPhrases[0] ?? "В этой позиции важна тема"}: «${positionTitle}».`,
    starterPhrases[1] ?? "Похоже, здесь важно сначала назвать главный смысл карты.",
    starterPhrases[2] ?? "Эта карта даёт опору для спокойной интерпретации.",
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
