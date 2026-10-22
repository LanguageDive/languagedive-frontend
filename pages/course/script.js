import { retrievedUserObject, bindLogoutButton } from '../api-calls/auth.js';
import { getCourseById } from '../api-calls/course.js'
import { getCourseProgress } from '../api-calls/progress.js'
import { createSkeletonCards, removeSkeletonCards } from '../loading.js'
import { ApiErrors } from '../api-calls/api-fetch.js';

const userNameHeader = document.querySelector("#username");
bindLogoutButton();

if (!retrievedUserObject) {
    location.assign("/login/index.html");
}
else {
    userNameHeader.textContent = (retrievedUserObject.username).toUpperCase();
}

// * URL RELATED VARIABLES 
const urlQuery = window.location.search;
const urlParams = new URLSearchParams(urlQuery);
// console.log(urlParams);
const courseId = urlParams.get("id");
// console.log(courseId);

// * LOADING
// Lecciones de carga mientras llegan el curso y los porcentajes de cada lección
const mainGridContainer = document.querySelector("#main-grid-container");
const lessonsCardsContainer = document.querySelector(".cards");
lessonsCardsContainer.append(...createSkeletonCards(5, "card", `
    <div class="lesson-skeleton">
        <span class="skeleton" style="width: 45%"></span>
        <span class="skeleton" style="width: 75%"></span>
    </div>
    <span class="skeleton lesson-skeleton-button"></span>`));

// * API RELATED VARIABLES

const courseResponse = await getCourseById(courseId);
// console.log(courseResponse);

if(Object.values(ApiErrors).includes(courseResponse)){
    console.log("HUBO UN ERROR");
    window.location.assign("/library/index.html");
}

// * DOM RELATED VARIABLES
const numberOfLessonsText = document.querySelector(".lessonsNumber .text");
const courseLessons = courseResponse.lessons;
const lessonsNumber = courseLessons.length;

const cardsContainer = document.querySelector(".cards");
// console.log(lessonsNumber);

numberOfLessonsText.textContent = `Lecciones (${lessonsNumber})`;

//
// TODO > PROGRAM RUN ===================================
const courseProgress = await getCourseProgress(courseResponse);
loadLessons(courseProgress.lessonPercentages);
loadCourseInfo(courseProgress.percentage);
removeSkeletonCards(lessonsCardsContainer);
mainGridContainer.classList.remove("is-loading");

// Al volver con el botón "atrás" el navegador puede mostrar la página guardada en caché
// con el progreso viejo: en ese caso se recarga para pedir el progreso actualizado
window.addEventListener("pageshow", (event) => {
    if (event.persisted) location.reload();
});
// ! END > PROGRAM RUN ===================================

/**
 * Fills the course details panel: date, title, description, progress, cover and "Continuar".
 * @param {number} generalProgress - Real progress of the course (0-100), see getCourseProgress.
 */
