import { setBusy } from '../loading.js';
import { setupValidation, rules } from '../form-validation.js';

const registerForm = document.querySelector('#registerForm')
registerForm.addEventListener('submit',
    (event) => { printFieldsContent(event); }
)

const registerButton = document.querySelector("#registerButton");
const cancelButton = document.querySelector("#cancelButton");
cancelButton.addEventListener("click", () => location.assign("/login/"));

const errorMessage = document.querySelector("#errorMessage");

// Validación con mensajes propios (el formulario tiene novalidate).
// Los límites son los que acepta la API (RegisterRequest)
const registerValidation = setupValidation(registerForm, {
    username: [
        rules.required("Elige un nombre de usuario."),
        rules.noSpaces("El nombre de usuario no puede tener espacios."),
        rules.maxLength(255, "El nombre de usuario es demasiado largo (máximo 255 caracteres).")
    ],
    email: [
        rules.required("Escribe tu correo electrónico."),
        rules.email("Ese correo no parece válido. Revisa que tenga @ y un dominio, como nombre@correo.com."),
        rules.maxLength(255, "El correo es demasiado largo (máximo 255 caracteres).")
    ],
    password: [
        rules.required("Crea una contraseña."),
        rules.minLength(8, "La contraseña necesita al menos 8 caracteres."),
        rules.maxLength(255, "La contraseña es demasiado larga (máximo 255 caracteres).")
    ],
    rptPassword: [
        rules.required("Repite tu contraseña."),
        rules.matches("password", "Las contraseñas no coinciden. Escribe la misma en los dos campos.")
    ]
}, {
    // Si cambia la contraseña, se vuelve a revisar la repetida
    password: ["rptPassword"]
});
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

    if (!registerValidation.validate()) return;

    let userRegistrationData = {}

    const inputs = registerForm.querySelectorAll("input");

    for (const input of inputs) {
        const fieldName = input.name;
        const fieldValue = input.value;
        userRegistrationData[`${fieldName}`] = fieldValue;
    }

    registerGet(userRegistrationData);
}


async function registerGet(userRegistrationData) {

    //Crear función de timer para futura espera.
    const waitTimer = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    setBusy(registerButton, true);

    try {
        const response = await fetch('https://languagedive.bryanrodriguez.tech/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userRegistrationData)
        }).then(response => {
            if (!response.ok) {
                throw new Error("El usuario ya esta creado> ", response);
            }
            return response.json()
        }).then(data => data);

        console.log("Usuario creado!\n", response);
        setBusy(registerButton, false);

        successMessage.classList.toggle("display");
        loginSuccess = true;

        if (loginError) {
            errorMessage.classList.toggle("display");
            loginError = false;
        }

        //Deshabilitar los botones para evitar errores de formulario
        registerButton.disabled = true;
        cancelButton.disabled = true;

        //Esperar 2 segundos para efectos de ver la ventana con mensaje de éxito
        await waitTimer(2000); 

        //Window.location, manda a otra página
        location.assign("/login/index.html");

    }
    catch (error) {

        console.log("Error al crear al usuario:", error);
        setBusy(registerButton, false);

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
