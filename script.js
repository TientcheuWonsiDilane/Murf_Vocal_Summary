const BACKEND_BASE_URL = "http://localhost:3000"; 

const IMG_PATH = "https://image.tmdb.org/t/p/w1280"; 

let selectedMurfVoiceId = "en-US-natalie";
let currentAudio = null;
let hoverTimeout = null;

const main = document.getElementById("section");
const form = document.getElementById("form");
const search = document.getElementById("query");
const voiceLanguageSelect = document.getElementById("voice-language-select");

if (voiceLanguageSelect) {
    selectedMurfVoiceId = voiceLanguageSelect.value;
}

if (voiceLanguageSelect) {
    voiceLanguageSelect.addEventListener('change', (event) => {
        selectedMurfVoiceId = event.target.value;
        console.log("Voice language changed to:", selectedMurfVoiceId);
        if (currentAudio) {
            currentAudio.pause();
            currentAudio.currentTime = 0;
            currentAudio = null;
        }
    });
}

returnMovie(`${BACKEND_BASE_URL}/api/movies/popular`);

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

                const title = document.createElement('h4');
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
        .catch(error => {
            console.error("Error fetching movies:", error);
            main.innerHTML = '<p style="color: red; text-align: center; width: 100%;">Failed to load movies. Please try again later.</p>';
        });
}

async function playSummaryAudio(textToSpeak) {
    if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
        currentAudio = null;
    }

    if (!selectedMurfVoiceId) {
        console.error("No Murf voice selected. Cannot generate audio.");
        alert("Please select a voice language from the dropdown menu.");
        return;
    }

    try {
        const limitedText = textToSpeak.length > 800 ? textToSpeak.substring(0, 800) + "..." : textToSpeak;
        console.log("Requesting audio from Murf AI via proxy for:", limitedText.substring(0, 100) + "...");

        const response = await fetch(`${BACKEND_BASE_URL}/api/murf/generate-audio`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                text: limitedText,
                voice_id: selectedMurfVoiceId,
                rate: -25,
                pitch: -5,
                style: 'conversational',
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error("Backend Proxy Error:", response.status, response.statusText, errorData);
            throw new Error(`Proxy Error: ${response.statusText}. Details: ${errorData.error || 'Unknown error'}`);
        }

        const data = await response.json();
        console.log("Response from proxy (Murf AI data):", data);

        const audioUrl = data.audioFile || data.audio_url;

        if (audioUrl) {
            currentAudio = new Audio(audioUrl);
            currentAudio.play().catch(e => console.error("Error playing audio:", e));
        } else {
            console.error("No audio URL found in proxy response. Response data:", data);
        }

    } catch (error) {
        console.error("Failed to fetch or play Murf AI audio:", error);
        alert("Sorry, could not generate audio summary at this time. Check console for details.");
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
        returnMovie(`${BACKEND_BASE_URL}/api/movies/search?q=${encodeURIComponent(searchItem)}`);
        search.value = '';
    }
});