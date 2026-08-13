// Variable para almacenar tu Token (después lo podrás obtener de un login)
const token = "eyJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoiUk9MRV9VU0VSIiwic3ViIjoiNCIsImlhdCI6MTc4NjA3NjU2MiwiZXhwIjoxNzg2MDc4MDAyfQ.a5x1SjanFQsB8IVG8xV02ItTAl5iy97C3ibrPC9UnDQ"; 
const url = "https://languagedive.bryanrodriguez.tech/api/vocabulary";

async function getVocabulary() {
    try {
        // Al usar '/api/vocabulary', el navegador busca automáticamente en el mismo dominio
        const response = await fetch{url , {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP Error: ${response.status}`);
        }

        const data = await response.json();
        console.log("Vocabulario recibido:", data);
        
        // Aquí ejecutas la función para mostrar los datos en tu HTML
        renderVocabulary(data.entries);

    } catch (error) {
        console.error("Error al obtener el vocabulario:", error);
    }
}

// Ejecutar al cargar la página
getVocabulary();
