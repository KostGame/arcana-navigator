import "./styles.css";
import { courtCards } from "./data/court";
import { majors } from "./data/majors";
import { questionTypes } from "./data/questionTypes";
import { ranks } from "./data/ranks";
import { spreadLayouts } from "./data/spreadLayouts";
import { suits } from "./data/suits";
import { composeReading } from "./lib/reading";
import type {
  CourtId,
  MajorId,
  Orientation,
  QuestionTypeId,
  RankId,
  ReadingCard,
  SpreadLayout,
  SpreadLayoutId,
  SuitId,
} from "./types";

type CardGroup = "minor" | "court" | "major";

interface AppState {
  spreadId: SpreadLayoutId;
  questionTypeId: QuestionTypeId;
  positionId: string;
  cardGroup: CardGroup;
  suitId: SuitId;
  rankId: RankId;
  courtId: CourtId;
  majorId: MajorId;
  orientation: Orientation;
}

const state: AppState = {
  spreadId: "three-advice",
  questionTypeId: "diagnosis",
  positionId: "three-situation",
  cardGroup: "minor",
  suitId: "cups",
  rankId: "ten",
  courtId: "queen",
  majorId: "sun",
  orientation: "upright",
};

const appRoot = document.querySelector<HTMLDivElement>("#app");

if (!appRoot) {
  throw new Error("App root was not found");
}

const app = appRoot;

render();

