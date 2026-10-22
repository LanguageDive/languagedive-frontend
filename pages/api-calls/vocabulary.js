import { apiFetch } from "./api-fetch.js";

/**
 * Learning states accepted by the vocabulary API.
 * @type {Object<string, string>}
 */
export const VocabularyStatus = {
    NEW: 'NEW',
    LEVEL_2: 'LEVEL_2',
    LEVEL_3: 'LEVEL_3',
    LEVEL_4: 'LEVEL_4',
    LEVEL_5: 'LEVEL_5',
    LEARNED: 'LEARNED',
    IGNORED: 'IGNORED'
};

/**
 * Fetches every word the user has saved (the "grimorio").
 *
 * @returns {Promise<any>} A promise that resolves to an object with an `entries` array,
 * or an error value returned by the API client.
 */
export async function getVocabulary() {

    const url = 'https://languagedive.bryanrodriguez.tech/api/vocabulary';

    const requestObject = {
        method: 'GET'
    };

    const vocabularyResponse = await apiFetch(url, requestObject, true);

    return vocabularyResponse;
}

/**
 * Saves a word in the user's vocabulary. If the term already exists, the API updates it.
 *
 * @param {string} term - The word in the language being studied.
 * @param {string} translation - Its meaning (several meanings separated by ";").
 * @param {string} [status=VocabularyStatus.NEW] - Initial learning state.
 * @param {string} [translationLang='es'] - Language of the translation.
 * @returns {Promise<any>} A promise that resolves to the saved entry,
 * or an error value returned by the API client.
 */
export async function saveVocabularyEntry(term, translation, status = VocabularyStatus.NEW, translationLang = 'es') {

    const url = 'https://languagedive.bryanrodriguez.tech/api/vocabulary';

    const requestObject = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            'term': term,
            'translation': translation,
            'translationLang': translationLang,
            'status': status
        })
    };

    const entryResponse = await apiFetch(url, requestObject, true);

    return entryResponse;
}

/**
 * Updates the meaning and/or the learning state of an existing word.
 *
 * @param {string|number} vocabularyId - The unique identifier of the vocabulary entry.
 * @param {{ translation?: string, status?: string }} changes - Only the fields to change.
 * @returns {Promise<any>} A promise that resolves to the updated entry,
 * or an error value returned by the API client.
 */
export async function updateVocabularyEntry(vocabularyId, changes) {

    const url = `https://languagedive.bryanrodriguez.tech/api/vocabulary/${vocabularyId}`;

    const requestObject = {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(changes)
    };

    const entryResponse = await apiFetch(url, requestObject, true);

    return entryResponse;
}
