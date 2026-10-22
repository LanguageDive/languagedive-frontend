// Página de prueba: usa el token de la sesión iniciada en /login (guardado en localStorage)
const userData = JSON.parse(localStorage.getItem("userData"));
const url = "https://languagedive.bryanrodriguez.tech/api/vocabulary";

async function getVocabulary() {
    const result = document.querySelector("#API-result");

    if (!userData) {
        result.textContent = "No hay sesión iniciada: inicia sesión primero.";
        return;
    }

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${userData.accessToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP Error: ${response.status}`);
        }

        const data = await response.json();
        console.log("Vocabulario recibido:", data);

        result.textContent = JSON.stringify(data.entries, null, 2);

    } catch (error) {
        console.error("Error al obtener el vocabulario:", error);
        result.textContent = error.message;
    }
}

// Ejecutar al cargar la página
getVocabulary();
