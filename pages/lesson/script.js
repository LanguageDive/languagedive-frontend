import { retrievedUserObject, bindLogoutButton } from '../api-calls/auth.js';
import { ApiErrors } from '../api-calls/api-fetch.js';
import { getLesson } from '../api-calls/lesson.js'
import { getCourseById } from '../api-calls/course.js'
import { saveLessonProgress } from '../api-calls/progress.js'
import { getVocabulary, saveVocabularyEntry, updateVocabularyEntry, VocabularyStatus } from '../api-calls/vocabulary.js'
import { setBusy } from '../loading.js'
import { burstConfetti, showCelebration } from '../effects.js'
import { showAlert } from '../alerts.js'
import { getTranslationSuggestions, DictionaryErrors, toLanguageCode } from '../api-calls/dictionary.js'

const userNameHeader = document.querySelector("#username");
bindLogoutButton();

if (!retrievedUserObject) {
    location.assign("/login/index.html");
}
else {
    userNameHeader.textContent = (retrievedUserObject.username).toUpperCase();
}

// * URL RELATED PARAMS
const urlQuery = window.location.search;
const urlParams = new URLSearchParams(urlQuery);
const courseId = urlParams.get('id');
const lessonId = urlParams.get('lessonId');

// * RELATED INIT VARIABLES TO CALL API
// Oraciones por página en cada vista
const PAGE_VIEW_SIZE = 4;
const SENTENCE_VIEW_SIZE = 1;

// Qué cuenta como palabra: letras con apóstrofos y guiones internos (p. ej. "don't", "arc-en-ciel").
// El apóstrofo o el guion solo cuentan si les sigue una letra: así la comilla de cierre de
// ‘Hello’ no se pega a la palabra. La usan el texto clicable y el conteo de palabras aprendidas
const WORD_PATTERN = "\\p{L}(?:[\\p{L}\\p{M}]|['’‘ʼ´`-](?=\\p{L}))*";

/**
 * Key used to compare words: lowercase and with the typographic apostrophes (’ ‘ ʼ ´ `)
 * turned into the straight one ('). This way "Don’t" in a book and "don't" in the
 * vocabulary are the same word.
 * @param {string} word - The word as it appears.
 * @returns {string}
 */
