/**
 * LanguageDive alerts: replace the browser's alert() with a dialog in the app's style.
 * It is a modal <dialog>: focus stays on its button, Esc closes it and, when it closes,
 * focus goes back to where it was. Styles in the "ALERTAS" section of common.css.
 */

/**
 * Icon and color of each kind of alert (icons from assets/icons).
 * @type {Object<string, string>}
 */
const ALERT_ICONS = {
    error: "sad",
    warning: "warning",
    info: "info",
    success: "sparkles"
};

/**
 * Shows an alert and waits until the user closes it.
 *
 * @param {Object} options
 * @param {string} options.title - Short headline.
 * @param {string} [options.message=""] - Explanation and what to do next.
 * @param {"error"|"warning"|"info"|"success"} [options.type="info"] - Kind of alert (icon and color).
 * @param {string} [options.buttonLabel="Entendido"] - Text of the button that closes it.
 * @returns {Promise<void>} Resolves when the alert is closed.
 */
export function showAlert({ title, message = "", type = "info", buttonLabel = "Entendido" }) {
    return new Promise((resolve) => {
        const dialog = document.createElement("dialog");
        dialog.className = `ld-alert ld-alert-${type}`;
        dialog.setAttribute("role", "alertdialog");
        dialog.setAttribute("aria-labelledby", "ld-alert-title");
        dialog.setAttribute("aria-describedby", "ld-alert-message");

        // Solo marcado fijo: los textos se ponen con textContent más abajo
        dialog.innerHTML = `
            <span class="ld-alert-badge" aria-hidden="true"><span class="icon icon-${ALERT_ICONS[type] ?? "info"}"></span></span>
            <h2 id="ld-alert-title" class="ld-alert-title"></h2>
            <p id="ld-alert-message" class="ld-alert-message"></p>
            <button type="button" class="btn btn-primary ld-alert-button"></button>`;

        dialog.querySelector(".ld-alert-title").textContent = title;
        dialog.querySelector(".ld-alert-message").textContent = message;
        const button = dialog.querySelector(".ld-alert-button");
        button.textContent = buttonLabel;

        const close = () => {
            if (dialog.classList.contains("is-closing")) return;
            dialog.classList.add("is-closing");

            let finished = false;
            const finish = () => {
                if (finished) return;
                finished = true;
                dialog.close();
                dialog.remove();
                resolve();
            };
            // Solo cuenta la animación del propio diálogo, no la de sus hijos
            dialog.addEventListener("animationend", (event) => {
                if (event.target === dialog) finish();
            });
            // Respaldo por si la animación no llega a dispararse (p. ej. con movimiento reducido)
            setTimeout(finish, 300);
        };

        button.addEventListener("click", close);
        // Esc: se cierra con la misma animación que el botón
        dialog.addEventListener("cancel", (event) => {
            event.preventDefault();
            close();
        });
        // Clic fuera de la tarjeta (en el fondo oscuro) también la cierra. El fondo cuenta como
        // parte del <dialog>, así que se compara con el recuadro de la tarjeta
        dialog.addEventListener("click", (event) => {
            const rect = dialog.getBoundingClientRect();
            const isOutside = event.clientX < rect.left || event.clientX > rect.right
                || event.clientY < rect.top || event.clientY > rect.bottom;
            if (isOutside) close();
        });

        document.body.appendChild(dialog);
        dialog.showModal();
        button.focus();
    });
}
