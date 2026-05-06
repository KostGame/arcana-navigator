import type { SpreadLayout } from "../types";

export const spreadLayouts: SpreadLayout[] = [
  {
    id: "day-card",
    title: "Карта дня",
    description: "Одна основная карта для фокуса дня и опциональная карта совета.",
    defaultQuestionTypeId: "day",
    positions: [
      { id: "day-main-energy", title: "Главная энергия дня", description: "главный тон и тема ближайшего времени", role: "energy" },
      { id: "day-advice", title: "Совет дня", description: "мягкий шаг или настрой на день", role: "advice", optional: true },
    ],
  },
  {
    id: "three-advice",
    title: "3 карты + совет",
    description: "Универсальная схема: суть, влияние, направление и практический совет.",
    defaultQuestionTypeId: "diagnosis",
    positions: [
      { id: "three-situation", title: "Суть ситуации", description: "что является центром вопроса", role: "present" },
      { id: "three-influence", title: "Что влияет", description: "фон, причина или внешний фактор", role: "influence" },
      { id: "three-direction", title: "Куда ведёт", description: "вероятное направление при текущей динамике", role: "future" },
      { id: "three-advice", title: "Совет", description: "бережный следующий шаг", role: "advice" },
    ],
  },
  {
    id: "past-present-future",
    title: "Прошлое / настоящее / будущее",
    description: "Короткая временная линия для понимания развития темы.",
    defaultQuestionTypeId: "forecast",
    positions: [
      { id: "ppf-past", title: "Что привело к ситуации", description: "исток и уже действующий опыт", role: "past" },
      { id: "ppf-present", title: "Что происходит сейчас", description: "активная тема настоящего", role: "present" },
      { id: "ppf-future", title: "Куда развивается", description: "вероятное направление движения", role: "future" },
    ],
  },
  {
    id: "situation-resource",
    title: "Ситуация / препятствие / ресурс / совет",
    description: "Практичная схема для диагностики сложности и опоры.",
    defaultQuestionTypeId: "diagnosis",
    positions: [
      { id: "sr-situation", title: "Суть ситуации", description: "главная тема и состояние вопроса", role: "present" },
      { id: "sr-obstacle", title: "Препятствие", description: "что мешает или искажает процесс", role: "obstacle" },
      { id: "sr-resource", title: "Ресурс", description: "что поддерживает и помогает", role: "resource" },
      { id: "sr-advice", title: "Совет", description: "первый устойчивый шаг", role: "advice" },
    ],
  },
  {
    id: "two-options",
    title: "Выбор из двух вариантов",
    description: "Сравнение двух путей без давления на единственно правильный ответ.",
    defaultQuestionTypeId: "choice",
    positions: [
      { id: "two-choice-core", title: "Суть выбора", description: "главная развилка и критерий решения", role: "choice" },
      { id: "two-option-a", title: "Вариант А", description: "качество и потенциал первого пути", role: "option" },
      { id: "two-option-b", title: "Вариант Б", description: "качество и потенциал второго пути", role: "option" },
      { id: "two-risk", title: "Риск", description: "слабое место выбора", role: "risk" },
      { id: "two-advice", title: "Совет", description: "как выбрать спокойнее", role: "advice" },
    ],
  },
  {
    id: "relationships",
    title: "Отношения",
    description: "Контакт, состояние двух сторон, динамика, скрытый фактор и совет.",
    defaultQuestionTypeId: "relationships",
    positions: [
      { id: "rel-self", title: "Я в этих отношениях", description: "моя роль, состояние и вклад", role: "self" },
      { id: "rel-other", title: "Другой человек", description: "возможное состояние и стиль участия другого", role: "other" },
      { id: "rel-between", title: "Что между нами", description: "динамика связи и обмена", role: "connection" },
      { id: "rel-hidden", title: "Скрытый фактор", description: "неочевидный фон контакта", role: "hidden" },
      { id: "rel-advice", title: "Совет", description: "бережный следующий шаг", role: "advice" },
    ],
  },
  {
    id: "inner-state",
    title: "Внутреннее состояние",
    description: "Схема для мягкого самоанализа и поиска поддержки.",
    defaultQuestionTypeId: "inner",
    positions: [
      { id: "inner-feeling", title: "Что я чувствую", description: "актуальный эмоциональный слой", role: "present" },
      { id: "inner-hidden", title: "Что я не замечаю", description: "слепая зона или вытесненная тема", role: "hidden" },
      { id: "inner-need", title: "Что мне нужно", description: "потребность и ресурс", role: "need" },
      { id: "inner-help", title: "Как себе помочь", description: "бережный способ поддержки", role: "advice" },
    ],
  },
  {
    id: "action",
    title: "Действие",
    description: "Сравнение сценария действия, паузы, риска и первого шага.",
    defaultQuestionTypeId: "action",
    positions: [
      { id: "act-if", title: "Что будет, если действовать", description: "динамика активного шага", role: "future" },
      { id: "act-if-not", title: "Что будет, если не действовать", description: "динамика паузы или отказа", role: "outcome" },
      { id: "act-risk", title: "Главный риск", description: "что важно не усилить", role: "risk" },
      { id: "act-step", title: "Лучший первый шаг", description: "минимальное действие для проверки", role: "advice" },
    ],
  },
  {
    id: "forecast",
    title: "Прогноз",
    description: "Мягкий прогноз тенденции без обещания неизбежного исхода.",
    defaultQuestionTypeId: "forecast",
    positions: [
      { id: "forecast-current", title: "Текущая энергия", description: "из какого состояния развивается тема", role: "energy" },
      { id: "forecast-near", title: "Ближайшее развитие", description: "что может проявиться первым", role: "future" },
      { id: "forecast-obstacle", title: "Возможное препятствие", description: "где потребуется осторожность", role: "obstacle" },
      { id: "forecast-result", title: "Возможный результат", description: "вероятный итог при текущей динамике", role: "outcome" },
      { id: "forecast-advice", title: "Совет", description: "как пройти период осознаннее", role: "advice" },
    ],
  },
  {
    id: "career",
    title: "Профессия и призвание",
    description: "Энергия, формат работы, нежелательный сценарий и первый шаг.",
    defaultQuestionTypeId: "career",
    positions: [
      { id: "career-energy", title: "Что даёт энергию", description: "что оживляет, где появляется интерес и ощущение своего места", role: "energy" },
      { id: "career-format", title: "Комфортный формат", description: "какая рабочая среда, роль и темп подходят лучше", role: "format" },
      { id: "career-block", title: "Куда не идти", description: "сценарий, который будет забирать силы", role: "obstacle" },
      { id: "career-advice", title: "Совет", description: "первый проверочный шаг и внутренняя позиция", role: "advice" },
    ],
  },
];

export function getSpreadLayout(spreadId: string): SpreadLayout | undefined {
  return spreadLayouts.find((spread) => spread.id === spreadId);
}
