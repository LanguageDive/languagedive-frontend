import { apiFetch } from "./api-fetch.js";
/**
 * Fetches the authenticated user's course list from the courses API.
 *
 * @returns {Promise<any>} A promise that resolves to the API response containing the user's courses,
 * or an error value returned by the API client.
 */
export async function getCourses() {

    const url = 'https://languagedive.bryanrodriguez.tech/api/courses';

    const requestObject = {
        method: 'GET'
    };
    
    const coursesResponse = await apiFetch(url, requestObject, true);

    return coursesResponse;
}

/**
 * Deletes a course for the authenticated user.
 *
 * @param {number} id - The identifier of the course to delete.
 * @returns {Promise<any>} A promise that resolves to the delete API response,
 * or an API error value.
 */
export async function deleteCourse(id) {

    const url = `https://languagedive.bryanrodriguez.tech/api/courses/${id}`;

    const requestObject = {
        method: 'DELETE'
    };

    const course = await apiFetch(url, requestObject, true);

    return course;
}

/**
 * Imports an EPUB file to create or update a course.
 *
 * @param {FormData} formData - The multipart form data containing the EPUB file and related metadata.
 * @returns {Promise<any>} A promise that resolves to the import API response,
 * or an API error value.
 */
export async function postEpub(formData) {
    const url = "https://languagedive.bryanrodriguez.tech/api/courses/import";
    const requestObject = {
        method: 'POST',
        body: formData
    }

    const response = await apiFetch(url, requestObject, true);

    return response;
}

/**
 * Fetches a single course by its unique identifier.
 *
 * @param {number|string} courseId - The course identifier to retrieve.
 * @returns {Promise<any>} A promise that resolves to the requested course data,
 * or an API error value.
 */
export async function getCourseById(courseId) {
    const url = `https://languagedive.bryanrodriguez.tech/api/courses/${courseId}`;

    const requestObject = {
        method: 'GET'
    };

    const courseResponse = await apiFetch(url, requestObject, true);

    return courseResponse
}