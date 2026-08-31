// TODO > IMPORTS ------------------------------------------------------------
import { retrievedUserObject, refreshAccessToken } from '../api-calls/auth.js';
import { apiFetch, ApiErrors } from '../api-calls/api-fetch.js'

// TODO > CONSTANTS

const cardContainers = {
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
const allCoursesCardsContainer = courseContainers[cardContainers.allCourses].querySelector(".cards");
//Container with in-progress courses
const inProgressCardsContainer = courseContainers[cardContainers.inProgressCourses].querySelector(".cards");

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
async function loadCourses() {
    const courseResponse = await getCourses();
    // console.log(courseResponse);

    // Revisar si hubo un error de API
    if (Object.values(ApiErrors).includes(courseResponse)) {
        if (courseResponse === ApiErrors.NETWORK_ERROR) {
            // console.log("Verifica tu conexión a internet");
            errorMessage.textContent = "Verifica tu conexión a internet"
        }
        if (courseResponse === ApiErrors.SERVER_ERROR) {
            // console.log("Hubo un problema desde el servidor, intenta de nuevo más tarde");
            errorMessage.textContent = "Hubo un problema desde el servidor, intenta de nuevo más tarde";
        }
        errorMessageContainer.classList.remove("hide");
        return;
    }

    // Revisar si el usuario no ha importado cursos
    if (courseResponse.length < 1) {
        for (const noCourseContainer of noCoursesContainers) {
            // console.log("No hay cursos importados");
            noCourseContainer.classList.remove("hide");
        }
        return;
    }

    // Filtrar solo los cursos que esten en progreso
    const inProgressCoursesResponse = courseResponse.filter(course => {
        const progress = course.progress.progressPercentage;
        return progress > 0 && progress < 100;
    });

    // Agregar todos los cursos del usuario al contenedor de cards general
    appendCardsToContainer(courseResponse, allCoursesCardsContainer, cardContainers.allCourses);
    // Agregar todos los cursos en progreso del usuario a su respectivo contenedor
    appendCardsToContainer(inProgressCoursesResponse, inProgressCardsContainer, cardContainers.inProgressCourses);

    console.log("Todos los cursos cargados");
}

// * LLAMAR A ENDPOINT PARA OBTENER CURSOS
async function getCourses() {

    const url = 'https://languagedive.bryanrodriguez.tech/api/courses';

    const requestObject = {
        method: 'GET'
    };

    const coursesResponse = await apiFetch(url, requestObject, true);

    return coursesResponse;
}

function appendCardsToContainer(courses, cardsContainerType, containerTypeId) {

    if (courses.length < 1) {
        const key = Object.keys(cardContainers).find(
            (key) => cardContainers[key] === containerTypeId
        );
        console.log(`Aun no tienes cursos para esta seccion / contenedor. Tipo de contenedor: ${key}`);
        noCoursesContainers[containerTypeId].classList.remove("hide");
    }

    for (const course of courses) {

        let card;
        //Creación de newCard con cardObjectInfo
        const date = new Date(course.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
        const cardObjectInfo = {
            creationDate: date,
            title: course.title,
            totalLessons: course.progress.totalLessons
        };

        const progress = course.progress.progressPercentage;

        // Anniadir cards en la seccion de en progreso
        if (containerTypeId === cardContainers.inProgressCourses) {
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
function createCard(cardObjectInfo, containerTypeId = 0) {

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
    image.setAttribute("src", "assets/nickype-snow-7646952.jpg");
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


    return card;
}

// TODO > LLAMAR A ENDPOINT PARA ELIMINAR CURSO
// async function deleteCourse(id) {

//     const url = `https://languagedive.bryanrodriguez.tech/api/courses/${id}`;

//     const requestObject = {
//         method: 'DELETE'
//     };

//     const courses = await apiFetch(url, requestObject, true);

//     return courses;

// }

