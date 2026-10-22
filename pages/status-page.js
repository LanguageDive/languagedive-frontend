import { retrievedUserObject } from '/api-calls/auth.js';

/**
 * Status pages ("próximamente" and 404): with a saved session, the "Iniciar sesión" /
 * "Registrarse" links and buttons are swapped for the ones of the user's own pages.
 * Absolute import because the 404 page can be shown at any address.
 */
const isLoggedIn = Boolean(retrievedUserObject);
document.querySelectorAll(".guest-only").forEach(element => element.classList.toggle("hide", isLoggedIn));
document.querySelectorAll(".member-only").forEach(element => element.classList.toggle("hide", !isLoggedIn));
