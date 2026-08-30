import { retrievedUserObject, refreshAccessToken } from './auth.js';

/**
 * Makes a POST request with Bearer token authentication.
 * Automatically refreshes the access token if it has expired (401 response).
 * 
 * @async
 * @param {string} url - The endpoint URL to make the request to
 * @param {Object} requestObject - The request configuration object
 * @param {Object} requestObject.headers - Request headers object
 * @returns {Promise<Object>} The parsed JSON response data from the server
 * @throws Will return null data if token refresh fails
 */
export async function apiFetch(url, requestObject, includeAuthToken = false) {
    let response;
    let data = false;

    if (includeAuthToken) {
        if(!requestObject.headers){
            requestObject.headers = {};
        }
        requestObject.headers['Authorization'] = `Bearer ${retrievedUserObject.accessToken}`;
    }

    while (true) {
        // Mandar solicitud al endpoint para importar un curso (EPUB)
        response = await fetch(url, requestObject);
        // Si es un error de expiracion de token, mandamos solicitud al endpoint REFRESH para que nos de un nuevo accessToken
        if (response.status === 401 && includeAuthToken) {
            const refreshToken = retrievedUserObject.userRefreshToken;
            const refreshedAccesToken = await refreshAccessToken(refreshToken);

            if (!refreshedAccesToken) {
                break;
            }
            continue;
        }
        if(response.status >= 400){
            return false;
        }
        if(requestObject.method == "DELETE"){
            console.log("Eliminado exitosamente");
            return;
        }

        data = await response.json();
        // Con fines de debug
        // console.log(response);
        // console.log(data);
        return data;
    }
}