import { retrievedUserObject, bindLogoutButton } from '../api-calls/auth.js';
import { ApiErrors } from '../api-calls/api-fetch.js';
import { getVocabulary, updateVocabularyEntry, VocabularyStatus } from '../api-calls/vocabulary.js';
import { setBusy } from '../loading.js';
import { burstConfetti } from '../effects.js';

// TODO > CONSTANTS ------------------------------------------------------------
// Palabras por página de la tabla
const PAGE_SIZE = 10;

/**
 * Level buttons of each row, in order (the same as in the lesson).
 * @type {{ status: string, label: string, name: string }[]}
 */
const LEVELS = [
    { status: VocabularyStatus.IGNORED, label: "X", name: "Ignorar palabra" },
    { status: VocabularyStatus.NEW, label: "1", name: "Nivel 1" },
    { status: VocabularyStatus.LEVEL_2, label: "2", name: "Nivel 2" },
    { status: VocabularyStatus.LEVEL_3, label: "3", name: "Nivel 3" },
    { status: VocabularyStatus.LEVEL_4, label: "4", name: "Nivel 4" },
    { status: VocabularyStatus.LEVEL_5, label: "5", name: "Nivel 5" },
    { status: VocabularyStatus.LEARNED, label: "✓", name: "Palabra aprendida" }
];

// Orden de los estados al ordenar por nivel: primero lo que más falta aprender
const LEVEL_ORDER = [
    VocabularyStatus.NEW, VocabularyStatus.LEVEL_2, VocabularyStatus.LEVEL_3,
    VocabularyStatus.LEVEL_4, VocabularyStatus.LEVEL_5, VocabularyStatus.LEARNED, VocabularyStatus.IGNORED
];

const LEARNING_STATUSES = new Set(LEVEL_ORDER.slice(0, 5));

// Palomita del botón de "aprendida" (la misma de la lección)
const CHECK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
    <path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425z" />
