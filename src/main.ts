import "./styles.css";
import { courtCards } from "./data/court";
import { majors } from "./data/majors";
import { questionTypes } from "./data/questionTypes";
import { ranks } from "./data/ranks";
import { spreadLayouts } from "./data/spreadLayouts";
import { suits } from "./data/suits";
import { composeReading } from "./lib/reading";
import {
  cancelEditPosition,
  changeSessionLayout,
  changeSessionQuestionType,
  clearPosition,
  clearSession,
  composeSpreadSessionReadings,
  composeSpreadSummary,
  createSpreadSession,
  editPosition,
  hasSessionCards,
  selectCardForActivePosition,
  setActivePosition,
} from "./lib/spreadSession";
import type {
  CardKind,
  CourtId,
  MajorId,
  Orientation,
  PositionCardSelection,
  QuestionTypeId,
  RankId,
  ReadingCard,
  SpreadLayout,
  SpreadLayoutId,
  SpreadSession,
  SuitId,
} from "./types";

type AppMode = "quick" | "session";
type PickerCommitMode = "none" | "card" | "orientation";

interface CardPickerState {
  cardKind: CardKind;
  suitId: SuitId;
  rankId: RankId;
  courtId: CourtId;
  majorId: MajorId;
  orientation: Orientation;
}

interface QuickState extends CardPickerState {
  spreadId: SpreadLayoutId;
  questionTypeId: QuestionTypeId;
  positionId: string;
}

interface AppState {
  mode: AppMode;
  quick: QuickState;
  session: SpreadSession;
  sessionPicker: CardPickerState;
}

const defaultPicker: CardPickerState = {
  cardKind: "minor",
  suitId: "cups",
  rankId: "ten",
  courtId: "queen",
  majorId: "sun",
  orientation: "upright",
};

const state: AppState = {
  mode: "quick",
  quick: {
    spreadId: "three-advice",
    questionTypeId: "diagnosis",
    positionId: "three-situation",
    ...defaultPicker,
  },
  session: createSpreadSession("three-advice"),
  sessionPicker: { ...defaultPicker },
};

const appRoot = document.querySelector<HTMLDivElement>("#app");

if (!appRoot) {
  throw new Error("App root was not found");
}

const app = appRoot;
let pendingScrollPositionId: string | undefined;

render();

function render() {
  ensureQuickPosition();
  ensureSessionPosition();

  app.innerHTML = `
    <main class="shell">
      <header class="hero">
        <div>
          <p class="eyebrow">Arcana Navigator</p>
          <h1>Навигатор раскладов Таро</h1>
          <p class="lead">Выберите расклад, позицию и карту. Сначала — фраза для живого чтения, детали — ниже.</p>
        </div>
        <div class="hero-note">
          <span>Справочный режим</span>
          <strong>без генерации карт</strong>
        </div>
      </header>

      <nav class="mode-tabs" aria-label="Режим работы">
        <button class="${state.mode === "quick" ? "is-active" : ""}" type="button" data-mode="quick">Быстрый разбор</button>
        <button class="${state.mode === "session" ? "is-active" : ""}" type="button" data-mode="session">Собрать расклад</button>
      </nav>

      ${state.mode === "quick" ? renderQuickMode() : renderSessionMode()}
    </main>
  `;

  wireEvents();
  scrollPendingPositionIntoView();
}

function renderQuickMode() {
  const spread = currentQuickSpread();
  const reading = composeReading({
    spreadId: state.quick.spreadId,
    questionTypeId: state.quick.questionTypeId,
    positionId: state.quick.positionId,
    orientation: state.quick.orientation,
    card: cardFromPicker(state.quick),
  });

  return `
    <section class="layout">
      <div class="workbench">
        <section class="panel quick-panel" aria-labelledby="quick-title">
          <div class="section-head">
            <p class="eyebrow">Быстрый режим</p>
            <h2 id="quick-title">Быстрый разбор карты</h2>
          </div>
          ${renderQuickControls(spread)}
        </section>

        <section class="panel spreads-panel" aria-labelledby="spreads-title">
          <div class="section-head">
            <p class="eyebrow">Расклад</p>
            <h2 id="spreads-title">Позиции выбранного расклада</h2>
            <p>${spread.description}</p>
          </div>
          <div class="position-grid">
            ${spread.positions.map((item) => renderQuickPositionCard(item.id, item.title, item.description, item.optional)).join("")}
          </div>
        </section>

        ${renderReference()}
      </div>

      <aside class="panel result-panel" aria-labelledby="result-title">
        <div class="sticky-result">
          ${renderReadingResult(reading, `${reading.spreadTitle} · ${reading.questionTitle} · ${reading.positionTitle} · ${orientationLabel(state.quick.orientation)}`)}
        </div>
      </aside>
    </section>
  `;
}

