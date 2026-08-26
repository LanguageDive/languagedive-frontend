const serializedUser = localStorage.getItem("userData");
const retrievedUserObject = JSON.parse(serializedUser);

const userNameHeader = document.querySelector("#username");
userNameHeader.textContent = (retrievedUserObject.username).toUpperCase();

