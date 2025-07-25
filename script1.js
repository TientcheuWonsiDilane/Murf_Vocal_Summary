const GOOGLE_API_BASE = "https://www.googleapis.com/books/v1/volumes";
const INITIAL_BOOKS_SEARCH = "fiction"; 
const GOOGLE_API_KEY = " AIzaSyCI-BcBRXIU6Ca0IBgut35nRmtFOEUWX2c";

const MURF_API_ENDPOINT = "https://api.murf.ai/v1/speech/generate";
let selectedMurfVoiceId = "en-US-amara"; 
const MURF_API_KEY = "ap2_8a5246af-22f3-48b1-808e-db7da4a1ccbd";

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


returnBooks(`${GOOGLE_API_BASE}?q=${encodeURIComponent(INITIAL_BOOKS_SEARCH)}&maxResults=25&key=${GOOGLE_API_KEY}`);

async function returnBooks(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log("Google Books API response:", data);

        if (data.items && data.items.length > 0) {
            data.items.forEach(book => {
                const volumeInfo = book.volumeInfo;

                const div_card = document.createElement('div');
                div_card.setAttribute('class', 'card');

                const div_row = document.createElement('div');
                div_row.setAttribute('class', 'row');

                const div_column = document.createElement('div'); 
                div_column.setAttribute('class', 'column');

                const image = document.createElement('img');
                image.setAttribute('class', 'thumbnail');
                image.setAttribute('alt', `Cover for ${volumeInfo.title}`);

                const description = volumeInfo.description.replace(/<[^>]*>/g, '').trim();
                image.dataset.description = description;


                const title = document.createElement('h4');
                const displayTitle = volumeInfo.title.length > 25 ? volumeInfo.title.substring(0, 22) + "..." : volumeInfo.title;
                title.innerHTML = displayTitle;

                const authors = document.createElement('p');
                authors.setAttribute('class', 'authors');
                authors.style.color = '#ccc'; 
                authors.style.fontSize = '0.7em';
                authors.innerHTML = volumeInfo.authors ? `by ${volumeInfo.authors.join(', ')}` : 'Unknown Author';

                const centre = document.createElement('centre'); 

                image.src = volumeInfo.imageLinks.thumbnail

                centre.appendChild(image);
                div_card.appendChild(centre);
                div_card.appendChild(title);
                div_card.appendChild(authors);
                div_column.appendChild(div_card);
                div_row.appendChild(div_column);

                main.appendChild(div_row);

                let timeoutId;

                image.addEventListener('mouseenter', () => {
                    if (timeoutId) {
                        clearTimeout(timeoutId);
                    }
                    timeoutId = setTimeout(() => {
                        console.log(`Mouse hovered over: ${volumeInfo.title}`);
                        const bookDescription = image.dataset.description;
                        if (bookDescription) {
                            const TextToSpeak = `${volumeInfo.title}. ${volumeInfo.authors ? `By ${volumeInfo.authors.join(', ')}. ` : ''}[pause 0.3s] Summary:[pause 0.75s] ${bookDescription}`;
                            playSummaryAudio(TextToSpeak);
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
        } else {
            main.innerHTML = '<p style="color: white; text-align: center; width: 100%;">No books found for your search.</p>';
        }

    } catch (error) {
        console.error("Error fetching books:", error);
        main.innerHTML = '<p style="color: red; text-align: center; width: 100%;">Failed to load books. Please try again later.</p>';
    }
}


async function playSummaryAudio(textToSpeak) {
    if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
        currentAudio = null;
    }

    try {
        const text = textToSpeak.length > 800 ? textToSpeak.substring(0, 800) + "..." : textToSpeak;
        console.log("Requesting audio from Murf AI for:", text.substring(0, 100) + "...");

        const response = await fetch(MURF_API_ENDPOINT, {
            method: 'POST',
            headers: {
                'api-key': MURF_API_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                text: text,
                voice_id: selectedMurfVoiceId,
                rate: -30, 
            }),
        });

        const data = await response.json();
        console.log("Murf AI response:", data);

        const audioUrl = data.audioFile;

        if (audioUrl) {
            currentAudio = new Audio(audioUrl);
            currentAudio.play().catch(e => console.error("Error playing audio:", e));
        } else {
            console.error("No audio URL found in Murf AI response. Response data:", data);
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
        const searchURL = `${GOOGLE_API_BASE}?q=${encodeURIComponent(searchItem)}&maxResults=50&printType=books&orderBy=relevance&key=${GOOGLE_API_KEY}`;
        returnBooks(searchURL);
        search.value = '';
    }
});