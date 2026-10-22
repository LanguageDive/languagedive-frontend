// TODO > IMPORTS ------------------------------------------------------------
import { ApiErrors } from '../api-calls/api-fetch.js'
import { getCourses, getCourseById } from '../api-calls/course.js'
import { getCourseProgress } from '../api-calls/progress.js'
import { setupCardsPager } from './cards-pager.js'
import { bindLogoutButton } from '../api-calls/auth.js'
import { createSkeletonCards, removeSkeletonCards } from '../loading.js'

// TODO > CONSTANTS

/**
 * Maps each course section name to its corresponding container index.
 * Used to select the correct cards section in the DOM.
 *
 * @type {Object<string, number>}
 * @property {number} allCourses - Index for the container with all the user's courses.
 * @property {number} inProgressCourses - Index for the container with courses currently in progress.
 */
export const cardContainersId = {
    "allCourses": 0,
    "inProgressCourses": 1
}

// * DOM ERROR MESSAGE
const errorMessageContainer = document.querySelector("#error-message-container");
const errorMessage = document.querySelector(".error-message-text");

// * DOM CARDS
// Contenedor general con los distintos tipos de agrupacion
const userCourses = document.querySelector("#user-courses");
// Obtener los distintos tipos de contenedores especificos del contenedor general
const courseContainers = userCourses.children;
// Container with all courses
export const allCoursesCardsContainer = courseContainers[cardContainersId.allCourses].querySelector(".cards");
//Container with in-progress courses
const inProgressCardsContainer = courseContainers[cardContainersId.inProgressCourses].querySelector(".cards");

// * DOM LOGOUT
bindLogoutButton();

/**
 * Skeleton blocks of a course card while it loads: date, cover and title.
 * @type {string}
 */
export const courseSkeletonCardHTML = `
    <span class="skeleton" style="width: 60%; height: 0.9em"></span>
    <span class="skeleton course-image-skeleton"></span>
    <span class="skeleton" style="width: 80%; height: 1.1em"></span>`;

// * DOM NO COURSES YET CONTAINER
const noCoursesContainers = document.querySelectorAll(".no-courses-container");


// TODO > PROGRAM RUN ------------------------------------------------------------

// * Navegacion por paginas y "Ver más" en las dos secciones
setupCardsPager(courseContainers[cardContainersId.allCourses]);
setupCardsPager(courseContainers[cardContainersId.inProgressCourses]);

// * Cargar cursos
await loadCourses();
// ! FIN > PROGRAM RUN -----------------------------------------------------------

// TODO > FUNCTIONS ------------------------------------------------------------
/**
 * Loads the current user's courses and renders them into the appropriate containers.
 * Handles API errors and empty-state messaging for the course sections.
 * @returns {Promise<void>} Resolves after the courses are loaded and rendered.
 */
async function loadCourses() {
    // Tarjetas de carga con la misma forma que las reales mientras llegan los cursos
    allCoursesCardsContainer.append(...createSkeletonCards(4, "card", courseSkeletonCardHTML));
    inProgressCardsContainer.append(...createSkeletonCards(2, "card", courseSkeletonCardHTML));

    const coursesResponse = await getCourses();
    // console.log(courseResponse);

    removeSkeletonCards(allCoursesCardsContainer);

    // Revisar si hubo un error de API
    if (Object.values(ApiErrors).includes(coursesResponse)) {
        if (coursesResponse === ApiErrors.NETWORK_ERROR) {
            // console.log("Verifica tu conexión a internet");
            errorMessage.textContent = "Verifica tu conexión a internet"
        }
        else if (coursesResponse === ApiErrors.SERVER_ERROR_5XX) {
            // console.log("Hubo un problema desde el servidor, intenta de nuevo más tarde");
            errorMessage.textContent = "Hubo un problema desde el servidor, intenta de nuevo más tarde";
        }
        errorMessageContainer.classList.remove("hide");
        removeSkeletonCards(inProgressCardsContainer);
        return;
    }

    // Revisar si el usuario no ha importado cursos
    if (coursesResponse.length < 1) {
        removeSkeletonCards(inProgressCardsContainer);
        for (const noCourseContainer of noCoursesContainers) {
            // console.log("No hay cursos importados");
            noCourseContainer.classList.remove("hide");
        }
        return;
    }

    // Agregar todos los cursos del usuario al contenedor de cards general
    // (se muestran ya, sin esperar a calcular cuáles están en progreso)
    appendCardsToContainer(coursesResponse, allCoursesCardsContainer, cardContainersId.allCourses);

    // Agregar los cursos en progreso a su contenedor; mientras se calculan siguen los esqueletos
    const inProgressCourses = await getInProgressCourses(coursesResponse);
    removeSkeletonCards(inProgressCardsContainer);
    appendCardsToContainer(inProgressCourses, inProgressCardsContainer, cardContainersId.inProgressCourses);

    // for(const course of coursesResponse){
    //     // console.log(course);
    //     deleteCourse(course.id);
    // }

    // console.log("Todos los cursos cargados");
}

/**
 * Finds the courses the user started but did not finish, with their real progress.
 * The list of courses only has the API's progressPercentage, which counts completed
 * lessons only (a course with a lesson read halfway would be left out). So the detail
 * of every course is requested at the same time and measured with getCourseProgress,
 * the same calculation as the course page.
 *
 * @param {Array<Object>} courses - Courses from getCourses.
 * @returns {Promise<Array<Object>>} Courses in progress, each with `realProgressPercentage`.
 */
