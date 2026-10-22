/**
 * Scene of the access pages (login and register):
 * - "Dive", the fish mascot that peeks over the card. Its eyes follow the pointer,
 *   it covers its eyes while the password is typed and reacts to errors and success.
 * - A "Mostrar"/"Ocultar" button in each password field.
 * - Decorative seabed, fish and floating words (hidden from screen readers).
 * It only reads the existing messages (#errorMessage, #successMessage): the login and
 * register logic does not need to know about it. Styles in auth-scene.css.
 */

// TODO > CONSTANTS ------------------------------------------------------------
// Marcado fijo (sin datos de usuario), por eso se puede usar innerHTML
const MASCOT_SVG = `
<svg viewBox="0 0 120 100" aria-hidden="true">
    <path d="M94 54 L118 34 Q112 54 118 74 Z" fill="#12519C" stroke="#1F2A4D" stroke-width="3" stroke-linejoin="round"/>
    <path d="M38 24 Q55 4 76 21 Z" fill="#12519C" stroke="#1F2A4D" stroke-width="3" stroke-linejoin="round"/>
    <ellipse cx="56" cy="56" rx="42" ry="36" fill="#1B6FD1" stroke="#1F2A4D" stroke-width="3"/>
    <ellipse cx="52" cy="72" rx="24" ry="12" fill="#8EC5FF"/>
    <circle cx="28" cy="64" r="5" fill="#FF7A7A" opacity="0.6"/>
    <circle cx="82" cy="64" r="5" fill="#FF7A7A" opacity="0.6"/>
    <g>
        <circle cx="42" cy="48" r="11" fill="#fff" stroke="#1F2A4D" stroke-width="2.5"/>
        <g class="pupil pupil-left"><circle cx="42" cy="49" r="5" fill="#1F2A4D"/><circle cx="43.8" cy="47" r="1.6" fill="#fff"/></g>
        <ellipse class="eyelid eyelid-left" cx="42" cy="48" rx="12" ry="12" fill="#12519C"/>
    </g>
    <g>
        <circle cx="68" cy="48" r="11" fill="#fff" stroke="#1F2A4D" stroke-width="2.5"/>
        <g class="pupil pupil-right"><circle cx="68" cy="49" r="5" fill="#1F2A4D"/><circle cx="69.8" cy="47" r="1.6" fill="#fff"/></g>
        <ellipse class="eyelid eyelid-right" cx="68" cy="48" rx="12" ry="12" fill="#12519C"/>
    </g>
    <path class="mouth-smile" d="M48 66 Q55 72 62 66" fill="none" stroke="#1F2A4D" stroke-width="3" stroke-linecap="round"/>
    <path class="mouth-sad" d="M48 70 Q55 64 62 70" fill="none" stroke="#1F2A4D" stroke-width="3" stroke-linecap="round"/>
    <path class="mouth-happy" d="M47 64 Q55 77 63 64 Z" fill="#1F2A4D" stroke="#1F2A4D" stroke-width="2" stroke-linejoin="round"/>
    <ellipse class="fin-hand fin-hand-left" cx="38" cy="80" rx="10" ry="6.5" fill="#12519C" stroke="#1F2A4D" stroke-width="2.5"/>
    <ellipse class="fin-hand fin-hand-right" cx="72" cy="80" rx="10" ry="6.5" fill="#12519C" stroke="#1F2A4D" stroke-width="2.5"/>
</svg>`;

const PLANTS_SVG = `
<svg viewBox="0 0 160 140" preserveAspectRatio="xMidYMax meet">
    <ellipse cx="82" cy="136" rx="24" ry="10" fill="#C9D1DE"/>
    <path class="seaweed" d="M30 140 C18 112 42 96 30 72 C20 52 38 36 30 14" fill="none" stroke="#2FBF71" stroke-width="9" stroke-linecap="round"/>
    <path class="seaweed" d="M54 140 C46 120 64 106 55 86 C49 72 60 60 56 46" fill="none" stroke="#1E8C51" stroke-width="8" stroke-linecap="round"/>
    <path d="M118 140 V102 M118 114 L104 94 M118 108 L132 88 M104 94 V80 M132 88 V76" fill="none" stroke="#FF7A7A" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="146" cy="134" r="6" fill="#FFD23F" stroke="#D9A800" stroke-width="2"/>
</svg>`;

