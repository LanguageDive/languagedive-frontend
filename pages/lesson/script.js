import { retrievedUserObject } from '../api-calls/auth.js';
import { ApiErrors } from '../api-calls/api-fetch.js';
import { getLesson } from '../api-calls/lesson.js'

const userNameHeader = document.querySelector("#username");

if (!retrievedUserObject) {
    location.assign("/login/index.html");
}
else {
    userNameHeader.textContent = (retrievedUserObject.username).toUpperCase();
}

const urlQuery = window.location.search;
const urlParams = new URLSearchParams(urlQuery);
const courseId = urlParams.get('id');
const lessonId = urlParams.get('lessonId');
let page = 0;
const pageSize = 5;
// console.log("courseID>", courseId);
// console.log("lessonID>", lessonId);

let lessonResponse;

try {
    lessonResponse = await getLesson(courseId, lessonId, page, pageSize);
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

// * API RELATED VARIABLES
const lessonTitle = lessonResponse.lessonTitle;
const lessonTotalPages = lessonResponse.totalPages;
let sentences = lessonResponse.sentences

// * DOM RELATED VARIABLES
const lessonNameHTML = document.querySelector(".reading-lesson-name");
const pageProgress = document.querySelector(".page-progress");
const readerText = document.querySelector(".reader-text");
const btnPrevPage = document.querySelector("#prev-page");
const btnNextPage = document.querySelector("#next-page");
const btnExit = document.querySelector(".btn-exit");

const pageHandlingBtns = document.querySelectorAll("#prev-page, #next-page");
// console.log(pageHandlingBtns);

// console.log(btnNextPage.id);

// TODO > PROGRAM RUN
btnExit.href = `/course/index.html?id=${courseId}`;

lessonNameHTML.textContent = `Leyendo: ${lessonTitle}`;

updatePage(page, sentences);
bindPageNavigationEvents();
toggleHideBtns(page);

// ! FIN > PROGRAM RUN

// TODO > FUNCTIONS

function updatePage(page, sentences) {
    readerText.textContent = "";

    pageProgress.textContent = `Página ${page + 1} / ${lessonTotalPages} `
    sentences.forEach(sentenceObject => {
        const sentence = `
        <span>
            ${sentenceObject.text}
        </span>
    `;
        readerText.insertAdjacentHTML('beforeend', sentence);
    });
}

function bindPageNavigationEvents() {
    console.log("Entrando a funcion")
    pageHandlingBtns.forEach((button) => {
        button.addEventListener("click", async () => {
            const buttonId = button.id;

            if (page === 0 && buttonId == "prev-page") {
                console.log("NAVEGACION ANTERIOR BLOQUEADA")
                return;
            }
            if (page === lessonTotalPages - 1 && buttonId == "next-page") {
                console.log("NAVEGACION SIGUIENTE BLOQUEADA")
                return;
            }

            (buttonId == "prev-page") ? page-- : page++;

            try {
                lessonResponse = await getLesson(courseId, lessonId, page, pageSize);
                if (Object.values(ApiErrors).includes(lessonResponse)) {
                    console.log("HUBO UN ERROR");
                    throw new Error(lessonResponse);
                }
            }
            catch (error) {
                window.location.assign("/course/index.html");
                console.error(error);
                return;
            }
            // console.log(lessonResponse);
            pageProgress.textContent = `Página ${page + 1} / ${lessonTotalPages} `
            toggleHideBtns(page);
            sentences = lessonResponse.sentences;
            updatePage(page, sentences);
        });
    });

}

function toggleHideBtns(page) {
    btnPrevPage.classList.toggle('hide', page === 0);
    btnNextPage.classList.toggle('hide', page === lessonTotalPages - 1);
}

// ! FIN > FUNCTIONS