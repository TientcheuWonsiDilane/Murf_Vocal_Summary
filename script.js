const APILINK = "https://api.themoviedb.org/3/discover/movie?sort_by=popularity.desc&api_key=cdda24a5df571a4d8d592c08e95d47dc&page=1";
const IMG_PATH = "https://image.tmdb.org/t/p/w1280";
const SEARCHAPI = "https://api.themoviedb.org/3/search/movie?&api_key=cdda24a5df571a4d8d592c08e95d47dc&query=";

const MURF_API_ENDPOINT = "https://api.murf.ai/v1/speech/generate"; 
const MURF_VOICE_ID = "en-US-amara"; 

let currentAudio = null; 
let hoverTimeout = null; 

const main = document.getElementById("section");
const form = document.getElementById("form");
const search = document.getElementById("query");

returnMovie(APILINK);

function returnMovie(url) {
    fetch(url)
        .then(res => res.json())
        .then(function(data) {
            console.log(data.results);
            data.results.forEach(element => {
                const div_card = document.createElement('div');
                div_card.setAttribute('class', 'card');

                const div_row = document.createElement('div');
                div_row.setAttribute('class', 'row');

                const div_column = document.createElement('div');
                div_column.setAttribute('class', 'column');

                const image = document.createElement('img');
                image.setAttribute('class', 'thumbnail');
                image.setAttribute('id', 'image');

                image.dataset.overview = element.overview;

                const title = document.createElement('h3');
                title.setAttribute('id', 'title');

                const centre = document.createElement('centre');

                title.innerHTML = `${element.title}`;
                image.src = IMG_PATH + element.poster_path;

                centre.appendChild(image);
                div_card.appendChild(centre);
                div_card.appendChild(title);
                div_column.appendChild(div_card);
                div_row.appendChild(div_column);

                main.appendChild(div_row);

                let timeoutId; 

                image.addEventListener('mouseenter', () => {
                    if (timeoutId) {
                        clearTimeout(timeoutId);
                    }
                    timeoutId = setTimeout(() => {
                        console.log(`Mouse hovered over: ${element.title}`);
                        const movieOverview = `${element.title} [pause 0.3s] summary. [pause 1s]` + image.dataset.overview;
                        if (movieOverview) {
                            playSummaryAudio(movieOverview);
                        }
                    }, 1000);
                });

                image.addEventListener('mouseleave', () => {
                    if (timeoutId) {
                        clearTimeout(timeoutId);
                    }
                    if (currentAudio) {
                        currentAudio.pause();
                        currentAudio.currentTime = 0; 
                        currentAudio = null;
                    }
                });
            });
        })
        .catch(error => console.error("Error fetching movies:", error));
}

async function playSummaryAudio(textToSpeak) {
    if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
        currentAudio = null;
    }

    try {
        console.log("Requesting audio from Murf AI for:", textToSpeak.substring(0, 50) + "..."); 
        const response = await fetch(MURF_API_ENDPOINT, {
            method: 'POST',
            headers: {
                'api-key': 'ap2_8a5246af-22f3-48b1-808e-db7da4a1ccbd',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                text: textToSpeak,
                voice_id: MURF_VOICE_ID,
                rate: -25,
            }),
        });

        const data = await response.json();
        console.log("Murf AI response:", data);

        const audioUrl = data.audioFile; 

        if (audioUrl) {
            currentAudio = new Audio(audioUrl);
            currentAudio.play().catch(e => console.error("Error playing audio:", e));
        } else {
            console.error("No audio URL found in Murf AI response.");
        }

    } catch (error) {
        console.error("Failed to fetch or play Murf AI audio:", error);
        alert("Sorry, could not generate audio summary at this time.");
    }
}

form.addEventListener("submit", (e) => {
    e.preventDefault();
    main.innerHTML = ''; 

    if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
        currentAudio = null;
    }
    clearTimeout(hoverTimeout);

    const searchItem = search.value;

    if (searchItem) {
        returnMovie(SEARCHAPI + searchItem);
        search.value = '';
    }
});