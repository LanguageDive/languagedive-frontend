/**
 * Special effects: confetti bursts and the full-screen celebration.
 * Styles are in the "EFECTOS ESPECIALES" section of common.css.
 */

const CONFETTI_COLORS = ["#1B6FD1", "#FFD23F", "#FF7A7A", "#2FBF71", "#8B6CF6"];

/**
 * Whether the user asked the system to reduce motion.
 * @returns {boolean}
 */
function prefersReducedMotion() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Throws confetti from an element (or from the top center of the screen).
 * Does nothing if the user prefers reduced motion.
 *
 * @param {HTMLElement|null} [origin=null] - Element the confetti comes out of.
 * @param {{ count?: number, power?: number, container?: HTMLElement }} [options] - Number of pieces,
 * how far they fly, and where to put them (inside an open dialog, or it would stay behind it).
 * @returns {void}
 */
export function burstConfetti(origin = null, { count = 40, power = 1, container = document.body } = {}) {
    if (prefersReducedMotion()) return;

    const rect = origin?.getBoundingClientRect();
    const startX = rect ? rect.left + rect.width / 2 : window.innerWidth / 2;
    const startY = rect ? rect.top + rect.height / 2 : window.innerHeight * 0.25;

    const layer = document.createElement("div");
    layer.className = "confetti-layer";
    layer.setAttribute("aria-hidden", "true");
    container.appendChild(layer);

    let longestDuration = 0;

    for (let i = 0; i < count; i++) {
        const piece = document.createElement("span");
        piece.className = "confetti-piece";

        const size = 6 + Math.random() * 6;
        piece.style.width = `${size}px`;
        piece.style.height = `${size * (Math.random() < 0.5 ? 1 : 1.8)}px`;
        piece.style.left = `${startX}px`;
        piece.style.top = `${startY}px`;
        piece.style.backgroundColor = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
        piece.style.borderRadius = Math.random() < 0.4 ? "50%" : "2px";
        layer.appendChild(piece);

        // Sale disparado hacia arriba en abanico y luego cae por "gravedad"
        const angle = (-Math.PI / 2) + (Math.random() - 0.5) * Math.PI * 1.2;
        const speed = (120 + Math.random() * 180) * power;
        const dx = Math.cos(angle) * speed;
        const dy = Math.sin(angle) * speed;
        const fall = (220 + Math.random() * 200) * power;
        const rotation = (Math.random() - 0.5) * 900;
        const duration = 1100 + Math.random() * 700;
        longestDuration = Math.max(longestDuration, duration);

        piece.animate([
            { transform: "translate(-50%, -50%) rotate(0deg)", opacity: 1 },
            { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) rotate(${rotation / 2}deg)`, opacity: 1, offset: 0.35 },
            { transform: `translate(calc(-50% + ${dx * 1.3}px), calc(-50% + ${dy + fall}px)) rotate(${rotation}deg)`, opacity: 0 }
        ], {
            duration,
            easing: "cubic-bezier(0.25, 0.8, 0.5, 1)",
            fill: "forwards"
        });
    }

    setTimeout(() => layer.remove(), longestDuration + 100);
}

/**
 * Full-screen celebration: the water rises, a golden pearl with a star appears, the title
 * drops letter by letter and the achievements and buttons show up. Uses a modal <dialog>,
 * so focus stays inside, Esc closes it and the page behind cannot be used.
 * Styles in the "CELEBRACIÓN A PANTALLA COMPLETA" section of common.css.
 *
 * @param {Object} options
 * @param {string} options.title - Main message.
 * @param {{ icon: string, text: string }[]} [options.stats=[]] - Short achievements shown as labels.
 * `icon` is the name of an icon in assets/icons (e.g. "book" for .icon-book).
 * @param {{ label: string, href: string }} options.primary - Main action (a link).
 * @param {string} options.secondaryLabel - Text of the button that closes the celebration.
 * @returns {HTMLDialogElement}
 */
export function showCelebration({ title, stats = [], primary, secondaryLabel }) {
    document.querySelector("dialog.celebration")?.remove();

    const dialog = document.createElement("dialog");
    dialog.className = "celebration";
    dialog.setAttribute("aria-labelledby", "celebration-title");

    // Solo marcado fijo: los textos se ponen con textContent más abajo
    dialog.innerHTML = `
        <div class="celebration-water" aria-hidden="true">
            <svg class="celebration-wave" viewBox="0 0 1200 48" preserveAspectRatio="none">
                <path d="M0 24 Q150 0 300 24 T600 24 T900 24 T1200 24 V48 H0 Z" />
            </svg>
        </div>
        <div class="celebration-rays" aria-hidden="true"></div>
        <div class="celebration-content">
            <div class="celebration-medal" aria-hidden="true"><span class="celebration-star"></span></div>
            <h2 id="celebration-title" class="celebration-title"></h2>
            <ul class="celebration-stats"></ul>
            <div class="celebration-actions">
                <a class="btn btn-sunny celebration-primary"></a>
                <button type="button" class="btn celebration-secondary"></button>
            </div>
        </div>`;

    addBubbles(dialog, 14);

    // Cada letra en su propio span para que caiga por separado; el lector de pantalla lee el título entero
    const titleElement = dialog.querySelector(".celebration-title");
    titleElement.setAttribute("aria-label", title);
    Array.from(title).forEach((character, i) => {
        const letter = document.createElement("span");
        letter.className = "celebration-letter";
        letter.setAttribute("aria-hidden", "true");
        letter.style.setProperty("--i", i);
        letter.textContent = character;
        titleElement.appendChild(letter);
    });

    const statsList = dialog.querySelector(".celebration-stats");
    stats.forEach((stat, i) => {
        const item = document.createElement("li");
        item.style.setProperty("--i", i);

        const icon = document.createElement("span");
        icon.className = `icon icon-${stat.icon}`;
        icon.setAttribute("aria-hidden", "true");
        item.append(icon, stat.text);

        statsList.appendChild(item);
    });

    const primaryLink = dialog.querySelector(".celebration-primary");
    primaryLink.textContent = primary.label;
    primaryLink.href = primary.href;

    const secondaryButton = dialog.querySelector(".celebration-secondary");
    secondaryButton.textContent = secondaryLabel;
    secondaryButton.addEventListener("click", () => closeCelebration(dialog));

    // Esc: se cierra con la misma animación que el botón
    dialog.addEventListener("cancel", (event) => {
        event.preventDefault();
        closeCelebration(dialog);
    });

    document.body.appendChild(dialog);
    dialog.showModal();
    primaryLink.focus();

    // El confeti sale de la perla cuando termina de aparecer
    const medal = dialog.querySelector(".celebration-medal");
    setTimeout(() => {
        burstConfetti(medal, { count: 60, power: 1.3, container: dialog });
    }, 900);
    setTimeout(() => {
        burstConfetti(medal, { count: 40, power: 1.1, container: dialog });
    }, 1300);

    return dialog;
}

/**
 * Adds bubbles with random size, position and speed to the celebration.
 * @param {HTMLElement} container - Element that receives the bubbles.
 * @param {number} count - Number of bubbles.
 */
function addBubbles(container, count) {
    for (let i = 0; i < count; i++) {
        const bubble = document.createElement("span");
        bubble.className = "celebration-bubble";
        bubble.setAttribute("aria-hidden", "true");
        bubble.style.setProperty("--x", `${Math.random() * 100}%`);
        bubble.style.setProperty("--size", `${10 + Math.random() * 34}px`);
        bubble.style.setProperty("--duration", `${5 + Math.random() * 5}s`);
        bubble.style.setProperty("--delay", `${0.6 + Math.random() * 4}s`);
        container.appendChild(bubble);
    }
}

/**
 * Closes the celebration with a fade-out and then removes it.
 * @param {HTMLDialogElement} dialog - The celebration dialog.
 */
function closeCelebration(dialog) {
    if (dialog.classList.contains("is-closing")) return;
    dialog.classList.add("is-closing");

    let finished = false;
    const finish = () => {
        if (finished) return;
        finished = true;
        dialog.close();
        dialog.remove();
    };
    // Solo cuenta la animación del propio diálogo: las letras y burbujas también lanzan animationend
    dialog.addEventListener("animationend", (event) => {
        if (event.target === dialog) finish();
    });
    // Respaldo por si la animación no llega a dispararse (p. ej. con movimiento reducido)
    setTimeout(finish, 400);
}
