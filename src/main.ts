import "./styles.css";
import { courtCards } from "./data/court";
import { majors } from "./data/majors";
import { questionTypes } from "./data/questionTypes";
import { ranks } from "./data/ranks";
import { spreadLayouts } from "./data/spreadLayouts";
import { suits } from "./data/suits";
import { composeReading } from "./lib/reading";
import {
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
          <p class="lead">Выберите тип расклада и позицию, затем найдите карту. Навигатор подскажет, как читать карту именно на этом месте расклада.</p>
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
            <p>Выберите карту физической колодой и укажите её для активной позиции. Выбор закрепляется сразу.</p>
          </div>
          ${renderSessionControls(layout)}
        </section>

        <section class="panel spreads-panel" aria-labelledby="session-positions-title">
          <div class="section-head">
            <p class="eyebrow">Позиции</p>
            <h2 id="session-positions-title">${layout.title}</h2>
            <p>${layout.description}</p>
          </div>
          <div class="session-positions">
            ${layout.positions.map((position, index) => renderSessionPosition(position, index)).join("")}
          </div>
        </section>

        <section class="panel quick-panel" aria-labelledby="session-picker-title">
          <div class="section-head">
            <p class="eyebrow">Активная позиция</p>
            <h2 id="session-picker-title">${activePosition.title}</h2>
            <p>${state.session.editingPositionId === activePosition.id ? "Режим замены включён: следующий выбор карты обновит эту позицию." : "Следующий выбор карты закрепится здесь и откроет следующую пустую позицию."}</p>
          </div>
          ${renderSessionPicker()}
        </section>
      </div>

      <aside class="panel result-panel" aria-labelledby="session-result-title">
        <div class="sticky-result">
          <p class="eyebrow">${summary.title}</p>
          <h2 id="session-result-title">${summary.filledCount}/${summary.totalCount} позиций</h2>
          <p class="selection-line">${layout.title} · ${questionTitle(state.session.questionTypeId)}</p>
          <div class="reading-block">
            <h3>${summary.title}</h3>
            <p>${summary.text}</p>
          </div>
          ${
            summary.focus.length > 0
              ? `<div class="reading-block"><h3>Ключевые глаголы</h3><div class="chips">${summary.focus.map((verb) => `<span>${verb}</span>`).join("")}</div></div>`
              : ""
          }
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
        ${pickerGroupButton(groupAttr, picker.cardKind, "minor", "Масть + достоинство")}
        ${pickerGroupButton(groupAttr, picker.cardKind, "court", "Придворная")}
        ${pickerGroupButton(groupAttr, picker.cardKind, "major", "Старший аркан")}
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

function renderSessionPicker() {
  return `
    <div class="controls session-picker">
      ${renderPickerControls("session", state.sessionPicker)}
    </div>
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
    <article class="session-position ${isActive ? "is-active" : ""} ${selection ? "is-filled" : ""}">
      <button class="session-position-main" type="button" data-session-position="${position.id}">
        <span class="position-number">${index + 1}</span>
        <span>
          <strong>${position.title}${position.optional ? " · опционально" : ""}</strong>
          <small>${position.description}</small>
          <em>${cardName}${selection ? ` · ${orientationLabel(selection.orientation)}` : ""}${isEditing ? " · замена" : ""}</em>
        </span>
      </button>
      <div class="position-actions">
        <button type="button" data-session-edit="${position.id}" ${selection ? "" : "disabled"}>Изменить</button>
        <button type="button" data-session-clear="${position.id}" ${selection ? "" : "disabled"}>Очистить</button>
      </div>
    </article>
  `;
}

function renderReadingResult(reading: ReturnType<typeof composeReading>, selectionLine: string) {
  return `
    <p class="eyebrow">Текущий выбор</p>
    <h2 id="result-title">${reading.cardName}</h2>
    <p class="selection-line">${selectionLine}</p>
    <div class="reading-block">
      <h3>Краткий смысл</h3>
      <p>${reading.summary}</p>
    </div>
    <div class="reading-block">
      <h3>Глаголы</h3>
      <div class="chips">${reading.verbs.map((verb) => `<span>${verb}</span>`).join("")}</div>
    </div>
    <div class="reading-block phrase-block">
      <h3>Фразы для старта</h3>
      ${reading.phrases.map((phrase) => `<p>${phrase}</p>`).join("")}
    </div>
    <div class="reading-block split-reading">
      <div>
        <h3>Обратить внимание</h3>
        <p>${reading.attention}</p>
      </div>
      <div>
        <h3>Не трактовать так</h3>
        <p>${reading.avoid}</p>
      </div>
    </div>
    <details class="compact-details">
      <summary>Как собран смысл</summary>
      <ul>
        ${reading.parts.map((part) => `<li>${part}</li>`).join("")}
      </ul>
    </details>
  `;
}

function renderSessionReading(positionTitle: string, reading: ReturnType<typeof composeReading>, orientation: Orientation) {
  return `
    <details class="session-reading" open>
      <summary>${positionTitle}: ${reading.cardName} · ${orientationLabel(orientation)}</summary>
      <div class="reading-block">
        <h3>Краткий смысл</h3>
        <p>${reading.summary}</p>
      </div>
      <div class="reading-block phrase-block">
        <h3>Фразы</h3>
        ${reading.phrases.slice(0, 3).map((phrase) => `<p>${phrase}</p>`).join("")}
      </div>
      <div class="reading-block">
        <h3>Внимание</h3>
        <p>${reading.attention}</p>
      </div>
      <div class="reading-block">
        <h3>Анти-трактовка</h3>
        <p>${reading.avoid}</p>
      </div>
    </details>
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
        render();
      }
    });
  });

  app.querySelectorAll<HTMLButtonElement>("button[data-session-position]").forEach((button) => {
    button.addEventListener("click", () => {
      state.session = setActivePosition(state.session, button.dataset.sessionPosition ?? state.session.activePositionId);
      render();
    });
  });

  app.querySelectorAll<HTMLButtonElement>("button[data-session-edit]").forEach((button) => {
    button.addEventListener("click", () => {
      state.session = editPosition(state.session, button.dataset.sessionEdit ?? state.session.activePositionId);
      render();
    });
  });

  app.querySelectorAll<HTMLButtonElement>("button[data-session-clear]").forEach((button) => {
    button.addEventListener("click", () => {
      state.session = clearPosition(state.session, button.dataset.sessionClear ?? state.session.activePositionId);
      render();
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
      commitSessionPicker();
    });
  });

  app.querySelectorAll<HTMLSelectElement>("select[data-session-picker]").forEach((select) => {
    select.addEventListener("change", () => {
      updatePicker(state.sessionPicker, select.dataset.sessionPicker, select.value);
      commitSessionPicker();
    });
  });
}

function commitSessionPicker() {
  state.session = selectCardForActivePosition(state.session, selectionFromPicker(state.sessionPicker));
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

function pickerGroupButton(attr: string, activeGroup: CardKind, group: CardKind, label: string) {
  return `
    <button class="${activeGroup === group ? "is-active" : ""}" type="button" ${attr}="${group}">
      ${label}
    </button>
  `;
}

function option(value: string, label: string, selected: boolean) {
  return `<option value="${value}" ${selected ? "selected" : ""}>${label}</option>`;
}
