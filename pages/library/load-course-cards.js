// TODO > IMPORTS ------------------------------------------------------------
import { ApiErrors } from '../api-calls/api-fetch.js'
import { getCourses} from '../api-calls/course.js'

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
const btnLogout = document.querySelector("#logout");
btnLogout.addEventListener("click", () => {
    localStorage.clear();
});

// * DOM NO COURSES YET CONTAINER
const noCoursesContainers = document.querySelectorAll(".no-courses-container");


// TODO > PROGRAM RUN ------------------------------------------------------------

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
    const coursesResponse = await getCourses();
    // console.log(courseResponse);

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
        return;
    }

    // Revisar si el usuario no ha importado cursos
    if (coursesResponse.length < 1) {
        for (const noCourseContainer of noCoursesContainers) {
            // console.log("No hay cursos importados");
            noCourseContainer.classList.remove("hide");
        }
        return;
    }

    // Filtrar solo los cursos que esten en progreso
    const inProgressCoursesResponse = coursesResponse.filter(course => {
        const progress = course.progress.progressPercentage;
        return progress > 0 && progress < 100;
    });

    // Agregar todos los cursos del usuario al contenedor de cards general
    appendCardsToContainer(coursesResponse, allCoursesCardsContainer, cardContainersId.allCourses);

    // Agregar todos los cursos en progreso del usuario a su respectivo contenedor
    appendCardsToContainer(inProgressCoursesResponse, inProgressCardsContainer, cardContainersId.inProgressCourses);

    // for(const course of coursesResponse){
    //     // console.log(course);
    //     deleteCourse(course.id);
    // }

    // console.log("Todos los cursos cargados");
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

        // Anniadir cards en la seccion de en progreso
        if (containerTypeId === cardContainersId.inProgressCourses) {
            cardObjectInfo.progressPercentage = progress;
            // Creamos una carta para el tipo de contenedor de cursos en progreso
        }

        // Anniadir cards para la seccion de todos los cursos
        card = createCard(cardObjectInfo, containerTypeId);

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
 * @returns {HTMLDivElement} The generated course card element.
 */
export function createCard(cardObjectInfo, containerTypeId = 0) {

    // Contenedor para cards
    const card = document.createElement("div");
    card.setAttribute("class", "card");

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
    courseImage.appendChild(image);

    // Contenedor para informacion del curso
    const courseInfo = document.createElement("div");
    courseInfo.setAttribute("class", "course-info");

    // Contenedor con el nombre del curso y anniadir al contenedor de informacion del curso
    const courseName = document.createElement("div");
    courseName.setAttribute("class", "course-name");
    courseName.textContent = cardObjectInfo.title;
    courseInfo.append(courseName);

    // Regla horizontal para separar contenido y anniador al contenedor de informacion del curso
    const horizontalRule = document.createElement("hr");
    courseInfo.appendChild(horizontalRule);

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

    card.addEventListener('click', () => {
        window.location.assign(`../course/index.html?id=${cardObjectInfo.id}`);
    });

    return card;
}