function renderSessionMode() {
  const layout = currentSessionLayout();
  const activePosition = layout.positions.find((position) => position.id === state.session.activePositionId) ?? layout.positions[0];
  const readings = composeSpreadSessionReadings(state.session);
  const summary = composeSpreadSummary(state.session);

  return `
    <section class="layout">
      <div class="workbench">
        <section class="panel quick-panel" aria-labelledby="session-title">
          <div class="section-head">
            <p class="eyebrow">Пошаговый режим</p>
            <h2 id="session-title">Собрать расклад</h2>
            <p>Выберите карту для активной позиции.</p>
          </div>
          ${renderSessionControls(layout)}
        </section>

        <section class="panel spreads-panel" aria-labelledby="session-positions-title">
          <div class="section-head">
            <p class="eyebrow">Позиции</p>
            <h2 id="session-positions-title">${layout.title}</h2>
            <p>${compactText(layout.description, 18)}</p>
          </div>
          <div class="session-positions">
            ${layout.positions.map((position, index) => renderSessionPosition(position, index)).join("")}
          </div>
        </section>

      </div>

      <aside class="panel result-panel" aria-labelledby="session-result-title">
        <div class="sticky-result">
          <p class="eyebrow">${summary.title}</p>
          <h2 id="session-result-title">${summary.filledCount}/${summary.totalCount} позиций</h2>
          <p class="selection-line">${layout.title} · ${questionTitle(state.session.questionTypeId)}</p>
          ${readings.length > 0 ? renderOpenCardsEssence(readings, summary) : ""}
          <div class="reading-block summary-card">
            <p><strong>Заполнено:</strong> ${summary.filledCount}/${summary.totalCount}</p>
            ${
              summary.line.length > 0
                ? `<p><strong>Линия:</strong> ${summary.line.join(" · ")}</p>`
                : ""
            }
            ${
              summary.focus.length > 0
                ? `<div><h3>Главный акцент</h3><div class="chips">${summary.focus.slice(0, 6).map((verb) => `<span>${verb}</span>`).join("")}</div></div>`
                : ""
            }
            ${
              readings.length === 0
                ? `<div class="phrase-block compact-phrase">
                    <h3>Фраза для чтения</h3>
                    <p>${summary.speechPhrase}</p>
                  </div>`
                : ""
            }
            ${summary.advice ? `<p><strong>Совет:</strong> ${summary.advice}</p>` : ""}
          </div>
          <div class="session-readings">
            ${
              readings.length > 0
                ? readings.map((item) => renderSessionReading(item.positionTitle, item.reading, item.selection.orientation)).join("")
                : `<div class="empty-note">Пока нет выбранных карт. Начните с позиции «${activePosition.title}».</div>`
            }
          </div>
        </div>
      </aside>
    </section>
  `;
}

function renderQuickControls(spread: SpreadLayout) {
  return `
    <div class="controls">
      <label>
        <span>Тип расклада</span>
        <select data-quick-control="spreadId">
          ${spreadLayouts.map((item) => option(item.id, item.title, item.id === state.quick.spreadId)).join("")}
        </select>
      </label>

      <label>
        <span>Тип вопроса</span>
        <select data-quick-control="questionTypeId">
          ${questionTypes.map((item) => option(item.id, item.title, item.id === state.quick.questionTypeId)).join("")}
        </select>
      </label>

      <label>
        <span>Позиция</span>
        <select data-quick-control="positionId">
          ${spread.positions.map((item) => option(item.id, item.title, item.id === state.quick.positionId)).join("")}
        </select>
      </label>

      ${renderPickerControls("quick", state.quick)}
    </div>
  `;
}