const SAND_SVG = `
<svg viewBox="0 0 1200 150" preserveAspectRatio="none">
    <path d="M0 70 Q150 40 300 64 T600 58 T900 68 T1200 52 V150 H0 Z" fill="#FBEFD6"/>
    <path d="M0 100 Q200 78 400 96 T800 92 T1200 98 V150 H0 Z" fill="#F4E1BC"/>
</svg>`;

const JELLYFISH_SVG = `
<svg viewBox="0 0 60 84">
    <path class="tentacle" d="M14 34 Q9 48 15 60 Q20 70 13 80" fill="none" stroke="#8B6CF6" stroke-width="3" stroke-linecap="round"/>
    <path class="tentacle" d="M25 35 Q21 50 26 62 Q30 72 25 82" fill="none" stroke="#8B6CF6" stroke-width="3" stroke-linecap="round"/>
    <path class="tentacle" d="M36 35 Q40 50 35 62 Q31 72 36 82" fill="none" stroke="#8B6CF6" stroke-width="3" stroke-linecap="round"/>
    <path class="tentacle" d="M46 34 Q51 48 45 60 Q40 70 47 80" fill="none" stroke="#8B6CF6" stroke-width="3" stroke-linecap="round"/>
    <path d="M4 33 Q4 4 30 4 Q56 4 56 33 Q49 29 43 33 Q37 29 30 33 Q23 29 17 33 Q11 29 4 33 Z" fill="#D9CCFF" stroke="#1F2A4D" stroke-width="2.5" stroke-linejoin="round"/>
    <circle cx="22" cy="20" r="2.6" fill="#1F2A4D"/>
    <circle cx="38" cy="20" r="2.6" fill="#1F2A4D"/>
    <path d="M26 25 Q30 28 34 25" fill="none" stroke="#1F2A4D" stroke-width="2" stroke-linecap="round"/>
    <circle cx="16" cy="25" r="3" fill="#FF7A7A" opacity="0.5"/>
    <circle cx="44" cy="25" r="3" fill="#FF7A7A" opacity="0.5"/>
</svg>`;

const CHEST_SVG = `
<svg viewBox="0 0 72 58">
    <rect x="5" y="25" width="62" height="29" rx="4" fill="#B5763A" stroke="#1F2A4D" stroke-width="2.5"/>
    <path d="M5 27 Q5 8 36 8 Q67 8 67 27 Z" fill="#C98A4B" stroke="#1F2A4D" stroke-width="2.5" stroke-linejoin="round"/>
    <path d="M18 10 V54 M54 10 V54" stroke="#FFD23F" stroke-width="4"/>
    <rect x="30" y="22" width="12" height="13" rx="2" fill="#FFD23F" stroke="#1F2A4D" stroke-width="2"/>
    <circle cx="36" cy="28.5" r="2" fill="#1F2A4D"/>
</svg>`;

const STARFISH_SVG = `
<svg viewBox="0 0 50 48">
    <path d="M25 3 L31 17 L46 18 L34.5 28 L38.5 43 L25 35 L11.5 43 L15.5 28 L4 18 L19 17 Z" fill="#FFAA5C" stroke="#1F2A4D" stroke-width="2.5" stroke-linejoin="round"/>
    <circle cx="25" cy="21" r="1.6" fill="#1F2A4D"/>
    <circle cx="20" cy="26" r="1.3" fill="#1F2A4D" opacity="0.5"/>
    <circle cx="30" cy="26" r="1.3" fill="#1F2A4D" opacity="0.5"/>
</svg>`;

/**
 * Small bubbles that rise from a point of the seabed.
 * @param {number} count - Number of bubbles.
 * @returns {string} Markup of the bubbles.
 */
const risingBubbles = (count) => Array.from({ length: count }, (_, i) =>
    `<span class="rising-bubble" style="--x: ${(i % 3) * 9 - 9}px; --size: ${8 + (i % 3) * 4}px; --delay: ${i * 1.1}s"></span>`
).join("");

/**
 * The fish is drawn looking left: the ones that swim to the right are flipped in the CSS.
 * @param {string} color - Body color of the fish.
 */
const fishSvg = (color) => `
<svg viewBox="0 0 46 30">
    <path d="M32 15 L46 4 Q43 15 46 26 Z" fill="${color}" stroke="#1F2A4D" stroke-width="2" stroke-linejoin="round"/>
    <ellipse cx="19" cy="15" rx="16" ry="11" fill="${color}" stroke="#1F2A4D" stroke-width="2"/>
    <circle cx="11" cy="13" r="2.6" fill="#1F2A4D"/>
</svg>`;

