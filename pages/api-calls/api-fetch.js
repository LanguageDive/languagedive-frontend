import { retrievedUserObject, refreshAccessToken } from './auth.js';

export const ApiErrors = {
    SERVER_ERROR_5XX: 'server_error',    // el servidor respondió con 4xx/5xx
    EXPIRED_TOKEN_401: 'expired_token',   // los token expiraron
    NETWORK_ERROR: 'network_error',   // no se pudo conectar en absoluto
    NOT_FOUND_404: "not_found",  // el recurso no existe
    CLIENT_ERROR_4XX: "client_error"     // error desde cliente
};

/**
 * Performs an HTTP request and optionally injects the current access token.
 * If the request receives a 401 and auth is enabled, it tries to refresh the
 * token and retries the same request once.
 *
 * @async
 * @param {string} url - Endpoint URL to call.
 * @param {RequestInit & { headers?: Record<string, string> }} requestObject - Fetch options.
 * @param {boolean} [includeAuthToken=false] - Whether to append the Bearer token from the stored user session.
 * @returns {Promise<Object|undefined|string>} Parsed JSON response data, or undefined for successful DELETE requests.
 * @returns {Promise<typeof ApiErrors[keyof typeof ApiErrors]>} If the request fails due to a network error, server error, or expired token.
 * @throws {typeof ApiErrors[keyof typeof ApiErrors]} Returns a typed error code instead of throwing when the request fails.
 */
export async function apiFetch(url, requestObject, includeAuthToken = false) {
    let response;
    let data = false;

    if (includeAuthToken) {
        if (!requestObject.headers) {
            requestObject.headers = {};
        }
        requestObject.headers['Authorization'] = `Bearer ${retrievedUserObject.accessToken}`;
    }

    while (true) {
        try {
            response = await fetch(url, requestObject);
        }
        catch (error) {
            return ApiErrors.NETWORK_ERROR;
        }
        // Si es un error de expiracion de token, mandamos solicitud al endpoint REFRESH para que nos de un nuevo accessToken
        if (response.status === 401 && includeAuthToken) {
            const refreshToken = retrievedUserObject.userRefreshToken;
            const refreshedAccesToken = await refreshAccessToken(refreshToken);

            if (!refreshedAccesToken) {
                return ApiErrors.EXPIRED_TOKEN_401;
            }

            requestObject.headers['Authorization'] = `Bearer ${refreshedAccesToken}`;
            continue;
        }
        if (response.status >= 500) {
            return ApiErrors.SERVER_ERROR_5XX;
        }
        if (response.status === 404) {
            return ApiErrors.NOT_FOUND_404;
        }
        if (response.status >= 400) {
            return ApiErrors.CLIENT_ERROR_4XX;
        }
        if (requestObject.method == "DELETE") {
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