</svg>`;

// * DOM
const userNameHeader = document.querySelector("#username");
const rowsContainer = document.querySelector("#vocabulary-rows");
const table = document.querySelector(".vocabulary-table");
const emptyState = document.querySelector(".empty-state");
const emptyTitle = emptyState.querySelector(".empty-title");
const emptyText = emptyState.querySelector(".empty-text");
const emptyAction = emptyState.querySelector(".empty-action");
const searchInput = document.querySelector("#search");
const filterButtons = document.querySelectorAll(".filter-chip");
const sortSelect = document.querySelector("#sort");
const pagerStatus = document.querySelector(".pager-status");
const btnPrevPage = document.querySelector("#prev-page");
const btnNextPage = document.querySelector("#next-page");
const errorMessageContainer = document.querySelector("#error-message-container");
const errorMessage = document.querySelector(".error-message-text");

// * STATE
/** @type {Object[]} Every word of the grimorio, as the API returns it. */
let entries = [];
let currentFilter = "all";
let currentPage = 0;

// TODO > PROGRAM RUN ------------------------------------------------------------
bindLogoutButton();
if (retrievedUserObject) {
    userNameHeader.textContent = retrievedUserObject.username.toUpperCase();
}

bindControls();
showSkeletonRows();
await loadVocabulary();
// ! FIN > PROGRAM RUN -----------------------------------------------------------

// TODO > FUNCTIONS ------------------------------------------------------------
/**
 * Requests the grimorio and draws it. Shows a message if the API fails.
 * @returns {Promise<void>}
 */
async function loadVocabulary() {
    const response = await getVocabulary();

    if (Object.values(ApiErrors).includes(response)) {
        rowsContainer.textContent = "";
        errorMessage.textContent = response === ApiErrors.NETWORK_ERROR
            ? "Verifica tu conexión a internet"
            : "No pudimos cargar tu grimorio. Intenta de nuevo más tarde.";
        errorMessageContainer.classList.remove("hide");
        return;
    }

    entries = response.entries ?? [];
    render();
}

/**
 * Search, filters, order and page buttons.
 * @returns {void}
 */
function bindControls() {
    searchInput.addEventListener("input", () => {
        currentPage = 0;
        render();
    });

    filterButtons.forEach(button => {
        button.addEventListener("click", () => {
            currentFilter = button.dataset.filter;
            filterButtons.forEach(other => other.setAttribute("aria-pressed", String(other === button)));
            currentPage = 0;
            render();
        });
    });

    sortSelect.addEventListener("change", () => {
        currentPage = 0;
        render();
    });

    btnPrevPage.addEventListener("click", () => changePage(-1));
    btnNextPage.addEventListener("click", () => changePage(1));
}

/**
 * Goes to the previous or next page and scrolls back to the top of the table.
 * @param {number} direction - -1 or 1.
 */
function changePage(direction) {
    currentPage += direction;
    render();
    table.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

/**
 * Text without accents and in lowercase, to search without caring about them.
 * @param {string} text
 * @returns {string}
 */
function simplify(text) {
    return String(text ?? "").normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
}

/**
 * Words that pass the search and the filter, in the chosen order.
 * @returns {Object[]}
 */
function getVisibleEntries() {
    const query = simplify(searchInput.value.trim());

    const filtered = entries.filter(entry => {
        if (currentFilter === "learning" && !LEARNING_STATUSES.has(entry.status)) return false;
        if (currentFilter === "learned" && entry.status !== VocabularyStatus.LEARNED) return false;
        if (currentFilter === "ignored" && entry.status !== VocabularyStatus.IGNORED) return false;
        if (!query) return true;
        return simplify(entry.term).includes(query) || simplify(entry.translation).includes(query);
    });

    const sorters = {
        recent: (a, b) => new Date(b.updatedAt ?? b.createdAt) - new Date(a.updatedAt ?? a.createdAt),
        alphabetical: (a, b) => a.term.localeCompare(b.term, undefined, { sensitivity: "base" }),
        level: (a, b) => LEVEL_ORDER.indexOf(a.status) - LEVEL_ORDER.indexOf(b.status)
            || a.term.localeCompare(b.term, undefined, { sensitivity: "base" })
    };
    return filtered.sort(sorters[sortSelect.value] ?? sorters.recent);
}

/**
 * Draws the summary, the current page of words and the page controls.
 * @returns {void}
 */
function render() {
    renderSummary();

    const visible = getVisibleEntries();
    const totalPages = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
    currentPage = Math.min(currentPage, totalPages - 1);

    const pageEntries = visible.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);
    rowsContainer.textContent = "";
    pageEntries.forEach((entry, i) => rowsContainer.appendChild(createRow(entry, i)));

    renderEmptyState(visible.length);

    pagerStatus.textContent = visible.length
        ? `Página ${currentPage + 1} de ${totalPages} · ${visible.length} ${visible.length === 1 ? "palabra" : "palabras"}`
        : "";
    btnPrevPage.disabled = currentPage === 0;
    btnNextPage.disabled = currentPage >= totalPages - 1;
}

/**
 * Totals at the top of the page (always of the whole grimorio, not of the filter).
 * @returns {void}
 */
function renderSummary() {
    const learned = entries.filter(entry => entry.status === VocabularyStatus.LEARNED).length;
    const learning = entries.filter(entry => LEARNING_STATUSES.has(entry.status)).length;
    document.querySelector('[data-summary="total"]').textContent = entries.length;
    document.querySelector('[data-summary="learning"]').textContent = learning;
    document.querySelector('[data-summary="learned"]').textContent = learned;
}

/**
 * Message when there is nothing to show: an empty grimorio, or a search/filter without results.
 * @param {number} visibleCount - Words that pass the search and the filter.
 * @returns {void}
 */
function renderEmptyState(visibleCount) {
    const isEmpty = visibleCount === 0;
    emptyState.classList.toggle("hide", !isEmpty);
    table.classList.toggle("hide", isEmpty);
    if (!isEmpty) return;

    if (entries.length === 0) {
        emptyTitle.textContent = "Tu grimorio está vacío";
        emptyText.textContent = "Abre una lección y toca las palabras que no conozcas: se guardarán aquí para que las repases.";
        emptyAction.classList.remove("hide");
    }
    else {
        emptyTitle.textContent = "No hay palabras que coincidan";
        emptyText.textContent = "Prueba con otra búsqueda o con otro filtro.";
        emptyAction.classList.add("hide");
    }
}

/**
 * Builds the row of one word: term, translations (editable), level buttons and date.
 * Built with DOM nodes (not HTML) so the user's words are never interpreted as HTML.
 *
 * @param {Object} entry - Word of the grimorio.
 * @param {number} index - Position in the page (to stagger the animation).
 * @returns {HTMLTableRowElement}
 */
function createRow(entry, index) {
    const row = document.createElement("tr");
    row.style.setProperty("--i", index);

    const wordCell = document.createElement("td");
    wordCell.className = "cell-word";
    const term = document.createElement("span");
    term.className = "word-term";
    term.classList.toggle("is-learned", entry.status === VocabularyStatus.LEARNED);
    term.textContent = entry.term;
    wordCell.appendChild(term);

    const translationCell = document.createElement("td");
    translationCell.className = "cell-translation";
    translationCell.appendChild(createTranslationView(entry, translationCell));

    const levelCell = document.createElement("td");
    levelCell.className = "cell-level";
    levelCell.appendChild(createLevelButtons(entry));

    const dateCell = document.createElement("td");
    dateCell.className = "cell-date";
    const date = new Date(entry.updatedAt ?? entry.createdAt);
    const time = document.createElement("time");
    time.dateTime = date.toISOString();
    time.textContent = formatDate(date);
    dateCell.appendChild(time);

    row.append(wordCell, translationCell, levelCell, dateCell);
    return row;
}

/**
 * Saved translations as labels, with an "Editar" button.
 * @param {Object} entry - Word of the grimorio.
 * @param {HTMLElement} cell - Cell that holds it (it is swapped for the edit form).
 * @returns {HTMLElement}
 */
function createTranslationView(entry, cell) {
    const view = document.createElement("div");
    view.className = "translation-view";

    const translations = (entry.translation ?? "").split(";").map(text => text.trim()).filter(Boolean);
    if (translations.length) {
        translations.forEach(text => {
            const chip = document.createElement("span");
            chip.className = "translation-chip";
            chip.textContent = text;
            view.appendChild(chip);
        });
    }
    else {
        const empty = document.createElement("span");
        empty.className = "translation-empty";
        empty.textContent = "Sin traducción";
        view.appendChild(empty);
    }

    const editButton = document.createElement("button");
    editButton.type = "button";
    editButton.className = "edit-translation";
    editButton.textContent = "Editar";
    editButton.setAttribute("aria-label", `Editar la traducción de «${entry.term}»`);
    editButton.addEventListener("click", () => {
        cell.replaceChildren(createTranslationForm(entry, cell));
    });
    view.appendChild(editButton);

    return view;
}

/**
 * Form to edit the translations of a word in the same row.
 * Several translations are separated with commas (they are saved with ";", as the API expects).
 * Enter saves, Esc cancels.
 *
 * @param {Object} entry - Word of the grimorio.
 * @param {HTMLElement} cell - Cell that holds it.
 * @returns {HTMLFormElement}
 */
function createTranslationForm(entry, cell) {
    const form = document.createElement("form");
    form.className = "translation-form";

    const inputId = `translation-${entry.id}`;
    const label = document.createElement("label");
    label.className = "visually-hidden";
    label.htmlFor = inputId;
    label.textContent = `Traducción de «${entry.term}»`;

    const input = document.createElement("input");
    input.id = inputId;
    input.type = "text";
    input.value = (entry.translation ?? "").split(";").filter(Boolean).join(", ");
    input.setAttribute("aria-describedby", `${inputId}-hint`);

    const saveButton = document.createElement("button");
    saveButton.type = "submit";
    saveButton.className = "btn btn-primary";
    saveButton.textContent = "Guardar";

    const cancelButton = document.createElement("button");
    cancelButton.type = "button";
    cancelButton.className = "btn";
    cancelButton.textContent = "Cancelar";

    const hint = document.createElement("p");
    hint.id = `${inputId}-hint`;
    hint.className = "translation-hint";
    hint.textContent = "Separa varias traducciones con comas.";

    const closeForm = () => cell.replaceChildren(createTranslationView(entry, cell));
    cancelButton.addEventListener("click", closeForm);
    input.addEventListener("keydown", (event) => {
        if (event.key === "Escape") closeForm();
    });

    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        const translation = input.value.split(",").map(text => text.trim()).filter(Boolean).join(";");

        setBusy(saveButton, true);
        const saved = await saveEntry(entry, { translation });
        setBusy(saveButton, false);
        if (saved) closeForm();
    });

    form.append(label, input, saveButton, cancelButton, hint);
    // El foco pasa al campo para escribir enseguida
    requestAnimationFrame(() => input.focus());
    return form;
}

/**
 * The seven level buttons of a row. The current level stands out (aria-pressed="true").
 * @param {Object} entry - Word of the grimorio.
 * @returns {HTMLElement}
 */
function createLevelButtons(entry) {
    const group = document.createElement("div");
    group.className = "level-buttons";
    group.setAttribute("role", "group");
    group.setAttribute("aria-label", `Nivel de «${entry.term}»`);

    LEVELS.forEach(level => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "level-button";
        button.dataset.status = level.status;
        button.setAttribute("aria-label", level.name);
        button.setAttribute("aria-pressed", String(entry.status === level.status));
        if (level.status === VocabularyStatus.LEARNED) {
            button.innerHTML = CHECK_SVG;
        }
        else {
            button.textContent = level.label;
        }

        button.addEventListener("click", async () => {
            if (entry.status === level.status) return;
            setBusy(button, true);
            const saved = await saveEntry(entry, { status: level.status });
            setBusy(button, false);
            if (!saved) return;

            // Se redibuja solo esta fila (la página y el orden no cambian hasta que se filtre o se ordene)
            if (level.status === VocabularyStatus.LEARNED) {
                burstConfetti(button, { count: 24, power: 0.7 });
            }
            refreshRow(group.closest("tr"), entry);
        });

        group.appendChild(button);
    });

    return group;
}

/**
 * Replaces a row with an updated one, without moving it, and updates the summary.
 * @param {HTMLTableRowElement} row - Current row.
 * @param {Object} entry - Updated word.
 */
function refreshRow(row, entry) {
    const newRow = createRow(entry, 0);
    // Sin la animación de entrada: la fila ya estaba en pantalla
    newRow.style.animation = "none";
    row.replaceWith(newRow);
    renderSummary();
}

/**
 * Saves the changes of a word and updates it in the list.
 * @param {Object} entry - Word of the grimorio (it is updated in place).
 * @param {{ status?: string, translation?: string }} changes
 * @returns {Promise<boolean>} Whether it was saved.
 */
async function saveEntry(entry, changes) {
    const response = await updateVocabularyEntry(entry.id, changes);
    if (Object.values(ApiErrors).includes(response)) {
        console.error(response);
        errorMessage.textContent = "No pudimos guardar el cambio. Intenta de nuevo.";
        errorMessageContainer.classList.remove("hide");
        return false;
    }
    errorMessageContainer.classList.add("hide");
    Object.assign(entry, response);
    return true;
}

/**
 * Short date in Spanish: "hoy", "ayer" or "12 oct 2026".
 * @param {Date} date
 * @returns {string}
 */
function formatDate(date) {
    if (Number.isNaN(date.getTime())) return "—";
    const today = new Date();
    const startOfDay = (value) => new Date(value.getFullYear(), value.getMonth(), value.getDate());
    const days = Math.round((startOfDay(today) - startOfDay(date)) / 86400000);
    if (days === 0) return "Hoy";
    if (days === 1) return "Ayer";
    return date.toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" });
}

/**
 * Placeholder rows while the grimorio loads.
 * @returns {void}
 */
function showSkeletonRows() {
    for (let i = 0; i < 6; i++) {
        const row = document.createElement("tr");
        row.className = "skeleton-row";
        row.setAttribute("aria-hidden", "true");
        // Solo marcado fijo, sin datos
        row.innerHTML = `
            <td class="cell-word"><span class="skeleton" style="width: ${50 + (i % 3) * 15}%"></span></td>
            <td class="cell-translation"><span class="skeleton" style="width: ${40 + (i % 2) * 25}%"></span></td>
            <td class="cell-level"><span class="skeleton skeleton-levels"></span></td>
            <td class="cell-date"><span class="skeleton" style="width: 64px"></span></td>`;
        rowsContainer.appendChild(row);
    }
}
// ! FIN > FUNCTIONS