function renderSessionControls(layout: SpreadLayout) {
  return `
    <div class="controls">
      <label>
        <span>Тип расклада</span>
        <select data-session-control="layoutId">
          ${spreadLayouts.map((item) => option(item.id, item.title, item.id === state.session.layoutId)).join("")}
        </select>
      </label>

      <label>
        <span>Тип вопроса</span>
        <select data-session-control="questionTypeId">
          ${questionTypes.map((item) => option(item.id, item.title, item.id === state.session.questionTypeId)).join("")}
        </select>
      </label>

      <label class="wide-control">
        <span>Активная позиция</span>
        <select data-session-action="activePosition">
          ${layout.positions.map((item) => option(item.id, item.title, item.id === state.session.activePositionId)).join("")}
        </select>
      </label>

      <button class="danger-button wide-control" type="button" data-session-action="clearSession">Очистить расклад</button>
    </div>
  `;
}

function renderPickerControls(scope: "quick" | "session", picker: CardPickerState) {
  const attr = scope === "quick" ? "data-quick-control" : "data-session-picker";
  const groupAttr = scope === "quick" ? "data-quick-group" : "data-session-group";

  return `
    <fieldset>
      <legend>Группа карты</legend>
      <div class="segmented">
        ${pickerGroupButton(groupAttr, picker.cardKind, "minor", "◆", "Младшие арканы")}
        ${pickerGroupButton(groupAttr, picker.cardKind, "court", "♛", "Придворные карты")}
        ${pickerGroupButton(groupAttr, picker.cardKind, "major", "★", "Старшие арканы")}
      </div>
    </fieldset>

    ${renderCardControls(attr, picker)}

    <label>
      <span>Ориентация</span>
      <select ${attr}="orientation">
        ${option("upright", "Прямая", picker.orientation === "upright")}
        ${option("reversed", "Перевёрнутая", picker.orientation === "reversed")}
      </select>
    </label>
  `;
}

function renderCardControls(attr: string, picker: CardPickerState) {
  if (picker.cardKind === "major") {
    return `
      <label class="wide-control">
        <span>Старший аркан</span>
        <select ${attr}="majorId">
          ${majors.map((major) => option(major.id, `${major.number} ${major.name}`, major.id === picker.majorId)).join("")}
        </select>
      </label>
    `;
  }

  const rankOrCourt =
    picker.cardKind === "minor"
      ? `
        <label>
          <span>Достоинство</span>
          <select ${attr}="rankId">
            ${ranks.map((rank) => option(rank.id, rank.label, rank.id === picker.rankId)).join("")}
          </select>
        </label>
      `
      : `
        <label>
          <span>Придворная карта</span>
          <select ${attr}="courtId">
            ${courtCards.map((court) => option(court.id, court.name, court.id === picker.courtId)).join("")}
          </select>
        </label>
      `;

  return `
    <label>
      <span>Масть</span>
      <select ${attr}="suitId">
        ${suits.map((suit) => option(suit.id, suit.name, suit.id === picker.suitId)).join("")}
      </select>
    </label>
    ${rankOrCourt}
  `;
}

function renderQuickPositionCard(id: string, title: string, description: string, optional?: boolean) {
  return `
    <article class="mini-card ${id === state.quick.positionId ? "is-active" : ""}">
      <button class="plain-card-button" type="button" data-quick-position="${id}">
        <span>${title}</span>
        <small>${description}${optional ? " · опционально" : ""}</small>
      </button>
    </article>
  `;
}

function renderSessionPosition(position: SpreadLayout["positions"][number], index: number) {
  const selection = state.session.cardsByPosition[position.id];
  const isActive = state.session.activePositionId === position.id;
  const isEditing = state.session.editingPositionId === position.id;
  const cardName = selection ? cardLabel(selection.card) : "Карта не выбрана";

  return `
    <article class="session-position ${isActive ? "is-active" : ""} ${selection ? "is-filled" : ""}" data-session-card="${position.id}">
      <button class="session-position-main" type="button" data-session-position="${position.id}">
        <span class="position-number">${index + 1}</span>
        <span>
          <strong>${position.title}${position.optional ? " · опционально" : ""}</strong>
          <small>${compactText(position.description, 14)}</small>
          <em>${cardName}${selection ? ` · ${orientationLabel(selection.orientation)}` : ""}${isEditing ? " · замена" : ""}</em>
        </span>
      </button>
      ${
        selection
          ? `<div class="position-actions">
              <button type="button" data-session-edit="${position.id}" aria-label="Изменить карту" title="Изменить карту">✎</button>
              <button type="button" data-session-clear="${position.id}" aria-label="Очистить позицию" title="Очистить позицию">×</button>
            </div>`
          : ""
      }
      ${renderInlineSessionPicker(position.id, selection, isActive, isEditing)}
    </article>
  `;
}