function loadCourseInfo(generalProgress){
    const date = new Date(courseResponse.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
    const title = courseResponse.title;
    const description = courseResponse.description;
    // "Lección x / n" indica en qué lección va el usuario (la misma a la que lleva "Continuar")
    const currentLessonNumber = lessonsNumber ? getNextLessonIndex() + 1 : 0;
    const totalLessons = lessonsNumber;

    const dateCreationText = document.querySelector(".course-creation-date");
    const courseTitle = document.querySelector(".course-name");
    const courseDesc = document.querySelector(".course-description-text");
    const courseProgressPercentage = document.querySelector(".course-progress-percentage");
    const courseProgressFraction = document.querySelector(".course-progress-fraction");

    dateCreationText.textContent = `Creado el ${date}`;
    courseTitle.textContent = title;
    // El <strong>Descripción:</strong> del HTML se queda; aquí solo se pone el texto
    courseDesc.textContent = description?.trim() || "Sin descripción";
    courseProgressPercentage.textContent = `Progreso: ${generalProgress}%`;
    courseProgressFraction.textContent = `Lección ${currentLessonNumber} / ${totalLessons}`;

    loadCourseCover(title);
    loadContinueButton();
}

/**
 * Shows the course cover from the API. If the course has none, or it fails to load,
 * the default image of the HTML stays.
 * @param {string} title - Course title, used for the image description.
 */
function loadCourseCover(title) {
    const courseImage = document.querySelector(".course-image-container img");
    courseImage.alt = `Portada de ${title}`;

    if (!courseResponse.coverUrl) return;

    const defaultSrc = courseImage.src;
    courseImage.addEventListener("error", () => { courseImage.src = defaultSrc; }, { once: true });
    courseImage.src = courseResponse.coverUrl;
}

/**
 * Position of the lesson the user is on: the first one not completed,
 * or the first lesson if all of them are completed.
 * @returns {number} Index in courseLessons (call only when there is at least one lesson).
 */
function getNextLessonIndex() {
    const index = courseLessons.findIndex(lesson => !lesson.progress?.completed);
    return index === -1 ? 0 : index;
}

/**
 * Points "Continuar" to the first lesson that is not completed (the lesson page then
 * resumes at the saved sentence). If every lesson is completed it goes to the first one;
 * without lessons the button is hidden.
 */
function loadContinueButton() {
    const btnContinue = document.querySelector(".btn-continue");

    if (lessonsNumber === 0) {
        btnContinue.classList.add("hide");
        return;
    }

    const nextLesson = courseLessons[getNextLessonIndex()];
    btnContinue.href = `../lesson/index.html?id=${courseId}&lessonId=${nextLesson.id}`;
}


/**
 * 
 * Loads and renders all lessons as cards in the container.
 * Iterates through courseLessons array and creates a card for each lesson.
 * @param {number[]} progressPercentages - Progress of each lesson (0-100), in the same order as the lessons.
 */
function loadLessons(progressPercentages) {

    for (let i = 0; i < lessonsNumber; i++) {
        const lessonObject = courseLessons[i];

        console.log(lessonObject);

        const cardObjectInfo = {
            "id": lessonObject.id,
            "lessonNumber": i + 1,
            "title": lessonObject.title,
            "progress": progressPercentages[i]
        }
        const card = createCard(cardObjectInfo);
        // Índice para que las lecciones entren una tras otra (ver .fade-up en common.css)
        card.style.setProperty("--i", i);
        cardsContainer.appendChild(card);
    }
}

/**
 * Creates a lesson card DOM element with lesson information and progress bar.
 * @param {Object} cardObjectInfo - The lesson card information object
 * @param {number} cardObjectInfo.lessonNumber - The lesson number
 * @param {string} cardObjectInfo.title - The lesson title/chapter name
 * @param {number} cardObjectInfo.progress - The lesson progress percentage (0-100)
 * @returns {HTMLElement} A div element representing the lesson card
 */
export function createCard(cardObjectInfo) {

    // CONTENEDOR PRINCIPAL
    const card = document.createElement("div");
    card.className = "card fade-up";
    // Lección terminada: etiqueta verde con estrella (ver .card.is-complete en style.css)
    card.classList.toggle("is-complete", cardObjectInfo.progress === 100);

    // * PARTE IZQUIERDA DEL CONTENEDOR
    const cardLeft = document.createElement("div");
    cardLeft.className = "card-left";

    // * CONTENEDOR DE LA PARTE IZQUIERDA SUPERIOR
    const leftUpper = document.createElement("div");
    leftUpper.className = "left-upper";

    // * CONTENIDO DEL CONTENEDOR DE LA PARTE IZQUIERDA SUPERIOR
    const lessonNumber = document.createElement("p");
    lessonNumber.className = "lesson-number";
    lessonNumber.textContent = `Lección ${cardObjectInfo.lessonNumber}`;
    const horizontalRule = document.createElement("hr");
    const lessonChapterName = document.createElement("p");
    lessonChapterName.className = "lesson-chapter-name";
    lessonChapterName.textContent = cardObjectInfo.title;

    // * ANNIADIR CONTENIDO AL CONTENEDOR DE LA PARTE IZQUIERDA SUPERIOR
    leftUpper.appendChild(lessonNumber);
    leftUpper.appendChild(horizontalRule);
    leftUpper.appendChild(lessonChapterName);

    // * CONTENEDOR DE LA PARTE DERECHA SUPERIOR
    const leftLower = document.createElement("div");
    leftLower.className = "left-lower";

    // * CONTENIDO DEL CONTENEDOR DE LA PARTE DERECHA SUPERIOR
    const lessonProgress = document.createElement("div");
    lessonProgress.className = "lesson-progress";
    lessonProgress.textContent = `${cardObjectInfo.progress}%`;
    lessonProgress.style.width = `${cardObjectInfo.progress}%`;

    // * ANNIADIR CONTENIDO AL CONTENEDOR DE LA PARTE DERECHA SUPERIOR
    leftLower.appendChild(lessonProgress);

    // * ANNIADIR CONTENEDORES SUPERIOR E INFERIOR IZQUIERDOS AL CONTENEDOR PRINCIPAL IZQUIERDO
    cardLeft.appendChild(leftUpper);
    cardLeft.appendChild(leftLower);

    // ? PARTE DERECHA DEL CONTENEDOR
    const cardRight = document.createElement("div");
    cardRight.className = "card-right";

    // ? ENLACE DE LA PARTE DERECHA
    const anchor = document.createElement("a");
    anchor.href = `../lesson/index.html?id=${courseId}&lessonId=${cardObjectInfo.id}`;
    anchor.className = "continue-lesson";
    anchor.textContent = "Continuar ";
    

    // ? SVG DE LA PARTE DERECHA
    const svgNamespace = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNamespace, "svg");
    svg.setAttribute("class", "forward-arrow");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("height", "34");
    svg.setAttribute("aria-hidden", "true");

    // ? LINEA DEL SVG DE LA PARTE DERECHA
    const line = document.createElementNS(svgNamespace, "line");
    line.setAttribute("x1", "5");
    line.setAttribute("y1", "12");
    line.setAttribute("x2", "19");
    line.setAttribute("y2", "12");

    // ? POLILINEA DEL SVG DE LA PARTE DERECHA
    const polyline = document.createElementNS(svgNamespace, "polyline");
    polyline.setAttribute("points", "12 5 19 12 12 19");

    // ? ANNIADIR ELEMENTOS DE LA PARTE DERECHA A SU RESPECTIVO CONTENEDOR
    svg.appendChild(line);
    svg.appendChild(polyline);
    anchor.appendChild(svg);
    cardRight.appendChild(anchor);

    // ? ANNIADIR CONTENEDORES IZQUIERDA Y DERECHA AL CONTEDOR PRINCIPAL
    card.appendChild(cardLeft);
    card.appendChild(cardRight);
    return card;
}


