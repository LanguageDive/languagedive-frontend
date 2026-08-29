export const serializedUser = localStorage.getItem("userData");
export const retrievedUserObject = JSON.parse(serializedUser);

export async function refreshAccessToken(refreshToken) {
    console.log("Solicitando refreshtoken al endpoint");
    try {
        // Mandar solicitud al endpoint de refresh para obtener un nuevo accessToken
        const response = await fetch("https://languagedive.bryanrodriguez.tech/api/auth/refresh", {
            method: "POST",
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                'refreshToken': refreshToken
            })
        }).then(response => {
            // Si nos da un error debido a que el usuario no ha entrado en mucho tiempo, lanzamos un error
            if (!response.ok) {
                throw new Error("Algo salio mal", response);
            }
            return response.json();
        });
        // Con fines de debug
        console.log(response);
        // Actualizamos el objeto del usuario
        retrievedUserObject.accessToken = response.accessToken;
        retrievedUserObject.refreshToken = response.refreshToken;
        // Serializamos el objeto actualizado del usuario en un JSON
        const updatedUserSerialization = JSON.stringify(retrievedUserObject);
        // Guardamos el objeto serializado en localStorage
        localStorage.setItem("userData", updatedUserSerialization);
        // Retornamos el nuevo accessToken
        return retrievedUserObject.accessToken;
    }
    catch (error) {
        console.error(error);
        location.assign("/login/index.html");
        return false;
    }
}