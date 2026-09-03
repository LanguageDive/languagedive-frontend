import { apiFetch } from "./api-fetch.js";
/**
 * Fetches the authenticated user's course list from the courses API.
 *
 * @returns {Promise<any>} A promise that resolves to the API response containing the user's courses,
 * or an error value returned by the API client.
 */
export async function getLesson(courseId, lessonId, page = 0, pageSize = 100) {

    const url = `https://languagedive.bryanrodriguez.tech/api/courses/${courseId}/lessons/${lessonId}?page=${page}&pageSize=${pageSize}`;

    const requestObject = {
        method: 'GET'
    };
    
    const coursesResponse = await apiFetch(url, requestObject, true);

    return coursesResponse;
}