function render() {
  const spread = currentSpread();
  const position = spread.positions.find((item) => item.id === state.positionId) ?? spread.positions[0];
  state.positionId = position.id;

  const reading = composeReading({
    spreadId: state.spreadId,
    questionTypeId: state.questionTypeId,
    positionId: state.positionId,
    orientation: state.orientation,
    card: currentCard(),
  });

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

      <section class="layout">
        <div class="workbench">
          <section class="panel quick-panel" aria-labelledby="quick-title">
            <div class="section-head">
              <p class="eyebrow">Быстрый режим</p>
              <h2 id="quick-title">Быстрый разбор карты</h2>
            </div>
            ${renderControls(spread)}
          </section>

          <section class="panel spreads-panel" aria-labelledby="spreads-title">
            <div class="section-head">
              <p class="eyebrow">Расклады</p>
              <h2 id="spreads-title">Позиции выбранного расклада</h2>
              <p>${spread.description}</p>
            </div>
            <div class="position-grid">
              ${spread.positions
                .map(
                  (item) => `
                    <article class="mini-card ${item.id === state.positionId ? "is-active" : ""}">
                      <button class="plain-card-button" type="button" data-position="${item.id}">
                        <span>${item.title}</span>
                        <small>${item.description}${item.optional ? " · опционально" : ""}</small>
                      </button>
                    </article>
                  `,
                )
                .join("")}
            </div>
          </section>

          ${renderReference()}
        </div>

        <aside class="panel result-panel" aria-labelledby="result-title">
          <div class="sticky-result">
            <p class="eyebrow">Текущий выбор</p>
            <h2 id="result-title">${reading.cardName}</h2>
            <p class="selection-line">${reading.spreadTitle} · ${reading.questionTitle} · ${reading.positionTitle} · ${state.orientation === "upright" ? "прямая" : "перевёрнутая"}</p>
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
          </div>
        </aside>
      </section>
    </main>
  `;

  wireEvents();
}

function renderControls(spread: SpreadLayout) {
  return `
    <div class="controls">
      <label>
        <span>Тип расклада</span>
        <select data-control="spreadId">
          ${spreadLayouts.map((item) => option(item.id, item.title, item.id === state.spreadId)).join("")}
        </select>
      </label>

      <label>
        <span>Тип вопроса</span>
        <select data-control="questionTypeId">
          ${questionTypes.map((item) => option(item.id, item.title, item.id === state.questionTypeId)).join("")}
        </select>
      </label>

      <label>
        <span>Позиция</span>
        <select data-control="positionId">
          ${spread.positions.map((item) => option(item.id, item.title, item.id === state.positionId)).join("")}
        </select>
      </label>

      <fieldset>
        <legend>Группа карты</legend>
        <div class="segmented">
          ${groupButton("minor", "Масть + достоинство")}
          ${groupButton("court", "Придворная")}
          ${groupButton("major", "Старший аркан")}
        </div>
      </fieldset>

      ${renderCardControls()}

      <label>
        <span>Ориентация</span>
        <select data-control="orientation">
          ${option("upright", "Прямая", state.orientation === "upright")}
          ${option("reversed", "Перевёрнутая", state.orientation === "reversed")}
        </select>
      </label>
    </div>
  `;
}

function renderCardControls() {
  if (state.cardGroup === "major") {
    return `
      <label class="wide-control">
        <span>Старший аркан</span>
        <select data-control="majorId">
          ${majors.map((major) => option(major.id, `${major.number} ${major.name}`, major.id === state.majorId)).join("")}
        </select>
      </label>
    `;
  }

  const rankOrCourt =
    state.cardGroup === "minor"
      ? `
        <label>
          <span>Достоинство</span>
          <select data-control="rankId">
            ${ranks.map((rank) => option(rank.id, rank.label, rank.id === state.rankId)).join("")}
          </select>
        </label>
      `
      : `
        <label>
          <span>Придворная карта</span>
          <select data-control="courtId">
            ${courtCards.map((court) => option(court.id, court.name, court.id === state.courtId)).join("")}
          </select>
        </label>
      `;

  return `
    <label>
      <span>Масть</span>
      <select data-control="suitId">
        ${suits.map((suit) => option(suit.id, suit.name, suit.id === state.suitId)).join("")}
      </select>
    </label>
    ${rankOrCourt}
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
  app.querySelectorAll<HTMLSelectElement>("select[data-control]").forEach((select) => {
    select.addEventListener("change", () => {
      const control = select.dataset.control;
      if (!control) {
        return;
      }

      if (control === "spreadId") {
        state.spreadId = select.value as SpreadLayoutId;
        state.questionTypeId = currentSpread().defaultQuestionTypeId;
        state.positionId = currentSpread().positions[0].id;
      } else if (control === "questionTypeId") {
        state.questionTypeId = select.value as QuestionTypeId;
      } else if (control === "positionId") {
        state.positionId = select.value;
      } else if (control === "orientation") {
        state.orientation = select.value as Orientation;
      } else if (control === "suitId") {
        state.suitId = select.value as SuitId;
      } else if (control === "rankId") {
        state.rankId = select.value as RankId;
      } else if (control === "courtId") {
        state.courtId = select.value as CourtId;
      } else if (control === "majorId") {
        state.majorId = select.value as MajorId;
      }

      render();
    });
  });

  app.querySelectorAll<HTMLButtonElement>("button[data-group]").forEach((button) => {
    button.addEventListener("click", () => {
      state.cardGroup = button.dataset.group as CardGroup;
      render();
    });
  });

  app.querySelectorAll<HTMLButtonElement>("button[data-position]").forEach((button) => {
    button.addEventListener("click", () => {
      state.positionId = button.dataset.position ?? state.positionId;
      render();
    });
  });
}

function currentSpread() {
  return spreadLayouts.find((spread) => spread.id === state.spreadId) ?? spreadLayouts[0];
}

function currentCard(): ReadingCard {
  if (state.cardGroup === "minor") {
    return { type: "minor", suitId: state.suitId, rankId: state.rankId };
  }

  if (state.cardGroup === "court") {
    return { type: "court", suitId: state.suitId, courtId: state.courtId };
  }

  return { type: "major", majorId: state.majorId };
}

function groupButton(group: CardGroup, label: string) {
  return `
    <button class="${state.cardGroup === group ? "is-active" : ""}" type="button" data-group="${group}">
      ${label}
    </button>
  `;
}

function option(value: string, label: string, selected: boolean) {
  return `<option value="${value}" ${selected ? "selected" : ""}>${label}</option>`;
}
