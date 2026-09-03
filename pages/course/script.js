import { retrievedUserObject } from '../api-calls/auth.js';
import { getCourseById } from '../api-calls/course.js'
import { ApiErrors } from '../api-calls/api-fetch.js';

const userNameHeader = document.querySelector("#username");

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

// * API RELATED VARIABLES

const courseResponse = await getCourseById(courseId);
// console.log(courseResponse);

if(Object.values(ApiErrors).includes(courseResponse)){
    console.log("HUBO UN ERROR");
    window.location.assign("/library/index.html");
}

// * DOM RELATED VARIABLES
const numberOfLessonsText = document.querySelector(".lessonsNumber").querySelector("p");
const courseLessons = courseResponse.lessons;
const lessonsNumber = courseLessons.length;

const cardsContainer = document.querySelector(".cards");
// console.log(lessonsNumber);

numberOfLessonsText.textContent = `Lecciones (${lessonsNumber})`;

//
// TODO > PROGRAM RUN ===================================
loadLessons();
loadCourseInfo();
// ! END > PROGRAM RUN ===================================

function loadCourseInfo(){
    courseResponse;
    const date = new Date(courseResponse.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
    const title = courseResponse.title;
    const description = courseResponse.description;
    const generalProgress = courseResponse.progress.progressPercentage;
    const completedLessons = courseResponse.progress.completedLessons;
    const totalLessons = courseResponse.progress.totalLessons;

    const dateCreationText = document.querySelector(".course-creation-date");
    const courseTitle = document.querySelector(".course-name");
    const courseDesc = document.querySelector(".course-description");
    const courseProgressPercentage = document.querySelector(".course-progress-percentage");
    const courseProgressFraction = document.querySelector(".course-progress-fraction");

    dateCreationText.textContent = `Creado el ${date}`;
    courseTitle.textContent = title;
    courseDesc.textContent += `Descripción`;
    courseProgressPercentage.textContent = `Progreso: ${generalProgress}%`;
    courseProgressFraction.textContent = `Lección ${completedLessons} / ${totalLessons}`;
}


/**
 * 
 * Loads and renders all lessons as cards in the container.
 * Iterates through courseLessons array and creates a card for each lesson.
 */
function loadLessons() {

    for (let i = 0; i < lessonsNumber; i++) {
        const lessonObject = courseLessons[i];

        console.log(lessonObject);

        const cardObjectInfo = {
            "id": lessonObject.id,
            "lessonNumber": i + 1,
            "title": lessonObject.title,
            "progress": (lessonObject.progress === null ? Math.floor(Math.random() * 101) : lessonObject.progress)
        }
        const card = createCard(cardObjectInfo);
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
    card.className = "card";

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


