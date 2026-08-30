import { retrievedUserObject, refreshAccessToken } from '../api-calls/auth.js';
import { apiFetch } from '../api-calls/api-fetch.js'

const allCoursesContainer = document.querySelector("#all-courses");
// console.log(allCoursesContainer);
const allCoursesCardsContainer = allCoursesContainer.querySelector(".cards");
// console.log(allCoursesCardsContainer);

const btnAddCard = document.querySelector("#addCard");
btnAddCard.addEventListener("click", () => {
    const newCard = createCard();
    allCoursesCardsContainer.append(newCard);
})

// const newCard = createCard();
// allCoursesCardsContainer.append(newCard)

const courses = await getCourses();
console.log(courses, courses.length);

for(const course of courses){

    const date = new Date(course.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });

    const cardObjectInfo = {
        creationDate: date,
        title: course.title,
        totalLessons: course.progress.totalLessons
    }

    console.log(cardObjectInfo);

    const newCard = createCard(cardObjectInfo);
    // console.log(newCard);
    allCoursesCardsContainer.append(newCard);

}

for(const course of courses){
    deleteCourse(course.id)
}

// TODO > LLAMAR A ENDPOINT PARA AGREGAR CURSO
async function getCourses() {

    const url = 'https://languagedive.bryanrodriguez.tech/api/courses';

    const requestObject = {
        method: 'GET'
    };

    const courses = await apiFetch(url, requestObject, true);

    return courses;

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
function createCard(cardObjectInfo){
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