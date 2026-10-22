import { ApiErrors } from './api-fetch.js';
import { setBusy } from '../loading.js';

/**
 * Gets the serialized user from localStorage.
 * @type {string|null}
 */
export const serializedUser = localStorage.getItem("userData");

/**
 * User object parsed from JSON, or null if there is no stored session.
 * @type {Object|null}
 */
export const retrievedUserObject = JSON.parse(serializedUser);

/**
 * Refresh request currently in progress. Shared so that several requests
 * receiving a 401 at the same time trigger a single refresh.
 * @type {Promise<string>|null}
 */
let refreshInProgress = null;

/**
 * Sends the user back to the login page.
 * @returns {void}
 */
export function redirectToLogin() {
    window.location.assign("/login/index.html");
}

/**
 * Closes the session: invalidates the refresh token on the server, clears the
 * stored session and sends the user to the login page.
 * The local session is cleared even if the server could not be reached.
 *
 * @async
 * @returns {Promise<void>}
 */
export async function logout() {
    if (retrievedUserObject) {
        try {
            await fetch("https://languagedive.bryanrodriguez.tech/api/auth/logout", {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    'refreshToken': retrievedUserObject.refreshToken
                })
            });
        }
        catch (error) {
            // Sin conexión: igual cerramos la sesión local
            console.error(error);
        }
    }

    localStorage.clear();
    redirectToLogin();
}

/**
 * Makes the header "Salir" link close the session through the API.
 * @returns {void}
 */
export function bindLogoutButton() {
    const btnLogout = document.querySelector("#logout");
    if (!btnLogout) return;

    btnLogout.addEventListener("click", (event) => {
        // Evitamos la navegación inmediata para que la petición alcance a enviarse
        event.preventDefault();
        setBusy(btnLogout, true);
        logout();
    });
}

/**
 * Updates the access token by sending the refresh token to the server.
 * Concurrent calls share the same request.
 *
 * @async
 * @function refreshAccessToken
 * @param {string} refreshToken - The user's refresh token to obtain a new access token
 * @returns {Promise<string>} The new access token if successful, `ApiErrors.NETWORK_ERROR` if the
 * server could not be reached, or `ApiErrors.EXPIRED_TOKEN_401` if the session is no longer valid
 * (in that case the user is redirected to login).
 *
 * @description
 * This function sends a POST request to the server to obtain a new access token.
 * If successful, it updates the user object in localStorage with the new tokens.
 */
export function refreshAccessToken(refreshToken) {
    if (!refreshInProgress) {
        refreshInProgress = requestNewTokens(refreshToken).finally(() => {
            refreshInProgress = null;
        });
    }
    return refreshInProgress;
}

/**
 * Performs the actual refresh request. Use refreshAccessToken instead of calling this directly.
 * @async
 * @param {string} refreshToken - The user's refresh token.
 * @returns {Promise<string>} Same as refreshAccessToken.
 */
async function requestNewTokens(refreshToken) {
    let response;
    try {
        // Mandar solicitud al endpoint de refresh para obtener un nuevo accessToken
        response = await fetch("https://languagedive.bryanrodriguez.tech/api/auth/refresh", {
            method: "POST",
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                'refreshToken': refreshToken
            })
        });
    }
    catch (error) {
        // Sin conexión: no cerramos la sesión, solo avisamos del error de red
        return ApiErrors.NETWORK_ERROR;
    }

    try {
        // Si nos da un error debido a que el usuario no ha entrado en mucho tiempo, lanzamos un error
        if (!response.ok) {
            throw new Error(`Refresh rechazado con estado ${response.status}`);
        }
        const tokens = await response.json();

        // Actualizamos el objeto del usuario
        retrievedUserObject.accessToken = tokens.accessToken;
        retrievedUserObject.refreshToken = tokens.refreshToken;
        // Guardamos el objeto serializado en localStorage
        localStorage.setItem("userData", JSON.stringify(retrievedUserObject));
        // Retornamos el nuevo accessToken
        return retrievedUserObject.accessToken;
    }
    catch (error) {
        // La sesión ya no es válida: devolvemos al usuario al login
        console.error(error);
        redirectToLogin();
        return ApiErrors.EXPIRED_TOKEN_401;
    }
}