async function getInProgressCourses(courses) {
    const results = await Promise.all(courses.map(async (course) => {
        const courseDetail = await getCourseById(course.id);
        // Si un curso no se pudo cargar, se deja fuera de esta sección
        if (Object.values(ApiErrors).includes(courseDetail)) {
            console.error(courseDetail);
            return null;
        }
        const { percentage, isInProgress } = await getCourseProgress(courseDetail);
        return isInProgress ? { ...course, realProgressPercentage: percentage } : null;
    }));

    return results.filter(Boolean);
}

/**
 * Appends a list of course objects to a given cards container and shows the empty-state
 * message when the selected section has no courses.
 * @param {Array<Object>} courses - Course data to render as cards.
 * @param {HTMLElement} cardsContainerType - Container element that will receive the generated cards.
 * @param {number} containerTypeId - Identifier of the target course section (all courses or in-progress courses).
 * @returns {void}
 */
export function appendCardsToContainer(courses, cardsContainerType, containerTypeId) {

    // console.log(courses);
    if (courses.length < 1) {
        // const key = Object.keys(cardContainersId).find(
        //     (key) => cardContainersId[key] === containerTypeId
        // );
        // console.log(`Aun no tienes cursos para esta seccion / contenedor. Tipo de contenedor: ${key}`);
        noCoursesContainers[containerTypeId].classList.remove("hide");
        return;
    }

    noCoursesContainers[containerTypeId].classList.add("hide");

    for (const course of courses) {

        let card;
        //Creación de newCard con cardObjectInfo
        const date = new Date(course.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
        const cardObjectInfo = {
            id: course.id,
            creationDate: date,
            title: course.title,
            totalLessons: course.progress.totalLessons
        };

        const progress = course.progress.progressPercentage;

        // Anniadir cards en la seccion de en progreso (con el progreso real si se calculó)
        if (containerTypeId === cardContainersId.inProgressCourses) {
            cardObjectInfo.progressPercentage = course.realProgressPercentage ?? progress;
            // Creamos una carta para el tipo de contenedor de cursos en progreso
        }

        // Anniadir cards para la seccion de todos los cursos
        card = createCard(cardObjectInfo, containerTypeId);
        // Índice para que las cards entren una tras otra (ver .fade-up en common.css)
        card.style.setProperty("--i", cardsContainerType.children.length);

        // Agregar card al contenedor de cards
        cardsContainerType.appendChild(card);
    }

    // const inProgressCourseContainer = noCoursesContainers[1];
    // inProgressCourseContainer.classList.remove("hide");
}

// TODO > CREAR CARDS
/**
 * Creates a DOM card element for a single course using the provided metadata.
 * @param {Object} cardObjectInfo - Course metadata used to build the card content.
 * @param {number} [containerTypeId=0] - Section identifier that determines card labels and layout.
 * @returns {HTMLAnchorElement} The generated course card element (a link to the course page).
 */
export function createCard(cardObjectInfo, containerTypeId = 0) {

    // Contenedor para cards: es un enlace para poder abrirlo también con el teclado
    const card = document.createElement("a");
    card.setAttribute("class", "card fade-up");
    card.href = `../course/index.html?id=${cardObjectInfo.id}`;

    // Contenedor con la fecha de creacion del curso y anniadir al contenedor de card
    const courseCreation = document.createElement("div");
    courseCreation.setAttribute("class", "course-creation");
    courseCreation.textContent = `Creado el ${cardObjectInfo.creationDate}`;

    // Contenedor para la imagen
    const courseImage = document.createElement("div");
    courseImage.setAttribute("class", "course-image");

    // Imagen y anniadir al contenedor de imagen
    const image = document.createElement("img");
    image.setAttribute("src", "../assets/nickype-snow-7646952.jpg");
    // Decorativa: el título del curso ya está escrito debajo
    image.setAttribute("alt", "");
    // Se decodifica en segundo plano y solo se carga cuando se va a ver (cards fuera de pantalla)
    image.decoding = "async";
    image.loading = "lazy";
    courseImage.appendChild(image);

    // Contenedor para informacion del curso
    const courseInfo = document.createElement("div");
    courseInfo.setAttribute("class", "course-info");

    // Contenedor con el nombre del curso y anniadir al contenedor de informacion del curso
    const courseName = document.createElement("h3");
    courseName.setAttribute("class", "course-name");
    courseName.textContent = cardObjectInfo.title;
    courseInfo.append(courseName);

    // Regla horizontal para separar contenido y anniador al contenedor de informacion del curso
    // const horizontalRule = document.createElement("hr");
    // courseInfo.appendChild(horizontalRule);

    // Contenedor con el numero de lecciones del curso y anniadir al contenedor de informacion del curso
    const courseLessonsNumber = document.createElement("div");
    courseLessonsNumber.setAttribute("class", "course-lessons-number");

    if (containerTypeId === 0) {
        courseLessonsNumber.textContent = `${cardObjectInfo.totalLessons} lecciones`;
    }
    else if (containerTypeId === 1) {
        courseLessonsNumber.textContent = ` Progreso: ${cardObjectInfo.progressPercentage}%`;
    }
    courseInfo.appendChild(courseLessonsNumber);

    /** 
     * Anniadir al contenedor principal de card>
     *  - Contenedor con fecha de creacion de curso
     *  - Contenedor de imagen del curso
     *  - Contenedor de informacion del curso
     */
    card.appendChild(courseCreation);
    card.appendChild(courseImage);
    card.appendChild(courseInfo);

    return card;
}