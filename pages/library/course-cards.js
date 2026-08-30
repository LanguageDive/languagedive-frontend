import { retrievedUserObject, refreshAccessToken } from '../api-calls/auth.js';
import { apiFetch } from '../api-calls/api-fetch.js'

const courses = await getCourses();
console.log(courses, courses.length);


async function getCourses() {

    const url = 'https://languagedive.bryanrodriguez.tech/api/courses';

    const requestObject = {
        method: 'GET'
    };

    const courses = await apiFetch(url, requestObject, true);

    return courses;

}