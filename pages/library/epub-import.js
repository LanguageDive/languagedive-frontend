import { retrievedUserObject } from '../api-calls/auth.js';
import { ApiErrors } from '../api-calls/api-fetch.js';
import { appendCardsToContainer, cardContainersId, allCoursesCardsContainer, courseSkeletonCardHTML } from './load-course-cards.js'
import { createSkeletonCards, removeSkeletonCards } from '../loading.js'
import { showAlert } from '../alerts.js'
import { postEpub, getCourseById } from '../api-calls/course.js'

const userNameHeader = document.querySelector("#username");

if (!retrievedUserObject) {
    window.location.assign("/login/index.html");
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

    if(!successFileImport(file)){
        return
    }
   
    // console.log("Vas por buen camino papu");
    // console.log(file);
    setImportLoading(true);
    const courseId = await postAndGetCourseId(file);
    const courseReponse = await getCourse(courseId);
    setImportLoading(false);
    if (courseReponse) { appendCardsToContainer([courseReponse], allCoursesCardsContainer, cardContainersId.allCourses); }
});

/**
 * Shows or hides the "Importando…" indicator next to the file picker, and a placeholder
 * card where the new course will appear.
 * @param {boolean} isLoading - Whether the EPUB is being uploaded.
 */
function setImportLoading(isLoading) {
    const importContainer = document.querySelector("#import-courses");
    importContainer.classList.toggle("is-loading", isLoading);
    importContainer.querySelector(".import-status").textContent = isLoading ? "Importando…" : "";

    if (isLoading) {
        allCoursesCardsContainer.append(...createSkeletonCards(1, "card", courseSkeletonCardHTML));
    }
    else {
        removeSkeletonCards(allCoursesCardsContainer);
    }
}

function successFileImport(file) {
    if (!file) {
        showAlert({
            type: "info",
            title: "Elige un libro",
            message: "Selecciona un archivo EPUB para importarlo como curso."
        });
        return false;
    }
    const filenameLower = file.name.toLowerCase();
    //El archivo supera el limite de tamannio o no es EPUB
    if ((file.size > maxFileSize)) {
        showAlert({
            type: "error",
            title: "El archivo es muy grande",
            message: "El límite es de 10 MB. Prueba con otro archivo."
        });
        // Se vacía el selector para poder elegir otro archivo (o el mismo, ya corregido)
        epubFile.value = "";
        return false;
    }
    if ((!filenameLower.endsWith('.epub'))) {
        showAlert({
            type: "error",
            title: "Ese archivo no es un EPUB",
            message: "Solo se pueden importar libros en formato .epub."
        });
        epubFile.value = "";
        return false;
    }

    return true;
}

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
async function postAndGetCourseId(file) {
    const formData = new FormData();
    formData.append('file', file);

    const postEpubResponse = await postEpub(formData);

    if (Object.values(ApiErrors).includes(postEpubResponse)) {
        errorMessageDisplay(postEpubResponse, errorMessage);
        errorMessageContainer.classList.remove("hide");
        return false;
    }

    const courseId = postEpubResponse.id;
    // console.log(courseId);
    // console.log(response);
    // return response;
    return courseId;
};

async function getCourse(courseId) {

    const courseResponse = getCourseById(courseId)

    if (Object.values(ApiErrors).includes(courseResponse)) {
        errorMessageDisplay(courseResponse, errorMessage);
        errorMessageContainer.classList.remove("hide");
        return false;
    }

    errorMessageContainer.classList.add("hide");

    return courseResponse;
}

function errorMessageDisplay(response, HTMLElement) {
    if (response === ApiErrors.NETWORK_ERROR) {
        // console.log("Verifica tu conexión a internet");
        HTMLElement.textContent = "Verifica tu conexión a internet"
    }
    else if (response === ApiErrors.SERVER_ERROR_5XX) {
        // console.log("Hubo un problema desde el servidor, intenta de nuevo más tarde");
        HTMLElement.textContent = "Hubo un problema desde el servidor, intenta de nuevo más tarde";
    }
    else if (response === ApiErrors.EXPIRED_TOKEN_401) {
        HTMLElement.textContent = "Tu token expiró";
    }
}