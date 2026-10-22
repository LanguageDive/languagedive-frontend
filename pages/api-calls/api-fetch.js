import { retrievedUserObject, refreshAccessToken, redirectToLogin } from './auth.js';

export const ApiErrors = {
    SERVER_ERROR_5XX: 'server_error',    // el servidor respondió con 5xx o con una respuesta inválida
    EXPIRED_TOKEN_401: 'expired_token',   // no hay sesión o los tokens expiraron
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
 * @param {RequestInit & { headers?: Record<string, string> }} requestObject - Fetch options. It is not modified.
 * @param {boolean} [includeAuthToken=false] - Whether to append the Bearer token from the stored user session.
 * @returns {Promise<Object|undefined|typeof ApiErrors[keyof typeof ApiErrors]>} Parsed JSON response data,
 * undefined when the response has no body (e.g. a successful DELETE), or an ApiErrors code if the request fails.
 * It never throws.
 */
export async function apiFetch(url, requestObject, includeAuthToken = false) {
    // Copia de las opciones para no modificar el objeto de quien llama
    const options = { ...requestObject, headers: { ...requestObject.headers } };

    if (includeAuthToken) {
        // Sin sesión guardada no hay token que enviar: regresamos al login
        if (!retrievedUserObject) {
            redirectToLogin();
            return ApiErrors.EXPIRED_TOKEN_401;
        }
        options.headers['Authorization'] = `Bearer ${retrievedUserObject.accessToken}`;
    }

    let response;
    // Se permite como máximo un reintento después de renovar el token
    let hasRetried = false;

    while (true) {
        try {
            response = await fetch(url, options);
        }
        catch (error) {
            return ApiErrors.NETWORK_ERROR;
        }

        // Si es un error de expiracion de token, mandamos solicitud al endpoint REFRESH para que nos de un nuevo accessToken
        if (response.status === 401 && includeAuthToken && !hasRetried) {
            const refreshedAccessToken = await refreshAccessToken(retrievedUserObject.refreshToken);

            // Sin conexión o sesión caducada: refreshAccessToken devuelve el código de error
            if (Object.values(ApiErrors).includes(refreshedAccessToken)) {
                return refreshedAccessToken;
            }

            options.headers['Authorization'] = `Bearer ${refreshedAccessToken}`;
            hasRetried = true;
            continue;
        }
        // 401 incluso con el token recién renovado
        if (response.status === 401 && includeAuthToken) {
            return ApiErrors.EXPIRED_TOKEN_401;
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

        // Respuestas sin cuerpo (204, DELETE, etc.) no se pueden convertir a JSON
        let body;
        try {
            body = await response.text();
        }
        catch (error) {
            return ApiErrors.NETWORK_ERROR;
        }
        if (!body) {
            return;
        }

        try {
            return JSON.parse(body);
        }
        catch (error) {
            // El servidor respondió con algo que no es JSON válido
            return ApiErrors.SERVER_ERROR_5XX;
        }
    }
}
