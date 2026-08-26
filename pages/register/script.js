const registerForm = document.querySelector('#registerForm')
registerForm.addEventListener('submit',
    (event) => { printFieldsContent(event); }
)

const registerButton = document.querySelector("#registerButton");
const cancelButton = document.querySelector("#cancelButton");

const errorMessage = document.querySelector("#errorMessage");
const successMessage = document.querySelector("#successMessage");
let loginError = false;
let loginSuccess = false;

/* 
============================================
                FUNCTIONS
============================================
*/
function printFieldsContent(event) {

    //Evitar que el formulario se mande, de esta manera no se actualiza la pagina.
    event.preventDefault();

    let userRegistrationData = {}

    const inputs = registerForm.querySelectorAll("input");

    for (const input of inputs) {
        const fieldName = input.name;
        const fieldValue = input.value;
        userRegistrationData[`${fieldName}`] = fieldValue;
    }

    if (userRegistrationData.password !== userRegistrationData.rptPassword) {
        alert("Las contrasennias no coinciden");
        return
    }

    registerGet(userRegistrationData);
}


async function registerGet(userRegistrationData) {

    const waitTimer = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    try {
        const response = await fetch('https://languagedive.bryanrodriguez.tech/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body:
                JSON.stringify(userRegistrationData)
        }).then(response => {
            if (!response.ok) {
                throw new Error("El usuario ya esta creado> ", response);
            }
            return response.json()
        }).then(data => data);

        console.log("Usuario creado!\n", response);

        successMessage.classList.toggle("display");
        loginSuccess = true;

        if (loginError) {
            errorMessage.classList.toggle("display");
            loginError = false;
        }

        registerButton.disabled = true;
        cancelButton.disabled = true;

        await waitTimer(2000); 

        location.assign("/login/index.html");

    }
    catch (error) {

        console.log("Error al crear al usuario:", error);

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
