/**
 * Marks a button, link or region as waiting for the API.
 * Buttons get a spinner and are disabled so they cannot be sent twice;
 * regions are dimmed (see "ESTADOS DE CARGA" in common.css).
 *
 * @param {HTMLElement|null} element - Element to mark.
 * @param {boolean} isBusy - Whether the request is in progress.
 * @returns {void}
 */
export function setBusy(element, isBusy) {
    if (!element) return;
    element.setAttribute("aria-busy", String(isBusy));
    if (element instanceof HTMLButtonElement) {
        element.disabled = isBusy;
    }
}

/**
 * Builds placeholder cards that keep the space of the real cards while they load.
 *
 * @param {number} count - Number of placeholders.
 * @param {string} className - Classes of the placeholder card (the same layout as the real card).
 * @param {string} innerHTML - Skeleton blocks inside each card. Only static markup, never API data.
 * @returns {HTMLElement[]}
 */
export function createSkeletonCards(count, className, innerHTML) {
    return Array.from({ length: count }, () => {
        const card = document.createElement("div");
        card.className = `${className} skeleton-card`;
        card.setAttribute("aria-hidden", "true");
        card.innerHTML = innerHTML;
        return card;
    });
}

/**
 * Removes the placeholder cards created with createSkeletonCards.
 * @param {HTMLElement} container - Element that holds the placeholders.
 * @returns {void}
 */
export function removeSkeletonCards(container) {
    container.querySelectorAll(".skeleton-card").forEach(card => card.remove());
}