function renderInlineSessionPicker(
  positionId: string,
  selection: PositionCardSelection | undefined,
  isActive: boolean,
  isEditing: boolean,
) {
  if (!isActive || (selection && !isEditing)) {
    return "";
  }

  const currentLine =
    selection && isEditing
      ? `<p class="current-card-line">Сейчас выбрано: ${cardLabel(selection.card)} · ${orientationLabel(selection.orientation)}</p>`
      : `<p class="current-card-line">Выберите карту</p>`;

  return `
    <div class="inline-picker" data-inline-picker="${positionId}">
      ${currentLine}
      <div class="controls session-picker">
        ${renderPickerControls("session", state.sessionPicker)}
        <button class="primary-button ${isEditing ? "picker-action" : "wide-control"}" type="button" data-session-pick-current="${positionId}">Выбрать</button>
        ${
          isEditing
            ? `<button class="secondary-button picker-action icon-picker-action" type="button" data-session-cancel-edit="${positionId}" aria-label="Отмена изменения" title="Отмена изменения">↩</button>`
            : ""
        }
      </div>
    </div>
  `;
}

function renderReadingResult(reading: ReturnType<typeof composeReading>, selectionLine: string) {
  return `
    <p class="eyebrow">Текущий выбор</p>
    <h2 id="result-title">${reading.cardName}</h2>
    <p class="selection-line">${selectionLine}</p>
    <div class="reading-block">
      <h3>Суть</h3>
      <p>${compactSense(reading)}</p>
    </div>
    <div class="reading-block">
      <h3>Глаголы</h3>
      <div class="chips">${reading.verbs.slice(0, 6).map((verb) => `<span>${verb}</span>`).join("")}</div>
    </div>
    <div class="reading-block phrase-block">
      <h3>Фраза</h3>
      <p>${firstPhrase(reading)}</p>
    </div>
    <details class="compact-details">
      <summary>Подробнее</summary>
      <div class="details-stack">
        <h3>Полный смысл</h3>
        <p>${reading.summary}</p>
        <h3>Внимание</h3>
        <p>${reading.attention}</p>
        <h3>Анти-трактовка</h3>
        <p>${reading.avoid}</p>
      </div>
      <ul>
        ${reading.parts.map((part) => `<li>${part}</li>`).join("")}
      </ul>
    </details>
  `;
}

function renderSessionReading(positionTitle: string, reading: ReturnType<typeof composeReading>, orientation: Orientation) {
  return `
    <article class="session-reading compact-session-reading">
      <h3>${positionTitle} · ${reading.cardName} · ${orientationLabel(orientation)}</h3>
      <p><strong>Смысл:</strong> ${readingShortMeaning(reading)}</p>
      <p class="verb-line"><strong>Глаголы:</strong> ${reading.verbs.slice(0, 4).join(" · ")}</p>
      <details class="compact-details">
        <summary>Подробнее</summary>
        <div class="details-stack">
          <h3>Полный смысл</h3>
          <p>${reading.summary}</p>
          <h3>Внимание</h3>
          <p>${reading.attention}</p>
          <h3>Анти-трактовка</h3>
          <p>${reading.avoid}</p>
          <h3>Как собран смысл</h3>
          <ul>
            ${reading.parts.map((part) => `<li>${part}</li>`).join("")}
          </ul>
        </div>
      </details>
    </article>
  `;
}