// Palabras de saludo en varios idiomas, con los colores de los niveles de la lección
const FLOATING_WORDS = [
    { text: "hello", lang: "en", chip: "#FFD6D6", top: "16%", left: "5%", tilt: "-6deg" },
    { text: "bonjour", lang: "fr", chip: "#FFF0B3", top: "42%", left: "9%", tilt: "4deg" },
    { text: "ciao", lang: "it", chip: "#CDEFDB", top: "66%", left: "4%", tilt: "-3deg" },
    { text: "hola", lang: "es", chip: "#E3F0FF", top: "20%", left: "84%", tilt: "5deg" },
    { text: "hallo", lang: "de", chip: "#FFE2C2", top: "46%", left: "80%", tilt: "-5deg" },
    { text: "olá", lang: "pt", chip: "#E4F5C4", top: "70%", left: "86%", tilt: "3deg" }
];

// Cuánto se pueden mover las pupilas dentro del ojo (en unidades del dibujo)
const PUPIL_RANGE = 4;

// TODO > PROGRAM RUN ------------------------------------------------------------
const card = document.querySelector("main");
const mascot = createMascot(card);
createScene();
setupPasswordToggles();
setupEyes();
setupReactions();
// ! FIN > PROGRAM RUN -----------------------------------------------------------

// TODO > FUNCTIONS ------------------------------------------------------------
/**
 * Puts the mascot on top of the card.
 * @param {HTMLElement} container - The login or register card.
 * @returns {HTMLElement} The mascot element.
 */
function createMascot(container) {
    const element = document.createElement("div");
    element.className = "mascot";
    element.innerHTML = MASCOT_SVG;
    container.classList.add("has-mascot");
    container.prepend(element);
    return element;
}

/**
 * Adds the decorative seabed, the swimming fish and the floating words behind the page.
 * @returns {void}
 */
function createScene() {
    const scene = document.createElement("div");
    scene.className = "auth-scene";
    scene.setAttribute("aria-hidden", "true");
    scene.innerHTML = `
        <div class="light-rays"></div>
        <div class="jellyfish">${JELLYFISH_SVG}</div>
        <div class="seabed">
            ${SAND_SVG}
            <div class="plants plants-left">
                ${PLANTS_SVG}
                <div class="bubble-stream">${risingBubbles(3)}</div>
            </div>
            <div class="plants plants-right">${PLANTS_SVG}</div>
            <div class="starfish">${STARFISH_SVG}</div>
            <div class="chest">
                ${CHEST_SVG}
                <span class="chest-sparkle"></span>
                <div class="bubble-stream">${risingBubbles(4)}</div>
            </div>
        </div>
        <div class="swimmer" style="--top: 28%; --duration: 22s; --delay: 2s">${fishSvg("#FFD23F")}</div>
        <div class="swimmer swimmer-reverse" style="--top: 58%; --duration: 30s; --delay: 9s">${fishSvg("#FF7A7A")}</div>
        <div class="swimmer swimmer-small" style="--top: 40%; --duration: 26s; --delay: 14s">
            <div class="school">${fishSvg("#5FD39A")}${fishSvg("#8EC5FF")}${fishSvg("#5FD39A")}</div>
        </div>`;

    FLOATING_WORDS.forEach((word, i) => {
        const chip = document.createElement("span");
        chip.className = "floating-word";
        chip.lang = word.lang;
        chip.textContent = word.text;
        chip.style.setProperty("--top", word.top);
        chip.style.setProperty("--left", word.left);
        chip.style.setProperty("--tilt", word.tilt);
        chip.style.setProperty("--chip", word.chip);
        chip.style.setProperty("--duration", `${4 + (i % 3)}s`);
        chip.style.setProperty("--delay", `${-i * 0.7}s`);
        scene.appendChild(chip);
    });

    document.body.appendChild(scene);
}

/**
 * Adds a "Mostrar"/"Ocultar" button to each password field.
 * It has a text label (an eye icon alone is ambiguous) and aria-pressed for screen readers.
 * @returns {void}
 */
function setupPasswordToggles() {
    document.querySelectorAll('input[type="password"]').forEach(input => {
        const field = document.createElement("div");
        field.className = "password-field";
        input.before(field);
        field.appendChild(input);

        const toggle = document.createElement("button");
        toggle.type = "button";
        toggle.className = "password-toggle";
        toggle.textContent = "Mostrar";
        toggle.setAttribute("aria-pressed", "false");
        toggle.setAttribute("aria-label", "Mostrar contraseña");
        field.appendChild(toggle);

        toggle.addEventListener("click", () => {
            const willShow = input.type === "password";
            input.type = willShow ? "text" : "password";
            toggle.textContent = willShow ? "Ocultar" : "Mostrar";
            toggle.setAttribute("aria-pressed", String(willShow));
            toggle.setAttribute("aria-label", willShow ? "Ocultar contraseña" : "Mostrar contraseña");
            // El foco vuelve al campo para seguir escribiendo
            input.focus();
            updateShyness();
        });
    });
}

