import { retrievedUserObject, refreshAccessToken } from '../api-calls/auth.js';
import { apiFetch, ApiErrors } from '../api-calls/api-fetch.js'

const errorMessageContainer = document.querySelector("#error-message-container");
const errorMessage = document.querySelector(".error-message-text");

const allCoursesContainer = document.querySelector("#all-courses");
const allCoursesCardsContainer = allCoursesContainer.querySelector(".cards");

const btnLogout = document.querySelector("#logout");
btnLogout.addEventListener("click", () => {
    localStorage.clear();
});

const noCoursesContainers = document.querySelectorAll(".no-courses-container");

await loadCourses();

// const newCard = createCard();
// allCoursesCardsContainer.append(newCard)

// const courses = await getCourses();

// console.log(courses, courses.length);

// for(const course of courses){

//     const date = new Date(course.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });

//     const cardObjectInfo = {
//         creationDate: date,
//         title: course.title,
//         totalLessons: course.progress.totalLessons
//     }

//     console.log(cardObjectInfo);

//     const newCard = createCard(cardObjectInfo);
//     // console.log(newCard);
//     allCoursesCardsContainer.append(newCard);

// }

// for(const course of courses){
//     deleteCourse(course.id)
// }

async function loadCourses() {
    const courseReponse = await getCourses();
    console.log(courseReponse);

    if (Object.values(ApiErrors).includes(courseReponse)) {
        if (courseReponse === ApiErrors.NETWORK_ERROR) {
            console.log("Verifica tu conexión a internet");
            errorMessage.textContent = "Verifica tu conexión a internet"
        }
        if (courseReponse === ApiErrors.SERVER_ERROR) {
            console.log("Hubo un problema desde el servidor, intenta de nuevo más tarde")
            errorMessage.textContent = "Hubo un problema desde el servidor, intenta de nuevo más tarde";
        }
        errorMessageContainer.classList.remove("hide");
        return;
    }

    if (courseReponse.length < 1) {
        for (const noCourseContainer of noCoursesContainers) {
            console.log("No hay cursos importados");
            noCourseContainer.classList.remove("hide");
        }
        return;
    }

    for (const course of courseReponse) {

        const date = new Date(course.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });

        const cardObjectInfo = {
            creationDate: date,
            title: course.title,
            totalLessons: course.progress.totalLessons
        }
        const newCard = createCard(cardObjectInfo);
        allCoursesCardsContainer.appendChild(newCard);
    }

    console.log("Cursos cargados");
}

// TODO > LLAMAR A ENDPOINT PARA AGREGAR CURSO
async function getCourses() {

    const url = 'https://languagedive.bryanrodriguez.tech/api/courses';

    const requestObject = {
        method: 'GET'
    };

    const coursesResponse = await apiFetch(url, requestObject, true);

    return coursesResponse;
}

// TODO > LLAMAR A ENDPOINT PARA ELIMINAR CURSO
async function deleteCourse(id) {

    const url = `https://languagedive.bryanrodriguez.tech/api/courses/${id}`;

    const requestObject = {
        method: 'DELETE'
    };

    const courses = await apiFetch(url, requestObject, true);

    return courses;

}

// TODO > CREAR CARDS
function createCard(cardObjectInfo) {
    const card = document.createElement("div");
    card.setAttribute("class", "card");

    const courseCreation = document.createElement("div");
    courseCreation.setAttribute("class", "course-creation");
    courseCreation.textContent = `Creado el ${cardObjectInfo.creationDate}`;

    const courseImage = document.createElement("div");
    courseImage.setAttribute("class", "course-image");

    const image = document.createElement("img");
    image.setAttribute("src", "assets/nickype-snow-7646952.jpg");
    courseImage.appendChild(image);

    const courseInfo = document.createElement("div");
    courseInfo.setAttribute("class", "course-info");

    const courseName = document.createElement("div");
    courseName.setAttribute("class", "course-name");
    courseName.textContent = cardObjectInfo.title;
    courseInfo.append(courseName);

    const horizontalRule = document.createElement("hr");
    courseInfo.appendChild(horizontalRule);

    const courseLessonsNumber = document.createElement("div");
    courseLessonsNumber.setAttribute("class", "course-lessons-number");
    courseLessonsNumber.textContent = `${cardObjectInfo.totalLessons} lecciones`;
    courseInfo.appendChild(courseLessonsNumber);

    card.appendChild(courseCreation);
    card.appendChild(courseImage);
    card.appendChild(courseInfo);

    return card;
}