function renderOpenCardsEssence(
  readings: ReturnType<typeof composeSpreadSessionReadings>,
  summary: ReturnType<typeof composeSpreadSummary>,
) {
  const essenceLines = readings
    .slice(0, 5)
    .map(
      (item, index) => `
        <li>
          <span>${index + 1}. ${item.positionTitle}</span>
          <strong>${readingShortMeaning(item.reading)}</strong>
        </li>
      `,
    )
    .join("");

  return `
    <section class="reading-block open-cards-essence" aria-label="Суть по открытым картам">
      <h3>Суть по открытым картам</h3>
      <ol class="essence-list">${essenceLines}</ol>
      <div class="phrase-block compact-phrase">
        <h3>Что сказать</h3>
        <p>${spreadSpeechPhrase(readings, summary)}</p>
      </div>
    </section>
  `;
}

function renderReference() {
  return `
    <section class="reference-grid" aria-label="Справочник карт">
      <details class="panel reference-panel" open>
        <summary>Типы вопросов</summary>
        <div class="card-list compact">
          ${questionTypes
            .map(
              (type) => `
                <article class="reference-card">
                  <h3>${type.title}</h3>
                  <p>${type.description}</p>
                  <div class="chips">${type.verbs.map((verb) => `<span>${verb}</span>`).join("")}</div>
                  <dl>
                    <dt>Ищем</dt><dd>${type.readingFocus.join(", ")}</dd>
                    <dt>Позитивные карты</dt><dd>${type.positiveCards}</dd>
                    <dt>Напряжённые карты</dt><dd>${type.tenseCards}</dd>
                    <dt>Не делать</dt><dd>${type.avoid.join("; ")}</dd>
                  </dl>
                </article>
              `,
            )
            .join("")}
        </div>
      </details>

      <details class="panel reference-panel" open>
        <summary>Масти</summary>
        <div class="card-list">
          ${suits
            .map(
              (suit) => `
                <article class="reference-card">
                  <h3>${suit.name}</h3>
                  <p>${suit.base}</p>
                  <div class="chips">${suit.verbs.map((verb) => `<span>${verb}</span>`).join("")}</div>
                  <dl>
                    <dt>В плюсе</dt><dd>${suit.plus}</dd>
                    <dt>В минусе</dt><dd>${suit.minus}</dd>
                    <dt>В совете</dt><dd>${suit.advice}</dd>
                    <dt>В риске</dt><dd>${suit.risk}</dd>
                  </dl>
                </article>
              `,
            )
            .join("")}
        </div>
      </details>

      <details class="panel reference-panel">
        <summary>Достоинства Туз → 10</summary>
        <div class="card-list compact">
          ${ranks
            .map(
              (rank) => `
                <article class="reference-card">
                  <h3>${rank.label}: ${rank.key}</h3>
                  <p>${rank.stage}</p>
                  <div class="chips">${rank.verbs.map((verb) => `<span>${verb}</span>`).join("")}</div>
                  <dl>
                    <dt>Энергия</dt><dd>${rank.energy}</dd>
                    <dt>Формат</dt><dd>${rank.format}</dd>
                    <dt>Препятствие</dt><dd>${rank.obstacle}</dd>
                    <dt>Совет</dt><dd>${rank.advice}</dd>
                  </dl>
                </article>
              `,
            )
            .join("")}
        </div>
      </details>

      <details class="panel reference-panel">
        <summary>Придворные карты</summary>
        <div class="card-list">
          ${courtCards
            .map(
              (court) => `
                <article class="reference-card">
                  <h3>${court.name}</h3>
                  <p>${court.role}</p>
                  <div class="chips">${court.verbs.map((verb) => `<span>${verb}</span>`).join("")}</div>
                  <dl>
                    <dt>Зрелость</dt><dd>${court.maturity}</dd>
                    <dt>Отношения</dt><dd>${court.relationships}</dd>
                    <dt>Работа</dt><dd>${court.work}</dd>
                    <dt>Совет</dt><dd>${court.advice}</dd>
                    <dt>В минусе</dt><dd>${court.minus}</dd>
                  </dl>
                </article>
              `,
            )
            .join("")}
        </div>
      </details>

      <details class="panel reference-panel">
        <summary>Старшие арканы</summary>
        <div class="card-list compact">
          ${majors
            .map(
              (major) => `
                <article class="reference-card">
                  <h3>${major.number} ${major.name}</h3>
                  <p>${major.archetype}</p>
                  <div class="chips">${major.verbs.map((verb) => `<span>${verb}</span>`).join("")}</div>
                  <dl>
                    <dt>В плюсе</dt><dd>${major.plus}</dd>
                    <dt>В минусе</dt><dd>${major.minus}</dd>
                    <dt>Энергия</dt><dd>${major.energy}</dd>
                    <dt>Формат</dt><dd>${major.format}</dd>
                    <dt>Препятствие</dt><dd>${major.obstacle}</dd>
                    <dt>Совет</dt><dd>${major.advice}</dd>
                  </dl>
                </article>
              `,
            )
            .join("")}
        </div>
      </details>
    </section>
  `;
}

