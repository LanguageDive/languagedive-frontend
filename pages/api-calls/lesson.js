import { apiFetch } from "./api-fetch.js";
/**
 * Fetches a single lesson for a given course from the language dive API.
 *
 * @param {string|number} courseId - The unique identifier of the course.
 * @param {string|number} lessonId - The unique identifier of the lesson to fetch.
 * @param {number} [page=0] - The page index for paginated lesson content.
 * @param {number} [pageSize=100] - The number of items to include per page.
 * @returns {Promise<any>} A promise that resolves to the lesson API response,
 * or an error value returned by the API client.
 */
export async function getLesson(courseId, lessonId, page = 0, pageSize = 100) {

    const url = `https://languagedive.bryanrodriguez.tech/api/courses/${courseId}/lessons/${lessonId}?page=${page}&pageSize=${pageSize}`;

    const requestObject = {
        method: 'GET'
    };
    
    const lessonResponse = await apiFetch(url, requestObject, true);

    return lessonResponse;
}