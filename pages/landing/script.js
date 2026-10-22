import { retrievedUserObject } from '../api-calls/auth.js';
import { burstConfetti } from '../effects.js';

// Avisa al CSS de que hay JS: solo así se ocultan las secciones hasta que aparecen al hacer scroll
document.documentElement.classList.add("js");

// TODO > PROGRAM RUN ------------------------------------------------------------
showActionsForSession();
setupDemo();
setupReveal();
document.querySelector(".current-year").textContent = new Date().getFullYear();
// ! FIN > PROGRAM RUN -----------------------------------------------------------

// TODO > FUNCTIONS ------------------------------------------------------------
/**
 * With a saved session, swaps "Iniciar sesión" / "Crear mi cuenta" for "Mi biblioteca".
 * @returns {void}
 */
function showActionsForSession() {
    const isLoggedIn = Boolean(retrievedUserObject);
    document.querySelectorAll(".guest-only").forEach(element => element.classList.toggle("hide", isLoggedIn));
    document.querySelectorAll(".member-only").forEach(element => element.classList.toggle("hide", !isLoggedIn));
}

/**
 * Mini demo of the lesson: each tap on a word raises its level (1 → 5 → learned)
 * and the panel shows its translation. The text and translations are fixed.
 * @returns {void}
 */
function setupDemo() {
    const translations = {
        fox: "zorro",
        jumped: "saltó",
        quiet: "tranquilo",
        river: "río",
        smiled: "sonrió"
    };
    const levels = ["1", "2", "3", "4", "5", "learned"];
    const levelNames = {
        "1": "Nivel 1 · nueva",
        "2": "Nivel 2",
        "3": "Nivel 3",
        "4": "Nivel 4",
        "5": "Nivel 5",
        "learned": "¡Aprendida!"
    };

    const words = document.querySelectorAll(".demo-word");
    const panel = document.querySelector(".demo-panel");
    const term = panel.querySelector(".demo-term");
    const translation = panel.querySelector(".demo-translation");
    const dots = panel.querySelectorAll(".level-dot");

    words.forEach(word => {
        word.addEventListener("click", () => {
            // Siguiente nivel; después de "aprendida" vuelve a empezar
            const currentIndex = levels.indexOf(word.dataset.level);
            const nextLevel = levels[(currentIndex + 1) % levels.length];
            word.dataset.level = nextLevel;

            words.forEach(otherWord => otherWord.classList.toggle("is-selected", otherWord === word));
            replayAnimation(word, "is-selected");

            term.textContent = word.dataset.word;
            translation.textContent = `${translations[word.dataset.word]} · ${levelNames[nextLevel]}`;
            const reachedIndex = levels.indexOf(nextLevel);
            dots.forEach((dot, i) => dot.classList.toggle("is-reached", i <= reachedIndex));
            replayAnimation(panel, "is-changing");

            if (nextLevel === "learned") {
                burstConfetti(word, { count: 24, power: 0.7 });
            }
        });
    });
}

/**
 * Shows each `.reveal` element with an animation when it enters the screen.
 * IntersectionObserver does not measure anything on every scroll event, so it does not stutter.
 * When the animation ends the classes are removed, so the element's own hover transitions work again.
 * @returns {void}
 */
function setupReveal() {
    const elements = document.querySelectorAll(".reveal");

    if (!("IntersectionObserver" in window)) {
        elements.forEach(element => element.classList.remove("reveal"));
        return;
    }

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            const element = entry.target;
            element.classList.add("is-visible");
            observer.unobserve(element);

            const finishReveal = (event) => {
                if (event.target !== element || event.propertyName !== "transform") return;
                element.removeEventListener("transitionend", finishReveal);
                element.classList.remove("reveal", "is-visible");
            };
            element.addEventListener("transitionend", finishReveal);
        });
    }, { threshold: 0.15, rootMargin: "0px 0px -40px 0px" });

    elements.forEach(element => observer.observe(element));
}

/**
 * Restarts a CSS animation by removing and adding back its class.
 * @param {HTMLElement} element - Element to animate.
 * @param {string} className - Class that applies the animation.
 */
function replayAnimation(element, className) {
    element.classList.remove(className);
    // Leer el tamaño obliga al navegador a aplicar el cambio antes de volver a poner la clase
    void element.offsetWidth;
    element.classList.add(className);
}
// ! FIN > FUNCTIONS