function compactSense(reading: ReturnType<typeof composeReading>) {
  return compactText(reading.phrases[0]?.replace(/[.。]$/u, "") ?? reading.summary, 16);
}

function readingShortMeaning(reading: ReturnType<typeof composeReading>) {
  const fragments = reading.parts.map(coreFragment).filter(uniqueText).slice(0, 2);
  const verbs = reading.verbs.slice(0, 3);
  return compactText([...fragments, ...verbs].filter(uniqueText).join(", "), 18);
}

function coreFragment(part: string) {
  const afterDash = part.includes("—") ? part.slice(part.indexOf("—") + 1) : part;
  const withoutLead = afterDash.replace(/^[^:]+:\s*/u, "");
  return stripFinalPeriod(withoutLead.split(/[.!?]/u)[0]?.trim() ?? "");
}

function spreadSpeechPhrase(
  readings: ReturnType<typeof composeSpreadSessionReadings>,
  summary: ReturnType<typeof composeSpreadSummary>,
) {
  const first = readings[0];
  const last = readings[readings.length - 1];
  const focus = summary.focus.slice(0, 4).join(" · ");
  const focusLine = focus ? ` Главный акцент: ${focus}.` : "";

  if (!first) {
    return summary.speechPhrase;
  }

  if (readings.length === 1 || !last) {
    return `Расклад начинает с позиции «${first.positionTitle}»: ${readingShortMeaning(first.reading)}.${focusLine}`;
  }

  return `Расклад связывает «${first.positionTitle}» (${readingShortMeaning(first.reading)}) и «${last.positionTitle}» (${readingShortMeaning(last.reading)}).${focusLine}`;
}

function firstPhrase(reading: ReturnType<typeof composeReading>) {
  return reading.phrases[0] ?? reading.summary;
}

function stripFinalPeriod(text: string) {
  return text.replace(/[.。]$/u, "");
}

function compactText(text: string, maxWords: number) {
  const words = text.split(/\s+/u).filter(Boolean);
  return words.length > maxWords ? `${words.slice(0, maxWords).join(" ")}...` : text;
}

function uniqueText(value: string, index: number, array: string[]) {
  return value.length > 0 && array.indexOf(value) === index;
}

function wireEvents() {
  app.querySelectorAll<HTMLButtonElement>("button[data-mode]").forEach((button) => {
    button.addEventListener("click", () => {
      state.mode = button.dataset.mode as AppMode;
      render();
    });
  });

  wireQuickEvents();
  wireSessionEvents();
}

function wireQuickEvents() {
  app.querySelectorAll<HTMLSelectElement>("select[data-quick-control]").forEach((select) => {
    select.addEventListener("change", () => {
      const control = select.dataset.quickControl;

      if (control === "spreadId") {
        state.quick.spreadId = select.value as SpreadLayoutId;
        state.quick.questionTypeId = currentQuickSpread().defaultQuestionTypeId;
        state.quick.positionId = currentQuickSpread().positions[0].id;
      } else if (control === "questionTypeId") {
        state.quick.questionTypeId = select.value as QuestionTypeId;
      } else if (control === "positionId") {
        state.quick.positionId = select.value;
      } else {
        updatePicker(state.quick, control, select.value);
      }

      render();
    });
  });

  app.querySelectorAll<HTMLButtonElement>("button[data-quick-group]").forEach((button) => {
    button.addEventListener("click", () => {
      state.quick.cardKind = button.dataset.quickGroup as CardKind;
      render();
    });
  });

  app.querySelectorAll<HTMLButtonElement>("button[data-quick-position]").forEach((button) => {
    button.addEventListener("click", () => {
      state.quick.positionId = button.dataset.quickPosition ?? state.quick.positionId;
      render();
    });
  });
}

