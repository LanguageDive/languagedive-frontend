const registerForm = document.querySelector('#registerForm')
registerForm.addEventListener('submit',
    (event) => { printFieldsContent(event); }
)

const errorMessage = document.querySelector("#errorMessage");
const successMessage = document.querySelector("#successMessage");
let userAlreadyExistsTry = false;
let userSuccessTry = false;
/* 
============================================
                FUNCTIONS
============================================
*/
function printFieldsContent(event) {
    event.preventDefault();

    let formObject = {}

    const inputs = registerForm.querySelectorAll("input");

    for (const input of inputs) {
        const fieldName = input.name;
        const fieldValue = input.value;
        formObject[`${fieldName}`] = fieldValue;
    }

    if (formObject.password !== formObject.rptPassword) {
        alert("Las contrasennias no coinciden");
        return
    }

    const userData = {
        "username": formObject.username,
        "email": formObject.email,
        "password": formObject.password
    }

    tryGET(userData);
}


async function tryGET(userData) {
    try {
        const response = await fetch('https://languagedive.bryanrodriguez.tech/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body:
                JSON.stringify(userData)
        }).then(response => {
            if (!response.ok) {
                throw new Error("El usuario ya esta creado> ", response);
            }
            return response.json()
        }).then(data => {
            return data;
        });

        console.log("Usuario creado!\n", response);

        successMessage.classList.toggle("display");
        userSuccessTry = true;

        if (userAlreadyExistsTry) {
            errorMessage.classList.toggle("display");
            userAlreadyExistsTry = false;
        }

    }
    catch (error) {


        console.log("Error al crear al usuario:", error);

        if(userSuccessTry){
            successMessage.classList.toggle("display");
            userSuccessTry = false;
        }

        if (!userAlreadyExistsTry) {
            errorMessage.classList.toggle("display");
            userAlreadyExistsTry = true;
        }
    }
}