function normalizeTerm(word) {
    return word.toLowerCase().replace(/[’‘ʼ´`]/g, "'");
}

// La lección empieza en la vista de página
let currentPageSize = PAGE_VIEW_SIZE;
// console.log("courseID>", courseId);
// console.log("lessonID>", lessonId);

// El progreso guardado viene en el detalle del curso (el endpoint de la lección no lo incluye).
// Se pide junto con el vocabulario para no esperar dos veces
const [courseResponse, vocabularyResponse] = await Promise.all([getCourseById(courseId), getVocabulary()]);
const savedProgress = getSavedLessonProgress(courseResponse);
// Idioma del libro (lo detecta la API al importar el EPUB): para la voz y las sugerencias
// (normalizado: los metadatos pueden decir "en-US", "eng" o "English")
const courseLanguage = toLanguageCode(Object.values(ApiErrors).includes(courseResponse) ? null : courseResponse.language);
// Idioma de las traducciones
const TRANSLATION_LANGUAGE = "es";

// Se retoma en la oración guardada; si la lección ya estaba completada se vuelve a empezar
const resumeSentenceIndex = (savedProgress && !savedProgress.completed) ? savedProgress.sentenceIndex : 0;
// La página depende del tamaño de la vista, por eso se calcula a partir de la oración
let currentPage = Math.floor(resumeSentenceIndex / currentPageSize);

let lessonResponse;

try {
    lessonResponse = await getLesson(courseId, lessonId, currentPage, currentPageSize);
    // La oración guardada ya no existe (p. ej. la lección cambió): se empieza desde el principio
    if (!Object.values(ApiErrors).includes(lessonResponse) && lessonResponse.sentences.length === 0 && currentPage > 0) {
        currentPage = 0;
        lessonResponse = await getLesson(courseId, lessonId, currentPage, currentPageSize);
    }
    if (Object.values(ApiErrors).includes(lessonResponse)) {
        console.log("HUBO UN ERROR");
        throw new Error(lessonResponse);
    }
}
catch (error) {
    window.location.assign("/course/index.html");
    console.error(error);
    throw error;
}
console.log(lessonResponse);

// * API RELATED VARIABLES
const lessonTitle = lessonResponse.lessonTitle;
let lessonTotalPages = lessonResponse.totalPages;
const sentences = lessonResponse.sentences
const lessonTotalSentences = lessonResponse.totalSentences;

// * VOCABULARY RELATED VARIABLES
/**
 * Saved words indexed by their term in lowercase.
 * @type {Map<string, Object>}
 */
const vocabularyByTerm = new Map();
// Si falla, se puede seguir leyendo: solo no se colorean las palabras guardadas
if (Object.values(ApiErrors).includes(vocabularyResponse)) {
    console.error(vocabularyResponse);
}
else {
    vocabularyResponse.entries.forEach(entry => vocabularyByTerm.set(normalizeTerm(entry.term), entry));
}

/**
 * Status that each word progress button assigns.
 * @type {Object<string, string>}
 */
const statusByButtonClass = {
    "unknown": VocabularyStatus.IGNORED,
    "level-one": VocabularyStatus.NEW,
    "level-two": VocabularyStatus.LEVEL_2,
    "level-three": VocabularyStatus.LEVEL_3,
    "level-four": VocabularyStatus.LEVEL_4,
    "level-five": VocabularyStatus.LEVEL_5,
    "kwnown": VocabularyStatus.LEARNED
};

// Palabra seleccionada en el texto (en minúsculas), o null si no hay ninguna
let selectedTerm = null;
// La aparición concreta que se tocó: solo ella lleva el anillo de selección.
// El color del nivel, en cambio, se aplica a todas las apariciones de la palabra
let selectedWordElement = null;

// * DICTIONARY RELATED VARIABLES
/**
 * Translation suggestions already requested in this visit, by word.
 * @type {Map<string, { state: "loading"|"ready"|"error", items?: string[], error?: string }>}
 */
const suggestionsByTerm = new Map();
// La voz del navegador (Web Speech API) no existe en todos los navegadores
const canSpeak = "speechSynthesis" in window;
// Petición de la lección completa (todas sus oraciones): se hace una sola vez
let fullLessonRequest = null;

// * PROGRESS RELATED VARIABLES
// Tiempo sin interactuar antes de guardar el progreso
const PROGRESS_SAVE_DELAY_MS = 2000;
let progressSaveTimeout = null;
// Una vez completada, la lección no vuelve a marcarse como no completada
let lessonCompleted = savedProgress?.completed ?? false;
// Se parte de la posición mostrada para no guardar nada si el usuario sale sin moverse
let lastSavedProgress = {
    sentenceIndex: lessonCompleted ? lessonTotalSentences - 1 : (sentences[0]?.index ?? 0),
    completed: lessonCompleted
};

// * DOM RELATED VARIABLES
const lessonNameHTML = document.querySelector(".reading-lesson-name");
const pageProgress = document.querySelector(".page-progress");
const saveStatus = document.querySelector(".save-status");
const readerText = document.querySelector(".reader-text");
const btnPrevPage = document.querySelector("#prev-page");
const btnNextPage = document.querySelector("#next-page");
const btnFinish = document.querySelector("#finish-lesson");
const btnExit = document.querySelector(".btn-exit");
const pageViewBtns = document.querySelectorAll("#page-view, #sentence-view");

const pageHandlingBtns = document.querySelectorAll("#prev-page, #next-page");

const readerMain = document.querySelector("#reader-main");
const wordPanel = document.querySelector("#grid-right");
const wordDetails = wordPanel.querySelector(".word-details");
const wordTitle = wordPanel.querySelector(".word");
const wordDefinition = wordPanel.querySelector(".definition");
const translationList = wordPanel.querySelector(".traduction-list");
const translationInput = wordPanel.querySelector("#customize-traduction");
const btnAddTranslation = wordPanel.querySelector("#traduction-container button");
const wordStatusBtns = wordPanel.querySelectorAll("#word-progress-buttons > button");
const btnSpeak = wordPanel.querySelector(".speak-word");
const suggestionsBox = wordPanel.querySelector(".suggestions");
const suggestionList = wordPanel.querySelector(".suggestion-list");
// console.log(pageHandlingBtns);

// console.log(btnNextPage.id);

// TODO > PROGRAM RUN
btnExit.href = `/course/index.html?id=${courseId}`;

lessonNameHTML.textContent = `Leyendo: ${lessonTitle}`;

updatePage(currentPage, lessonTotalPages, sentences, true);
bindPageNavigationEvents();
toggleHideBtns(currentPage, lessonTotalPages);
bindPageViewEvents();
renderWordPanel();
bindWordPanelEvents();
bindProgressEvents();
// Ya hay datos: se quitan los esqueletos de carga
document.querySelector("#main-grid").classList.remove("is-loading");

// ! FIN > PROGRAM RUN

// TODO > FUNCTIONS

/**
 * Renders the sentences of the current page and updates the page progress bar.
 *
 * @param {number} page - Current page index (0-based).
 * @param {number} lessonTotalPages - Total pages in the lesson.
 * @param {Array<Object>} sentences - Sentences of the current page.
 * @param {boolean} [isFirstRender=false] - Plays the lesson entrance animation instead of the page-change fade.
 */
function updatePage(page, lessonTotalPages, sentences, isFirstRender = false) {
    readerText.textContent = "";
    readerText.classList.toggle("is-entering", isFirstRender);

    renderPageProgress(page, sentences);
    sentences.forEach((sentenceObject, i) => {
        const sentence = createSentence(sentenceObject.text);
        // Índice para escalonar la animación de entrada (ver .is-entering en style.css)
        sentence.style.setProperty("--i", i);
        readerText.appendChild(sentence);
    });
}

/**
 * Updates the "Página n / m · x%" label and the fill of the progress bar.
 * The percentage is measured in sentences, so it is the same in page and sentence view.
 *
 * @param {number} page - Current page index (0-based).
 * @param {Array<Object>} sentences - Sentences of the current page.
 */
function renderPageProgress(page, sentences) {
    const readPercentage = getReadPercentage(page, sentences);
    pageProgress.textContent = `Página ${page + 1} / ${lessonTotalPages} · ${readPercentage}%`;
    // Relleno de la barra de progreso (ver .page-progress en style.css)
    pageProgress.style.setProperty("--progress", `${readPercentage}%`);
}

/**
 * Builds a sentence element where every word is a clickable span.
 * Uses DOM nodes instead of HTML strings so the book text is never interpreted as HTML.
 *
 * @param {string} text - The sentence text.
 * @returns {HTMLSpanElement}
 */
function createSentence(text) {
    const sentence = document.createElement("span");
    sentence.className = "sentence";

    // Separa palabras (letras, apóstrofos y guiones internos) del resto del texto
    const parts = text.split(new RegExp(`(${WORD_PATTERN})`, "u"));
    parts.forEach((part, i) => {
        // Las posiciones impares son las palabras capturadas por el split
        if (i % 2 === 0) {
            sentence.append(part);
            return;
        }
        const word = document.createElement("span");
        word.className = "reader-word";
        word.dataset.term = normalizeTerm(part);
        word.textContent = part;
        paintWord(word);
        sentence.appendChild(word);
    });
    sentence.append(" ");

    return sentence;
}

/**
 * Applies the color class of the word's saved status.
 * @param {HTMLElement} wordElement - A `.reader-word` span.
 */
function paintWord(wordElement) {
    const entry = vocabularyByTerm.get(wordElement.dataset.term);
    Object.values(VocabularyStatus).forEach(status => wordElement.classList.remove(`status-${status}`));
    if (entry) {
        wordElement.classList.add(`status-${entry.status}`);
    }
    wordElement.classList.toggle("selected", wordElement === selectedWordElement);
}

function repaintWords() {
    readerText.querySelectorAll(".reader-word").forEach(paintWord);
}

/**
 * Shows the selected word, its saved meanings and its status in the right panel.
 */
function renderWordPanel() {
    const entry = selectedTerm ? vocabularyByTerm.get(selectedTerm) : undefined;

    wordTitle.textContent = selectedTerm ?? "Selecciona una palabra";
    translationList.textContent = "";

    const translations = entry?.translation ? entry.translation.split(";").filter(Boolean) : [];
    wordDefinition.textContent = translations.length
        ? translations.join(", ")
        : (selectedTerm ? "Aún no guardaste un significado." : "Haz clic en una palabra del texto.");

    translations.forEach((translation, i) => {
        const item = document.createElement("li");
        item.className = "traduction";
        item.textContent = translation;
        item.style.animationDelay = `${i * 50}ms`;
        translationList.appendChild(item);
    });

    btnSpeak.classList.toggle("hide", !selectedTerm || !canSpeak);
    renderSuggestions();

    translationInput.disabled = !selectedTerm;
    btnAddTranslation.disabled = !selectedTerm;
    wordStatusBtns.forEach(button => {
        button.disabled = !selectedTerm;
        button.classList.toggle("active", entry?.status === statusByButtonClass[button.className.split(" ")[0]]);
    });
}

function bindWordPanelEvents() {
    readerText.addEventListener("click", (event) => {
        const word = event.target.closest(".reader-word");
        if (!word) return;

        selectedTerm = word.dataset.term;
        selectedWordElement = word;
        translationInput.value = "";
        loadSuggestions(selectedTerm);
        repaintWords();
        renderWordPanel();
        replayAnimation(wordDetails, "is-changing");
    });

    btnSpeak.addEventListener("click", speakSelectedWord);

    // Tocar una sugerencia la guarda como traducción
    suggestionList.addEventListener("click", async (event) => {
        const chip = event.target.closest(".suggestion");
        if (!chip || chip.classList.contains("is-saved")) return;
        await addTranslation(chip.dataset.translation, chip);
    });

    btnAddTranslation.addEventListener("click", async () => {
        const saved = await addTranslation(translationInput.value.trim(), btnAddTranslation);
        if (saved) translationInput.value = "";
    });

    wordStatusBtns.forEach(button => {
        button.addEventListener("click", async () => {
            if (!selectedTerm) return;
            const status = statusByButtonClass[button.className.split(" ")[0]];
            setBusy(button, true);
            const saved = await saveWord(selectedTerm, { status });
            setBusy(button, false);
            // Palabra aprendida: confeti saliendo del botón
            if (saved && status === VocabularyStatus.LEARNED) {
                burstConfetti(button, { count: 28, power: 0.8 });
            }
        });
    });
}

/**
 * Adds a translation to the selected word (from the field or from a suggestion).
 * If the word already has that translation it is not repeated.
 *
 * @param {string} newTranslation - Translation to add.
 * @param {HTMLElement} busyElement - Button that shows the loading state while saving.
 * @returns {Promise<boolean>} Whether it was saved.
 */
async function addTranslation(newTranslation, busyElement) {
    if (!selectedTerm || !newTranslation) return false;

    const entry = vocabularyByTerm.get(selectedTerm);
    const current = entry?.translation ? entry.translation.split(";").filter(Boolean) : [];
    if (current.some(translation => translation.toLowerCase() === newTranslation.toLowerCase())) return true;

    setBusy(busyElement, true);
    const saved = await saveWord(selectedTerm, { translation: [...current, newTranslation].join(";") });
    setBusy(busyElement, false);
    return saved;
}

/**
 * All the sentences of the lesson, requested once per visit
 * (the count of learned words of the celebration uses them).
 * @returns {Promise<Array<Object>|null>} Sentences in order, or null if they could not be loaded.
 */
function getFullLessonSentences() {
    if (!fullLessonRequest) {
        fullLessonRequest = getLesson(courseId, lessonId, 0, lessonTotalSentences).then(response => {
            if (Object.values(ApiErrors).includes(response)) {
                console.error(response);
                // Se permite volver a intentarlo más tarde
                fullLessonRequest = null;
                return null;
            }
            return response.sentences;
        });
    }
    return fullLessonRequest;
}

/**
 * Requests translation suggestions for a word, once per visit.
 * If the user taps another word before the answer arrives, the answer is kept in the
 * cache but does not replace what the panel shows.
 * @param {string} term - Word (normalized).
 */
async function loadSuggestions(term) {
    if (courseLanguage === TRANSLATION_LANGUAGE || suggestionsByTerm.has(term)) return;

    suggestionsByTerm.set(term, { state: "loading" });
    const result = await getTranslationSuggestions(term, courseLanguage, TRANSLATION_LANGUAGE);

    suggestionsByTerm.set(term, Array.isArray(result)
        ? { state: "ready", items: result }
        : { state: "error", error: result });
    // Una búsqueda fallida se puede repetir al volver a tocar la palabra (salvo si se agotó el límite)
    if (result === DictionaryErrors.NETWORK_ERROR) {
        setTimeout(() => suggestionsByTerm.delete(term), 0);
    }

    if (term === selectedTerm) renderSuggestions();
}

/**
 * Draws the suggestions of the selected word: loading placeholders, the labels to tap
 * (the ones already saved are marked) or a short message if there are none.
 */
function renderSuggestions() {
    const suggestion = selectedTerm ? suggestionsByTerm.get(selectedTerm) : undefined;
    suggestionsBox.classList.toggle("hide", !suggestion);
    if (!suggestion) return;

    suggestionList.textContent = "";

    if (suggestion.state === "loading") {
        for (let i = 0; i < 3; i++) {
            const placeholder = document.createElement("span");
            placeholder.className = "skeleton suggestion-skeleton";
            suggestionList.appendChild(placeholder);
        }
        return;
    }

    if (suggestion.state === "error") {
        const messages = {
            [DictionaryErrors.LIMIT_REACHED]: "Se agotaron las sugerencias de hoy. Puedes escribir tu propia traducción.",
            [DictionaryErrors.NO_RESULTS]: "No encontramos sugerencias para esta palabra.",
            [DictionaryErrors.NETWORK_ERROR]: "No pudimos traer sugerencias. Toca la palabra otra vez para reintentar."
        };
        const message = document.createElement("p");
        message.className = "suggestions-message";
        message.textContent = messages[suggestion.error] ?? messages[DictionaryErrors.NO_RESULTS];
        suggestionList.appendChild(message);
        return;
    }

    const entry = vocabularyByTerm.get(selectedTerm);
    const saved = (entry?.translation ?? "").toLowerCase().split(";");

    suggestion.items.forEach((item, i) => {
        const chip = document.createElement("button");
        chip.type = "button";
        chip.className = "suggestion";
        chip.dataset.translation = item;
        chip.style.animationDelay = `${i * 60}ms`;
        chip.textContent = item;

        const isSaved = saved.includes(item.toLowerCase());
        chip.classList.toggle("is-saved", isSaved);
        chip.setAttribute("aria-label", isSaved ? `${item} (ya guardada)` : `Guardar la traducción «${item}»`);
        suggestionList.appendChild(chip);
    });
}

/**
 * Pronounces the selected word with the browser voice, in the language of the book.
 */
function speakSelectedWord() {
    if (!canSpeak || !selectedTerm) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(selectedWordElement?.textContent ?? selectedTerm);
    utterance.lang = courseLanguage;
    utterance.rate = 0.85;
    utterance.addEventListener("start", () => btnSpeak.classList.add("is-speaking"));
    utterance.addEventListener("end", () => btnSpeak.classList.remove("is-speaking"));
    utterance.addEventListener("error", () => btnSpeak.classList.remove("is-speaking"));
    window.speechSynthesis.speak(utterance);
}

/**
 * Creates the word in the vocabulary, or updates it if it was already saved.
 *
 * @param {string} term - The word in lowercase.
 * @param {{ translation?: string, status?: string }} changes - Fields to save.
 * @returns {Promise<boolean>} Whether the word was saved.
 */
async function saveWord(term, changes) {
    const entry = vocabularyByTerm.get(term);

    const response = entry
        ? await updateVocabularyEntry(entry.id, changes)
        : await saveVocabularyEntry(term, changes.translation ?? "", changes.status ?? VocabularyStatus.NEW);

    if (Object.values(ApiErrors).includes(response)) {
        console.error(response);
        return false;
    }

    vocabularyByTerm.set(term, response);
    repaintWords();
    renderWordPanel();
    return true;
}

/**
 * Finds the saved reading progress of this lesson inside the course detail.
 *
 * @param {Object|string} courseResponse - Response of getCourseById, or an ApiErrors code.
 * @returns {{ sentenceIndex: number, completed: boolean }|null} The saved progress, or null if
 * there is none or the course could not be loaded (the lesson then starts from the beginning).
 */
function getSavedLessonProgress(courseResponse) {
    if (Object.values(ApiErrors).includes(courseResponse)) {
        console.error(courseResponse);
        return null;
    }
    const lesson = courseResponse.lessons.find(lessonSummary => String(lessonSummary.id) === lessonId);
    return lesson?.progress ?? null;
}

/**
 * Percentage of the lesson read: sentences before the current position over the total,
 * or 100% on the last page of a completed lesson.
 * Uses the same formula as the course page so both show the same percentage.
 *
 * @param {number} page - Current page index (0-based).
 * @param {Array<Object>} sentences - Sentences of the current page.
 * @returns {number} Whole number from 0 to 100.
 */
function getReadPercentage(page, sentences) {
    if (!lessonTotalSentences) return 100;
    if (lessonCompleted && page === lessonTotalPages - 1) return 100;
    const firstShownIndex = sentences[0]?.index ?? 0;
    return Math.round((firstShownIndex / lessonTotalSentences) * 100);
}

/**
 * Index of the first sentence shown on the current page.
 * @returns {number}
 */
function getCurrentSentenceIndex() {
    return lessonResponse.sentences[0]?.index ?? 0;
}

/**
 * Sends the reading progress if it changed since the last save.
 * @param {boolean} [keepalive=false] - Use when the page is being closed.
 * @returns {Promise<"saved"|"unchanged"|"error">} What happened with the save.
 */
async function saveProgress(keepalive = false) {
    clearTimeout(progressSaveTimeout);

    const sentenceIndex = lessonCompleted ? lessonTotalSentences - 1 : getCurrentSentenceIndex();
    if (sentenceIndex === lastSavedProgress.sentenceIndex && lessonCompleted === lastSavedProgress.completed) return "unchanged";

    const progressToSave = { sentenceIndex, completed: lessonCompleted };
    renderSaveStatus("saving");
    const response = await saveLessonProgress(lessonId, sentenceIndex, lessonCompleted, keepalive);
    if (Object.values(ApiErrors).includes(response)) {
        console.error(response);
        renderSaveStatus("error");
        return "error";
    }
    lastSavedProgress = progressToSave;
    renderSaveStatus("saved");
    return "saved";
}

/**
 * Full-screen celebration for a completed lesson, with what the user achieved.
 * @returns {Promise<void>}
 */
async function showLessonCelebration() {
    const stats = [{ icon: "book", text: `${lessonTotalSentences} oraciones leídas` }];

    const learnedWords = await countLearnedLessonWords();
    // Si no se pudo cargar la lección completa, se celebra sin este dato
    if (learnedWords) {
        stats.push({ icon: "bulb", text: `${learnedWords.learned} de ${learnedWords.total} palabras aprendidas` });
    }
    stats.push({ icon: "cards", text: `${vocabularyByTerm.size} palabras en tu grimorio` });

    showCelebration({
        title: "¡Lección completada!",
        stats,
        primary: { label: "Volver al curso", href: btnExit.href },
        secondaryLabel: "Seguir leyendo"
    });
}

/**
 * Counts how many different words of the lesson the user has marked as learned.
 * The page only has the current page loaded, so the whole lesson is requested once.
 * Words are compared with normalizeTerm inside a Set, so repeated words count once.
 *
 * @returns {Promise<{ learned: number, total: number }|null>} null if the lesson could not be loaded.
 */
async function countLearnedLessonWords() {
    const fullSentences = await getFullLessonSentences();
    if (!fullSentences) return null;

    const wordRegex = new RegExp(WORD_PATTERN, "gu");
    const lessonWords = new Set();
    fullSentences.forEach(sentence => {
        sentence.text.match(wordRegex)?.forEach(word => lessonWords.add(normalizeTerm(word)));
    });

    let learned = 0;
    lessonWords.forEach(term => {
        if (vocabularyByTerm.get(term)?.status === VocabularyStatus.LEARNED) learned++;
    });

    return { learned, total: lessonWords.size };
}

// Temporizador que oculta "Progreso guardado" después de un momento
let saveStatusTimeout = null;

/**
 * Shows the state of the automatic progress save under the progress bar.
 * "Progreso guardado" disappears after a moment; an error stays until the next save.
 *
 * @param {"saving"|"saved"|"error"} state - Current state of the save.
 */
function renderSaveStatus(state) {
    clearTimeout(saveStatusTimeout);
    saveStatus.classList.toggle("is-saving", state === "saving");
    saveStatus.classList.toggle("is-error", state === "error");

    const messages = {
        saving: "Guardando…",
        saved: "Progreso guardado",
        error: "No se pudo guardar el progreso"
    };
    saveStatus.textContent = messages[state];

    if (state === "saved") {
        saveStatusTimeout = setTimeout(() => { saveStatus.textContent = ""; }, 2000);
    }
}

/**
 * Dims the text and disables page and view buttons while a page is requested,
 * so the user cannot ask for another page until this one arrives.
 * @param {boolean} isLoading - Whether a page is being requested.
 */
function setReaderLoading(isLoading) {
    setBusy(readerMain, isLoading);
    pageHandlingBtns.forEach(button => { button.disabled = isLoading; });
    btnFinish.disabled = isLoading;
    pageViewBtns.forEach(button => { button.disabled = isLoading; });
}

/**
 * "Terminar" button: marks the lesson as completed, saves it right away and, once the API
 * confirms it, shows the celebration. If the lesson was already completed it is celebrated
 * again (the user pressed the button and expects an answer). If the save fails, an alert
 * says so and the button can be pressed again.
 * @returns {Promise<void>}
 */
async function finishLesson() {
    setBusy(btnFinish, true);
    lessonCompleted = true;
    renderPageProgress(currentPage, lessonResponse.sentences);

    const result = await saveProgress();
    setBusy(btnFinish, false);

    if (result === "error") {
        showAlert({
            type: "error",
            title: "No pudimos guardar tu progreso",
            message: "Revisa tu conexión y pulsa «Terminar» otra vez."
        });
        return;
    }
    showLessonCelebration();
}

/**
 * Saves the progress after the user stops interacting for a moment.
 */
function scheduleProgressSave() {
    clearTimeout(progressSaveTimeout);
    progressSaveTimeout = setTimeout(saveProgress, PROGRESS_SAVE_DELAY_MS);
}

function bindProgressEvents() {
    // La lección solo se completa con el botón "Terminar" de la última página
    btnFinish.addEventListener("click", finishLesson);

    window.addEventListener("pagehide", () => saveProgress(true));

    // Al volver al curso se espera a que el progreso se guarde, para que el curso ya lo muestre
    btnExit.addEventListener("click", async (event) => {
        event.preventDefault();
        setBusy(btnExit, true);
        await saveProgress();
        window.location.assign(btnExit.href);
    });
}

function bindPageNavigationEvents() {
    pageHandlingBtns.forEach((button) => {
        button.addEventListener("click", async () => {
            const buttonId = button.id;

            if (currentPage === 0 && buttonId === "prev-page") return;
            if (currentPage === lessonTotalPages - 1 && buttonId === "next-page") return;

            (buttonId === "prev-page") ? currentPage-- : currentPage++;

            setReaderLoading(true);
            try {
                lessonResponse = await getLesson(courseId, lessonId, currentPage, currentPageSize);
                if (Object.values(ApiErrors).includes(lessonResponse)) {
                    throw new Error(lessonResponse);
                }
            } catch (error) {
                window.location.assign("/course/index.html");
                console.error(error);
                return;
            }
            setReaderLoading(false);

            toggleHideBtns(currentPage, lessonTotalPages);
            // Primero se marca si la lección quedó completada, para que la barra ya muestre el 100%
            scheduleProgressSave();
            updatePage(currentPage, lessonTotalPages, lessonResponse.sentences);
        });
    });
}

function toggleHideBtns(page, lessonTotalPages) {
    // is-hidden conserva el hueco del botón para que el otro no cambie de sitio
    btnPrevPage.classList.toggle('is-hidden', page === 0);
    // En la última página, "Terminar" ocupa el lugar de "Página siguiente"
    const isLastPage = page === lessonTotalPages - 1;
    btnNextPage.classList.toggle('hide', isLastPage);
    btnFinish.classList.toggle('hide', !isLastPage);
}

function bindPageViewEvents() {
    pageViewBtns.forEach((button) => {
        button.addEventListener("click", async () => {
            const buttonId = button.id;
            currentPageSize = (buttonId === "page-view") ? PAGE_VIEW_SIZE : SENTENCE_VIEW_SIZE;
            pageViewBtns.forEach(viewButton => viewButton.setAttribute("aria-pressed", String(viewButton === button)));
            // Página donde cae la oración actual con el nuevo tamaño, para no perder la posición
            currentPage = Math.floor(getCurrentSentenceIndex() / currentPageSize);

            setReaderLoading(true);
            try {
                lessonResponse = await getLesson(courseId, lessonId, currentPage, currentPageSize);
                if (Object.values(ApiErrors).includes(lessonResponse)) {
                    throw new Error(lessonResponse);
                }
            } catch (error) {
                window.location.assign("/course/index.html");
                console.error(error);
                return;
            }
            setReaderLoading(false);

            currentPage = lessonResponse.page;
            lessonTotalPages = lessonResponse.totalPages;

            toggleHideBtns(currentPage, lessonTotalPages);
            // Primero se marca si la lección quedó completada, para que la barra ya muestre el 100%
            scheduleProgressSave();
            updatePage(currentPage, lessonTotalPages, lessonResponse.sentences);
        });
    });
}

/**
 * Restarts a CSS animation by removing and adding back its class.
 * @param {HTMLElement} element - Element to animate.
 * @param {string} className - Class that applies the animation.
 */
function replayAnimation(element, className) {
    element.classList.remove(className);
    // Leer el tamaño obliga al navegador a aplicar el cambio antes de volver a poner la clase
    void element.offsetWidth;
    element.classList.add(className);
}

// ! FIN > FUNCTIONS