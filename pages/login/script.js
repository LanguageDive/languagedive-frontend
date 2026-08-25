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

    console.log(userLoginData);

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