function wireSessionEvents() {
  app.querySelectorAll<HTMLSelectElement>("select[data-session-control]").forEach((select) => {
    select.addEventListener("change", () => {
      const control = select.dataset.sessionControl;

      if (control === "layoutId") {
        const nextLayoutId = select.value as SpreadLayoutId;
        if (hasSessionCards(state.session) && !window.confirm("Смена расклада очистит выбранные карты. Продолжить?")) {
          render();
          return;
        }
        state.session = changeSessionLayout(state.session, nextLayoutId);
      } else if (control === "questionTypeId") {
        state.session = changeSessionQuestionType(state.session, select.value as QuestionTypeId);
      }

      render();
    });
  });

  app.querySelectorAll<HTMLSelectElement>("select[data-session-action]").forEach((select) => {
    select.addEventListener("change", () => {
      if (select.dataset.sessionAction === "activePosition") {
        state.session = setActivePosition(state.session, select.value);
        pendingScrollPositionId = state.session.activePositionId;
        render();
      }
    });
  });

  app.querySelectorAll<HTMLButtonElement>("button[data-session-position]").forEach((button) => {
    button.addEventListener("click", () => {
      state.session = setActivePosition(state.session, button.dataset.sessionPosition ?? state.session.activePositionId);
      pendingScrollPositionId = state.session.activePositionId;
      render();
    });
  });

  app.querySelectorAll<HTMLButtonElement>("button[data-session-edit]").forEach((button) => {
    button.addEventListener("click", () => {
      const positionId = button.dataset.sessionEdit ?? state.session.activePositionId;
      state.session = editPosition(state.session, positionId);
      syncSessionPickerFromPosition(positionId);
      pendingScrollPositionId = state.session.activePositionId;
      render();
    });
  });

  app.querySelectorAll<HTMLButtonElement>("button[data-session-clear]").forEach((button) => {
    button.addEventListener("click", () => {
      state.session = clearPosition(state.session, button.dataset.sessionClear ?? state.session.activePositionId);
      pendingScrollPositionId = state.session.activePositionId;
      render();
    });
  });

  app.querySelectorAll<HTMLButtonElement>("button[data-session-cancel-edit]").forEach((button) => {
    button.addEventListener("click", () => {
      state.session = cancelEditPosition(state.session);
      pendingScrollPositionId = button.dataset.sessionCancelEdit ?? state.session.activePositionId;
      render();
    });
  });

  app.querySelectorAll<HTMLButtonElement>("button[data-session-pick-current]").forEach((button) => {
    button.addEventListener("click", () => {
      state.session = setActivePosition(state.session, button.dataset.sessionPickCurrent ?? state.session.activePositionId);
      commitSessionPicker("card");
    });
  });

  app.querySelectorAll<HTMLButtonElement>("button[data-session-action='clearSession']").forEach((button) => {
    button.addEventListener("click", () => {
      state.session = clearSession(state.session);
      render();
    });
  });

  app.querySelectorAll<HTMLButtonElement>("button[data-session-group]").forEach((button) => {
    button.addEventListener("click", () => {
      state.sessionPicker.cardKind = button.dataset.sessionGroup as CardKind;
      render();
    });
  });

  app.querySelectorAll<HTMLSelectElement>("select[data-session-picker]").forEach((select) => {
    select.addEventListener("change", () => {
      const control = select.dataset.sessionPicker;
      updatePicker(state.sessionPicker, control, select.value);
      commitSessionPicker(control === "orientation" ? "orientation" : "card");
    });
  });
}

function commitSessionPicker(mode: PickerCommitMode) {
  const activeSelection = state.session.cardsByPosition[state.session.activePositionId];
  const isEditing = state.session.editingPositionId === state.session.activePositionId;

  if (mode === "none" || (mode === "orientation" && !activeSelection && !isEditing)) {
    render();
    return;
  }

  state.session = selectCardForActivePosition(state.session, selectionFromPicker(state.sessionPicker));
  pendingScrollPositionId = state.session.activePositionId;
  render();
}

function ensureQuickPosition() {
  const spread = currentQuickSpread();
  const position = spread.positions.find((item) => item.id === state.quick.positionId) ?? spread.positions[0];
  state.quick.positionId = position.id;
}

