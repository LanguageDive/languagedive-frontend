import { apiFetch } from '../api-calls/api-fetch.js';

const loginFormElement = document.querySelector("#loginForm");
// console.log(loginFormElement);

const successMessage = document.querySelector("#successMessage");
const errorMessage = document.querySelector("#errorMessage");
let loginError = false;
let loginSuccess = false;

/* 
============================================
                FUNCTIONS
============================================
*/
loginFormElement.addEventListener("submit",
    (event) => {
        printFieldsContent(event);
    });

function printFieldsContent(event) {
    event.preventDefault();

    const loginFormFields = loginFormElement.querySelectorAll("input");
    // console.log(loginFormFields)

    const userLoginData = {};

    for (const field of loginFormFields) {
        userLoginData[`${field.name}`] = field.value;
    }

    loginGet(userLoginData);

}

async function loginGet(userLoginData) {

    const url = "https://languagedive.bryanrodriguez.tech/api/auth/login";
    const requestObject = {
        method: "POST",
        headers: {
            "Content-Type": 'application/json'
        },
        body: JSON.stringify(userLoginData)
    }

    try {
        const response = await apiFetch(url, requestObject);

        if (!response) {
            throw new Error("No se pudo iniciar sesion>", response);
        }

        console.log(response);

        // Mostrar mensaje de éxito
        successMessage.classList.toggle("display");
        loginSuccess = true;

        //Dejar de mostrar el mensaje de login error en pantalla si ya estaba previamente
        if (loginError) {
            errorMessage.classList.toggle("display");
            loginError = false;
        }

        //Guardamos credenciales del usuario en un objeto
        const loginCredentials = {
            "username": response.user.username,
            "accessToken": response.accessToken,
            "refreshToken": response.refreshToken
        }

        //Convertimos a texto y guardamos en el localStorage para poder usarlas en library/index.html
        const serializedUser = JSON.stringify(loginCredentials);
        //Guardamos nombre y accessTokens del usuario en variable "userData"
        localStorage.setItem("userData", serializedUser);

        location.assign("/library/index.html");

    }
    catch (error) {
        console.log(error);

        // Ocultar el mensaje de login si ya estaba en pantalla
        if (loginSuccess) {
            successMessage.classList.toggle("display");
            loginSuccess = false;
        }

        // Si el mensaje no está en pantalla, lo activamos
        if (!loginError) {
            errorMessage.classList.toggle("display");
            loginError = true;
        }
    }
}