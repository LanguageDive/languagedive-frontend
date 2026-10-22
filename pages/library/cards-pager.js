// TODO > FUNCTIONS ------------------------------------------------------------
/**
 * Turns a course section into a single-row pager: cards that do not fit in the
 * visible row keep flowing to the right (hidden) and the previous/next buttons
 * scroll one full page of cards at a time.
 * The "Ver más" button switches between that row and a grid with every card
 * ("Ver menos" goes back). It only shows up when there are more cards than fit in the row.
 * @param {HTMLElement} section - Section element containing a `.cards` container, `.btns-page-shift` buttons and a `.see-more` button.
 * @returns {void}
 */
export function setupCardsPager(section) {
    const cardsContainer = section.querySelector(".cards");
    const btnPrevious = section.querySelector(".previous-page");
    const btnNext = section.querySelector(".next-page");
    const pageShiftButtons = section.querySelector(".btns-page-shift");
    const btnSeeMore = section.querySelector(".see-more");

    cardsContainer.classList.add("paged");
    let cardsPerPage = 1;

    btnPrevious.addEventListener("click", () => shiftPage(-1));
    btnNext.addEventListener("click", () => shiftPage(1));
    btnSeeMore.addEventListener("click", () => toggleExpanded());

    // Actualizar botones al desplazarse, al cambiar el tamaño y al agregar cards
    // Durante el scroll se actualiza como mucho una vez por fotograma
    let isUpdateScheduled = false;
    cardsContainer.addEventListener("scroll", () => {
        if (isUpdateScheduled) return;
        isUpdateScheduled = true;
        requestAnimationFrame(() => {
            isUpdateScheduled = false;
            updateButtons();
        });
    }, { passive: true });
    new ResizeObserver(updateLayout).observe(cardsContainer);
    new MutationObserver(() => {
        updateButtons();
        updateSeeMore();
    }).observe(cardsContainer, { childList: true });

    updateLayout();

    /**
     * Returns the horizontal distance between the start of two consecutive pages.
     * @returns {number} Page width in pixels, including the gap after the last visible card.
     */
    function getPageWidth() {
        const gap = parseFloat(getComputedStyle(cardsContainer).columnGap) || 0;
        return cardsContainer.clientWidth + gap;
    }

    /**
     * Recalculates how many cards fit per page and realigns the scroll to a page boundary.
     * @returns {void}
     */
    function updateLayout() {
        const containerStyle = getComputedStyle(cardsContainer);
        const gap = parseFloat(containerStyle.columnGap) || 0;
        // Ancho mínimo de card definido en style.css (--card-min-width)
        const minCardWidth = parseFloat(containerStyle.getPropertyValue("--card-min-width")) || 260;
        cardsPerPage = Math.max(1, Math.floor((cardsContainer.clientWidth + gap) / (minCardWidth + gap)));
        cardsContainer.style.setProperty("--cards-per-page", cardsPerPage);

        // Al redimensionar, evitar quedar a media página (solo en la fila; la cuadrícula no hace scroll)
        if (isPaged()) {
            const currentPage = Math.round(cardsContainer.scrollLeft / getPageWidth());
            cardsContainer.scrollTo({ left: currentPage * getPageWidth(), behavior: "instant" });
        }

        updateButtons();
        updateSeeMore();
    }

    /**
     * Whether the section shows the single row (true) or the grid with every card (false).
     * @returns {boolean}
     */
    function isPaged() {
        return cardsContainer.classList.contains("paged");
    }

    /**
     * Number of real course cards (without the loading placeholders).
     * @returns {number}
     */
    function countCourseCards() {
        return cardsContainer.querySelectorAll(".card:not(.skeleton-card)").length;
    }

    /**
     * Shows "Ver más" only when some cards do not fit in the row. While the grid is
     * open it stays visible as "Ver menos", so the user can always go back.
     * @returns {void}
     */
    function updateSeeMore() {
        const hasHiddenCards = countCourseCards() > cardsPerPage;
        btnSeeMore.classList.toggle("hide", isPaged() && !hasHiddenCards);
    }

    /**
     * Switches between the row with arrows and the grid with every card.
     * With the View Transitions API each card moves smoothly to its new place;
     * without it (or with reduced motion) the change is instant.
     * @returns {void}
     */
    function toggleExpanded() {
        const willExpand = isPaged();

        const applyChange = () => {
            cardsContainer.classList.toggle("paged", !willExpand);
            pageShiftButtons.classList.toggle("hide", willExpand);
            btnSeeMore.textContent = willExpand ? "Ver menos" : "Ver más";
            btnSeeMore.setAttribute("aria-expanded", String(willExpand));
            if (!willExpand) cardsContainer.scrollLeft = 0;
            updateButtons();
            updateSeeMore();
        };

        const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        if (!document.startViewTransition || prefersReducedMotion) {
            applyChange();
            if (!willExpand) section.scrollIntoView({ block: "nearest" });
            return;
        }

        // Cada card necesita un nombre único durante la transición para animarse por separado.
        // Se quitan al terminar porque las dos secciones pueden tener el mismo curso
        const cards = Array.from(cardsContainer.querySelectorAll(".card:not(.skeleton-card)"));
        cards.forEach((card, i) => { card.style.viewTransitionName = `${cardsContainer.id}-card-${i}`; });

        const transition = document.startViewTransition(applyChange);
        // Si la transición se salta (p. ej. otro clic antes de que termine o la pestaña se oculta),
        // "ready" se rechaza con AbortError. El cambio se aplica igual, así que no es un error
        transition.ready.catch(() => {});
        transition.finished.finally(() => {
            cards.forEach(card => { card.style.viewTransitionName = ""; });
            // Al cerrar, la sección puede quedar lejos si la cuadrícula era larga
            if (!willExpand) section.scrollIntoView({ behavior: "smooth", block: "nearest" });
        });
    }

    /**
     * Scrolls the cards container to the previous/next page boundary. If the user left
     * the row at an intermediate position (swipe or Shift + wheel), it first aligns to
     * the nearest page in that direction instead of jumping a full page.
     * @param {number} direction - `-1` for the previous page, `1` for the next one.
     * @returns {void}
     */
    function shiftPage(direction) {
        const pageWidth = getPageWidth();
        // Margen para ignorar decimales del scroll al comparar posiciones
        const position = cardsContainer.scrollLeft / pageWidth;
        const tolerance = 0.02;
        const targetPage = direction > 0
            ? Math.floor(position + tolerance) + 1
            : Math.ceil(position - tolerance) - 1;

        cardsContainer.scrollTo({ left: Math.max(0, targetPage) * pageWidth, behavior: "smooth" });
    }

    /**
     * Disables the previous/next buttons when there is no page in that direction.
     * @returns {void}
     */
    function updateButtons() {
        // Primero se leen todas las medidas y luego se escribe, y solo si cambió:
        // cambiar disabled altera los estilos y obligaría a recalcular la siguiente lectura
        const maxScroll = cardsContainer.scrollWidth - cardsContainer.clientWidth;
        const isAtStart = cardsContainer.scrollLeft <= 1;
        const isAtEnd = cardsContainer.scrollLeft >= maxScroll - 1;
        if (btnPrevious.disabled !== isAtStart) btnPrevious.disabled = isAtStart;
        if (btnNext.disabled !== isAtEnd) btnNext.disabled = isAtEnd;
    }
}
