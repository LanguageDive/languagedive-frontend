import { retrievedUserObject } from '../api-calls/auth.js';
import { ApiErrors } from '../api-calls/api-fetch.js';
import { getLesson } from '../api-calls/lesson.js'

const userNameHeader = document.querySelector("#username");

if (!retrievedUserObject) {
    location.assign("/login/index.html");
}
else {
    userNameHeader.textContent = (retrievedUserObject.username).toUpperCase();
}

const params = new URLSearchParams(window.location.search);
const courseId = params.get('id');       // Extracts courseId
const lessonId = params.get('lessonId'); // Extracts lessonId
// console.log(courseId);
// console.log(lessonId);


const lessonResponse = await getLesson(courseId, lessonId);

console.log(lessonResponse);