function ensureSessionPosition() {
  const layout = currentSessionLayout();
  if (!layout.positions.some((position) => position.id === state.session.activePositionId)) {
    state.session = setActivePosition(state.session, layout.positions[0].id);
  }
}

function currentQuickSpread() {
  return spreadLayouts.find((spread) => spread.id === state.quick.spreadId) ?? spreadLayouts[0];
}

function currentSessionLayout() {
  return spreadLayouts.find((spread) => spread.id === state.session.layoutId) ?? spreadLayouts[0];
}

function updatePicker(picker: CardPickerState, control: string | undefined, value: string) {
  if (control === "orientation") {
    picker.orientation = value as Orientation;
  } else if (control === "suitId") {
    picker.suitId = value as SuitId;
  } else if (control === "rankId") {
    picker.rankId = value as RankId;
  } else if (control === "courtId") {
    picker.courtId = value as CourtId;
  } else if (control === "majorId") {
    picker.majorId = value as MajorId;
  }
}

function syncSessionPickerFromPosition(positionId: string) {
  const selection = state.session.cardsByPosition[positionId];

  if (!selection) {
    return;
  }

  state.sessionPicker.cardKind = selection.cardKind;
  state.sessionPicker.orientation = selection.orientation;

  if (selection.card.type === "minor") {
    state.sessionPicker.suitId = selection.card.suitId;
    state.sessionPicker.rankId = selection.card.rankId;
  } else if (selection.card.type === "court") {
    state.sessionPicker.suitId = selection.card.suitId;
    state.sessionPicker.courtId = selection.card.courtId;
  } else {
    state.sessionPicker.majorId = selection.card.majorId;
  }
}

function scrollPendingPositionIntoView() {
  if (!pendingScrollPositionId) {
    return;
  }

  const positionId = pendingScrollPositionId;
  pendingScrollPositionId = undefined;
  window.requestAnimationFrame(() => {
    app.querySelector<HTMLElement>(`[data-session-card="${positionId}"]`)?.scrollIntoView({
      block: "nearest",
    });
  });
}

function selectionFromPicker(picker: CardPickerState): PositionCardSelection {
  return {
    cardKind: picker.cardKind,
    card: cardFromPicker(picker),
    orientation: picker.orientation,
  };
}

function cardFromPicker(picker: CardPickerState): ReadingCard {
  if (picker.cardKind === "minor") {
    return { type: "minor", suitId: picker.suitId, rankId: picker.rankId };
  }

  if (picker.cardKind === "court") {
    return { type: "court", suitId: picker.suitId, courtId: picker.courtId };
  }

  return { type: "major", majorId: picker.majorId };
}

function cardLabel(card: ReadingCard) {
  if (card.type === "minor") {
    const suit = suits.find((item) => item.id === card.suitId);
    const rank = ranks.find((item) => item.id === card.rankId);
    return `${rank?.label ?? card.rankId} ${suit?.genitive ?? card.suitId}`;
  }

  if (card.type === "court") {
    const suit = suits.find((item) => item.id === card.suitId);
    const court = courtCards.find((item) => item.id === card.courtId);
    return `${court?.name ?? card.courtId} ${suit?.genitive ?? card.suitId}`;
  }

  const major = majors.find((item) => item.id === card.majorId);
  return major ? `${major.number} ${major.name}` : card.majorId;
}

function questionTitle(questionTypeId: QuestionTypeId) {
  return questionTypes.find((type) => type.id === questionTypeId)?.title ?? questionTypeId;
}

function orientationLabel(orientation: Orientation) {
  return orientation === "upright" ? "прямая" : "перевёрнутая";
}

function pickerGroupButton(attr: string, activeGroup: CardKind, group: CardKind, label: string, fullLabel: string) {
  return `
    <button class="${activeGroup === group ? "is-active" : ""}" type="button" ${attr}="${group}" aria-label="${fullLabel}" title="${fullLabel}">
      <span aria-hidden="true">${label}</span>
    </button>
  `;
}

function option(value: string, label: string, selected: boolean) {
  return `<option value="${value}" ${selected ? "selected" : ""}>${label}</option>`;
}
