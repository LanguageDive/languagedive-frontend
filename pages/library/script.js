const serializedUser = localStorage.getItem("userData");
const retrievedUserObject = JSON.parse(serializedUser);

const userNameHeader = document.querySelector("#username");
userNameHeader.textContent = (retrievedUserObject.username).toUpperCase();

const fileType = "application/epub+zip"
const maxFileSize = 10*1024*1024;
const epubFile = document.querySelector("#epubFile");

epubFile.addEventListener("change", () => {
    const file = epubFile.files[0];

    //El archivo no existe
    if(!file){
        return;
    }

    const filenameLower = file.name.toLowerCase();

    //El archivo supera el limite de tamannio o no es EPUB
    if((file.size > maxFileSize) || (!filenameLower.endsWith('.epub'))){
        console.log("Lo siento papu, de aqui no pasas");
        return;
    }
    console.log("Vas por buen camino papu");
    console.log(file);

    epubPost(file);
});

async function epubPost(file){
    const accesToken = retrievedUserObject.accessToken;
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch("https://languagedive.bryanrodriguez.tech/api/courses/import", {
        method: 'POST',
        headers: {
            'Authorization' : `Bearer ${accesToken}`
        },
        body: formData
    }).then(response => response.json());

    console.log(response);
    console.log(response.id);
};