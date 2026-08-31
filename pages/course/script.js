import { retrievedUserObject, refreshAccessToken } from '../api-calls/auth.js';
import { apiFetch, ApiErrors } from '../api-calls/api-fetch.js';

const userNameHeader = document.querySelector("#username");

if (!retrievedUserObject) {
    location.assign("/login/index.html");
}
else {
    userNameHeader.textContent = (retrievedUserObject.username).toUpperCase();
}