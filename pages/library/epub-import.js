import { retrievedUserObject, refreshAccessToken } from '../api-calls/auth.js';
import { apiFetch, ApiErrors } from '../api-calls/api-fetch.js';
import { appendCardsToContainer, cardContainersId, allCoursesCardsContainer } from './load-course-cards.js'

const userNameHeader = document.querySelector("#username");

if (!retrievedUserObject) {
    location.assign("/login/index.html");
}
else {
    userNameHeader.textContent = (retrievedUserObject.username).toUpperCase();
}

// * CONTAINER FOR MANAGE ERROR MESSAGE
const errorMessageContainer = document.querySelector("#error-message-container");
const errorMessage = document.querySelector(".error-message-text");

const maxFileSize = 10 * 1024 * 1024;

const epubFile = document.querySelector("#epubFile");
epubFile.addEventListener("change", async () => {
    const file = epubFile.files[0];
    //El archivo no existe
    if (!file) {
        return;
    }
    const filenameLower = file.name.toLowerCase();
    //El archivo supera el limite de tamannio o no es EPUB
    if ((file.size > maxFileSize)) {
        alert("El archivo supera el limite de tamaño (10MB). Intenta con otro archivo");
        return;
    }
    if ((!filenameLower.endsWith('.epub'))) {
        alert("El archivo no es un EPUB, prueba con otro");
        return;
    }
    // console.log("Vas por buen camino papu");
    // console.log(file);
    const courseId = await epubPost(file);
    const courseReponse = await getCourse(courseId);
    if(courseReponse){ appendCardsToContainer([courseReponse], allCoursesCardsContainer, cardContainersId.allCourses); }
});

/**
 * Uploads an EPUB file to the server to import it as a course.
 *
 * This function creates a multipart form payload with the provided file,
 * retries the request if the access token has expired by refreshing it,
 * and returns once the API response is received.
 *
 * @param {File} file - The EPUB file selected by the user to be imported.
 * @returns {Promise<void>} Resolves when the import request completes and the API response is logged.
 */
async function epubPost(file) {
    const formData = new FormData();
    formData.append('file', file);

    const url = "https://languagedive.bryanrodriguez.tech/api/courses/import";
    const requestObject = {
        method: 'POST',
        body: formData
    }

    const response = await apiFetch(url, requestObject, true);

    if (Object.values(ApiErrors).includes(response)) {
        errorMessageDisplay(response, errorMessage);
        errorMessageContainer.classList.remove("hide");
        return false;
    }

    const courseId = response.id;
    // console.log(courseId);
    // console.log(response);
    // return response;
    return courseId;
};

async function getCourse(courseId) {

    const url = `https://languagedive.bryanrodriguez.tech/api/courses/${courseId}`;

    const requestObject = {
        method: 'GET'
    };

    const coursesResponse = await apiFetch(url, requestObject, true);

    if (Object.values(ApiErrors).includes(coursesResponse)) {
        errorMessageDisplay(coursesResponse, errorMessage);
        errorMessageContainer.classList.remove("hide");
        return false;
    }

    errorMessageContainer.classList.add("hide");
    
    return coursesResponse;
}

function errorMessageDisplay(response, errorMessageElement) {
    if (response === ApiErrors.NETWORK_ERROR) {
        // console.log("Verifica tu conexión a internet");
        errorMessageElement.textContent = "Verifica tu conexión a internet"
    }
    else if (response === ApiErrors.SERVER_ERROR) {
        // console.log("Hubo un problema desde el servidor, intenta de nuevo más tarde");
        errorMessageElement.textContent = "Hubo un problema desde el servidor, intenta de nuevo más tarde";
    }
    else if (response === ApiErrors.EXPIRED_TOKEN) {
        errorMessageElement.textContent = "Tu token expiró";
    }
}