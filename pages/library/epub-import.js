import {retrievedUserObject, refreshAccessToken} from '../api-calls/auth.js';
import { apiFetch } from '../api-calls/api-fetch.js';

const userNameHeader = document.querySelector("#username");

if(!retrievedUserObject){
    location.assign("/login/index.html");
}
else{
    userNameHeader.textContent = (retrievedUserObject.username).toUpperCase();
}

const maxFileSize = 10 * 1024 * 1024;

const epubFile = document.querySelector("#epubFile");
epubFile.addEventListener("change", () => {
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
    epubPost(file);
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

    console.log(response);
    return response;

};