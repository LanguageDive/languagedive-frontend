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

// * URL RELATED PARAMS
const urlQuery = window.location.search;
const urlParams = new URLSearchParams(urlQuery);
const courseId = urlParams.get('id');
const lessonId = urlParams.get('lessonId');

// * RELATED INIT VARIABLES TO CALL API
let currentPage = 0;
let currentPageSize = 4;
// console.log("courseID>", courseId);
// console.log("lessonID>", lessonId);

let lessonResponse;

try {
    lessonResponse = await getLesson(courseId, lessonId, currentPage, currentPageSize);
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

// * DOM RELATED VARIABLES
const lessonNameHTML = document.querySelector(".reading-lesson-name");
const pageProgress = document.querySelector(".page-progress");
const readerText = document.querySelector(".reader-text");
const btnPrevPage = document.querySelector("#prev-page");
const btnNextPage = document.querySelector("#next-page");
const btnExit = document.querySelector(".btn-exit");
const pageViewBtns = document.querySelectorAll("#page-view, #sentence-view");

const pageHandlingBtns = document.querySelectorAll("#prev-page, #next-page");
// console.log(pageHandlingBtns);

// console.log(btnNextPage.id);

// TODO > PROGRAM RUN
btnExit.href = `/course/index.html?id=${courseId}`;

lessonNameHTML.textContent = `Leyendo: ${lessonTitle}`;

updatePage(currentPage, lessonTotalPages, sentences);
bindPageNavigationEvents();
toggleHideBtns(currentPage, lessonTotalPages);
bindPageViewEvents();

// ! FIN > PROGRAM RUN

// TODO > FUNCTIONS

function updatePage(page, lessonTotalPages, sentences) {
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
    pageHandlingBtns.forEach((button) => {
        button.addEventListener("click", async () => {
            const buttonId = button.id;

            if (currentPage === 0 && buttonId === "prev-page") return;
            if (currentPage === lessonTotalPages - 1 && buttonId === "next-page") return;

            (buttonId === "prev-page") ? currentPage-- : currentPage++;

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

            pageProgress.textContent = `Página ${currentPage + 1} / ${lessonTotalPages} `;
            toggleHideBtns(currentPage, lessonTotalPages);
            updatePage(currentPage, lessonTotalPages, lessonResponse.sentences);
        });
    });
}

function toggleHideBtns(page, lessonTotalPages) {
    btnPrevPage.classList.toggle('hide', page === 0);
    btnNextPage.classList.toggle('hide', page === lessonTotalPages - 1);
}

function bindPageViewEvents() {
    pageViewBtns.forEach((button) => {
        button.addEventListener("click", async () => {
            const buttonId = button.id;
            currentPageSize = (buttonId === "page-view") ? 4 : 1;

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

            currentPage = lessonResponse.page;
            lessonTotalPages = lessonResponse.totalPages;

            toggleHideBtns(currentPage, lessonTotalPages);
            updatePage(currentPage, lessonTotalPages, lessonResponse.sentences);
        });
    });
}

// ! FIN > FUNCTIONS