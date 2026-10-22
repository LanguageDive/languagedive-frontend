/**
 * Form validation with LanguageDive messages instead of the browser's bubbles.
 * The forms use `novalidate`; each field has its own rules, and a failing rule shows
 * a message under the field. Styles in the "VALIDACIÓN DE FORMULARIOS" section of common.css.
 *
 * When it checks:
 * - On submit: every field. Focus goes to the first field with an error.
 * - While typing: only fields that were already checked, so the error goes away as soon as it is fixed.
 * - On leaving a field: only if something was written (an untouched empty field is not scolded).
 */

/**
 * @typedef {Object} ValidationRule
 * @property {(value: string, form: HTMLFormElement) => boolean} test - true when the value is valid.
 * @property {string} message - Text shown when the test fails.
 */

/**
 * Ready-made rules for the usual cases.
 */
export const rules = {
    /** @param {string} message */
    required: (message) => ({ test: (value) => value.trim() !== "", message }),
    /** @param {number} length @param {string} message */
    minLength: (length, message) => ({ test: (value) => value.length >= length, message }),
    /** @param {number} length @param {string} message */
    maxLength: (length, message) => ({ test: (value) => value.length <= length, message }),
    /** @param {string} message */
    email: (message) => ({ test: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()), message }),
    /** @param {string} message */
    noSpaces: (message) => ({ test: (value) => !/\s/.test(value), message }),
    /** @param {string} otherFieldName @param {string} message */
    matches: (otherFieldName, message) => ({
        test: (value, form) => value === form.elements[otherFieldName].value,
        message
    })
};

/**
 * Connects the validation to a form.
 *
 * @param {HTMLFormElement} form - The form (with the `novalidate` attribute).
 * @param {Object<string, ValidationRule[]>} fieldRules - Rules for each field, by its `name`.
 * @param {Object<string, string[]>} [dependencies={}] - Fields that must be checked again when
 * another one changes. E.g. { password: ["rptPassword"] }: if the password changes, the repeated one is checked again.
 * @returns {{ validate: () => boolean }} validate() checks every field and says whether the form is valid.
 */
export function setupValidation(form, fieldRules, dependencies = {}) {
    // Campos que ya se revisaron: se vuelven a revisar mientras se escribe
    const checkedFields = new Set();

    Object.keys(fieldRules).forEach(name => {
        const input = form.elements[name];

        input.addEventListener("input", () => {
            if (checkedFields.has(name)) validateField(name);
            (dependencies[name] ?? []).forEach(dependentName => {
                if (checkedFields.has(dependentName)) validateField(dependentName);
            });
        });

        input.addEventListener("blur", () => {
            if (input.value !== "") validateField(name);
        });
    });

    /**
     * Checks one field and shows or hides its message.
     * @param {string} name - Field name.
     * @returns {boolean} Whether the field is valid.
     */
    function validateField(name) {
        checkedFields.add(name);
        const input = form.elements[name];
        const failedRule = fieldRules[name].find(rule => !rule.test(input.value, form));
        showFieldError(input, failedRule?.message ?? null);
        return !failedRule;
    }

    /**
     * Checks every field. Focus goes to the first one with an error.
     * @returns {boolean} Whether the whole form is valid.
     */
    function validate() {
        const invalidFields = Object.keys(fieldRules).filter(name => !validateField(name));
        if (invalidFields.length === 0) return true;

        const firstInvalid = form.elements[invalidFields[0]];
        firstInvalid.focus();
        // El campo se sacude para que se note dónde está el problema
        const field = firstInvalid.closest(".password-field") ?? firstInvalid;
        field.classList.remove("shake-field");
        void field.offsetWidth;
        field.classList.add("shake-field");
        return false;
    }

    return { validate };
}

/**
 * Shows (or hides, with null) the message under a field.
 * The message is linked to the field with aria-describedby so screen readers read it.
 *
 * @param {HTMLInputElement} input - The field.
 * @param {string|null} message - Text of the error, or null if the field is valid.
 */
function showFieldError(input, message) {
    const errorId = `${input.id}-error`;
    let error = document.getElementById(errorId);

    if (!error) {
        error = document.createElement("p");
        error.id = errorId;
        error.className = "field-error";
        error.setAttribute("aria-live", "polite");
        // El campo de contraseña está dentro de un contenedor (ver auth-scene.js): el mensaje va debajo de él
        (input.closest(".password-field") ?? input).after(error);
    }

    const isInvalid = message !== null;
    input.classList.toggle("is-invalid", isInvalid);
    input.setAttribute("aria-invalid", String(isInvalid));

    if (isInvalid) {
        input.setAttribute("aria-describedby", errorId);
        // Solo se reemplaza el texto si cambió, así la animación no se repite al escribir
        if (error.dataset.message !== message) {
            error.dataset.message = message;
            error.textContent = message;
            error.classList.remove("hide");
        }
    }
    else {
        input.removeAttribute("aria-describedby");
        error.dataset.message = "";
        error.textContent = "";
        error.classList.add("hide");
    }
}
