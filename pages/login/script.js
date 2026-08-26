const loginFormElement = document.querySelector("#loginForm");
// console.log(loginFormElement);

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

    try {
        const response = await fetch('https://languagedive.bryanrodriguez.tech/api/auth/login', {
            method: "POST",
            headers: {
                "Content-Type": 'application/json'
            },
            body: JSON.stringify(userLoginData)
        }).then(response => {
            if (!response.ok) {
                throw new Error("No se pudo iniciar sesion>", response);
            }
            return response.json();
        }).then(data => data);

        console.log(response);

        successMessage.classList.toggle("display");
        loginSuccess = true;

        if (loginError) {
            errorMessage.classList.toggle("display");
            loginError = false;
        }

        //Guardamos credenciales del usuario en un objeto
        const loginCredentials = {
            "username" : response.user.username,
            "accessToken" : response.accessToken,
            "refreshToken" : response.refreshToken
        }

        //Convertimos a texto y guardamos en el localStorage para poder usarlas en library/index.html
        const serializedUser = JSON.stringify(loginCredentials);
        //Guardamos nombre y accessTokens del usuario en variable "userData"
        localStorage.setItem("userData", serializedUser);

        location.assign("/library/index.html");

    }
    catch (error) {
        console.log(error);

        if (loginSuccess) {
            successMessage.classList.toggle("display");
            loginSuccess = false;
        }

        if (!loginError) {
            errorMessage.classList.toggle("display");
            loginError = true;
        }
    }
}