import { retrievedUserObject, refreshAccessToken } from '../api-calls/auth.js';

const userNameHeader = document.querySelector("#username");

if (!retrievedUserObject) {
    location.assign("/login/index.html");
}
else {
    userNameHeader.textContent = (retrievedUserObject.username).toUpperCase();
}

const siteURL = window.location.href;
console.log(siteURL);
const siteParams = new URLSearchParams(siteURL);
console.log(siteParams);