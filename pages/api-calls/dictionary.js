/**
 * Translation suggestions from MyMemory (https://mymemory.translated.net), a free external service.
 * Prototype: when the backend has its own dictionary endpoint, only this file needs to change.
 *
 * Free anonymous limit: about 5,000 characters per day per IP. No email is sent
 * (the "de" parameter would raise the limit) so the user's address is not shared with a third party.
 */

/** Error codes of this module, in the same style as ApiErrors. */
export const DictionaryErrors = {
    NETWORK_ERROR: "dictionary_network_error",
    LIMIT_REACHED: "dictionary_limit_reached",
    NO_RESULTS: "dictionary_no_results"
};

// Si el servicio tarda más que esto, se deja de esperar
const REQUEST_TIMEOUT_MS = 6000;

// Códigos de 3 letras y nombres de idiomas que pueden venir en los metadatos de un EPUB
const LANGUAGE_ALIASES = {
    eng: "en", english: "en", inglés: "en", ingles: "en",
    spa: "es", spanish: "es", español: "es", espanol: "es",
    fra: "fr", fre: "fr", french: "fr", français: "fr", francés: "fr",
    deu: "de", ger: "de", german: "de", deutsch: "de", alemán: "de",
    ita: "it", italian: "it", italiano: "it",
    por: "pt", portuguese: "pt", português: "pt", portugués: "pt",
    jpn: "ja", japanese: "ja",
    zho: "zh", chi: "zh", chinese: "zh",
    kor: "ko", korean: "ko",
    rus: "ru", russian: "ru"
};

/**
 * Turns the language of a book into the two-letter code MyMemory understands.
 * The EPUB metadata may say "en", "en-US", "eng" or even "English".
 * If it cannot be recognized, MyMemory detects it by itself ("Autodetect").
 *
 * @param {string|null|undefined} language - Language as the API gives it.
 * @returns {string} E.g. "en", or "Autodetect".
 */
export function toLanguageCode(language) {
    const value = String(language ?? "").trim().toLowerCase();
    const base = value.split(/[-_]/)[0];
    if (/^[a-z]{2}$/.test(base)) return base;
    return LANGUAGE_ALIASES[base] ?? LANGUAGE_ALIASES[value] ?? "Autodetect";
}

/**
 * Asks MyMemory for translations of a word.
 *
 * @param {string} term - Word to translate.
 * @param {string} fromLanguage - Language of the word (ISO 639-1, e.g. "en", or "Autodetect").
 * @param {string} [toLanguage="es"] - Language of the translation.
 * @param {number} [maxSuggestions=4] - How many different translations to return at most.
 * @returns {Promise<string[]|string>} Different translations (best first), or a DictionaryErrors code.
 */
export async function getTranslationSuggestions(term, fromLanguage, toLanguage = "es", maxSuggestions = 4) {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(term)}&langpair=${fromLanguage}|${toLanguage}`;

    let data;
    try {
        const response = await fetch(url, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
        data = await response.json();
    }
    catch (error) {
        console.error(error);
        return DictionaryErrors.NETWORK_ERROR;
    }

    // Al agotar el límite diario, MyMemory responde 429 o pone un aviso en lugar de la traducción
    const mainTranslation = data?.responseData?.translatedText ?? "";
    if (data?.responseStatus === 429 || /MYMEMORY WARNING/i.test(mainTranslation)) {
        return DictionaryErrors.LIMIT_REACHED;
    }

    // La traducción principal primero y después las de la memoria de traducción, de mejor a peor.
    // La memoria a veces trae traducciones a otro idioma que subió alguien: solo se usan las del
    // idioma pedido (cada una dice su idioma en "target", p. ej. "es-ES").
    // Algunas traen varias traducciones juntas ("terraplén, relleno"): se separan
    const isTargetLanguage = (match) => !match.target || match.target.toLowerCase().startsWith(toLanguage);
    const candidates = [
        mainTranslation,
        ...(data?.matches ?? [])
            .filter(isTargetLanguage)
            .slice()
            .sort((a, b) => (Number(b.match) || 0) - (Number(a.match) || 0))
            .map(match => match.translation)
    ].flatMap(text => (typeof text === "string" ? text.split(/[,;/]/) : []));

    // Se comparan sin tildes: "río" y "rio" son la misma sugerencia y se queda la primera (la mejor)
    const withoutAccents = (text) => text.normalize("NFD").replace(/\p{M}/gu, "");
    const seen = new Set();
    const suggestions = [];
    for (const candidate of candidates) {
        const cleaned = cleanSuggestion(candidate, term);
        if (!cleaned || seen.has(withoutAccents(cleaned))) continue;
        seen.add(withoutAccents(cleaned));
        suggestions.push(cleaned);
        if (suggestions.length === maxSuggestions) break;
    }

    return suggestions.length ? suggestions : DictionaryErrors.NO_RESULTS;
}

/**
 * Tidies a translation from the translation memory, which often comes with capital
 * letters or punctuation from the sentence it was taken from. Discards it if it is too
 * long to be the translation of one word, or if it is the same word untranslated.
 *
 * @param {string} text - Raw translation.
 * @param {string} term - The original word.
 * @returns {string|null}
 */
function cleanSuggestion(text, term) {
    if (typeof text !== "string") return null;

    const cleaned = text
        // Notas entre paréntesis o corchetes, aunque estén a medias: "calmo (calificador"
        .replace(/[(\[].*$/, "")
        .trim()
        .replace(/^[\s"'“”‘’¡¿.,;:!?()«»-]+|[\s"'“”‘’.,;:!?()«»-]+$/g, "")
        .toLowerCase();

    const wordCount = cleaned.split(/\s+/).length;
    if (!cleaned || wordCount > 3 || cleaned.length > 40) return null;
    if (cleaned === term.toLowerCase()) return null;
    return cleaned;
}