/**
 * Eyes: they follow the pointer; while typing in a text field they look at the
 * text being written; with the password field focused they close (or peek if visible).
 * @returns {void}
 */
function setupEyes() {
    const pupils = mascot.querySelectorAll(".pupil");
    // Centros de los ojos en el dibujo (viewBox de 120 x 100)
    const eyeCenters = [{ x: 42, y: 48 }, { x: 68, y: 48 }];

    let target = null;
    let isScheduled = false;

    const lookAt = (point) => {
        target = point;
        if (isScheduled) return;
        isScheduled = true;
        // Como mucho una actualización por fotograma
        requestAnimationFrame(() => {
            isScheduled = false;
            const rect = mascot.getBoundingClientRect();
            const scale = rect.width / 120;
            pupils.forEach((pupil, i) => {
                const eyeX = rect.left + eyeCenters[i].x * scale;
                const eyeY = rect.top + eyeCenters[i].y * scale;
                const dx = target.x - eyeX;
                const dy = target.y - eyeY;
                const distance = Math.hypot(dx, dy) || 1;
                const reach = Math.min(PUPIL_RANGE, distance / 30);
                pupil.style.transform = `translate(${(dx / distance) * reach}px, ${(dy / distance) * reach}px)`;
            });
        });
    };

    window.addEventListener("pointermove", (event) => {
        // Mientras se escribe en un campo, los ojos miran el texto, no el cursor
        if (document.activeElement?.matches("input")) return;
        lookAt({ x: event.clientX, y: event.clientY });
    }, { passive: true });

    // Mira hacia donde va el texto: más a la derecha cuanto más se escribe
    const lookAtText = (input) => {
        const rect = input.getBoundingClientRect();
        const approximateTextWidth = Math.min(rect.width - 24, input.value.length * 9);
        lookAt({ x: rect.left + 16 + approximateTextWidth, y: rect.top + rect.height / 2 });
    };

    document.querySelectorAll("main input").forEach(input => {
        input.addEventListener("focus", () => {
            lookAtText(input);
            updateShyness();
        });
        input.addEventListener("input", () => lookAtText(input));
        input.addEventListener("blur", () => {
            // Espera al siguiente foco (p. ej. pasar al botón "Mostrar") antes de abrir los ojos
            requestAnimationFrame(updateShyness);
        });
    });
}

/**
 * Closes the eyes while the password field is focused; if the password is visible,
 * it peeks with one eye instead.
 * @returns {void}
 */
function updateShyness() {
    const field = document.activeElement?.closest(".password-field");
    const input = field?.querySelector("input");
    const isPasswordFocused = Boolean(input);
    const isVisible = input?.type === "text";

    mascot.classList.toggle("is-shy", isPasswordFocused && !isVisible);
    mascot.classList.toggle("is-peeking", isPasswordFocused && isVisible);
}

/**
 * Sad when the error message appears, happy when the success message appears.
 * The messages are hidden with the "display" class (see login/script.js and register/script.js).
 * @returns {void}
 */
function setupReactions() {
    const errorMessage = document.querySelector("#errorMessage");
    const successMessage = document.querySelector("#successMessage");
    let sadTimeout = null;

    const isShown = (message) => message && !message.classList.contains("display");

    const observer = new MutationObserver(() => {
        if (isShown(successMessage)) {
            mascot.classList.remove("is-sad");
            mascot.classList.add("is-happy");
            return;
        }
        mascot.classList.remove("is-happy");

        if (isShown(errorMessage)) {
            // Se reinicia la animación aunque el error ya estuviera visible
            mascot.classList.remove("is-sad");
            void mascot.offsetWidth;
            mascot.classList.add("is-sad");
            clearTimeout(sadTimeout);
            sadTimeout = setTimeout(() => mascot.classList.remove("is-sad"), 2500);
        }
    });

    [errorMessage, successMessage].forEach(message => {
        if (message) observer.observe(message, { attributes: true, attributeFilter: ["class"] });
    });
}
// ! FIN > FUNCTIONS
