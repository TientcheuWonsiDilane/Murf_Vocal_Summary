const BACKEND_BASE_URL = "http://localhost:3000"; 

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

returnBooks(`${BACKEND_BASE_URL}/api/books/initial`);

async function returnBooks(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log("Google Books API response:", data);

        main.innerHTML = '';

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

                if (volumeInfo.imageLinks && volumeInfo.imageLinks.thumbnail) {
                    image.src = volumeInfo.imageLinks.thumbnail;
                } else if (volumeInfo.imageLinks && volumeInfo.imageLinks.smallThumbnail) {
                    image.src = volumeInfo.imageLinks.smallThumbnail;
                } else {
                    image.src = 'https://via.placeholder.com/128x192?text=No+Cover'; 
                    image.alt = `No cover available for ${volumeInfo.title}`;
                }

                const description = volumeInfo.description ? volumeInfo.description.replace(/<[^>]*>/g, '').trim() : 'No description available.';
                image.dataset.description = description;

                const title = document.createElement('h4');
                const displayTitle = volumeInfo.title ? (volumeInfo.title.length > 25 ? volumeInfo.title.substring(0, 22) + "..." : volumeInfo.title) : 'Unknown Title';
                title.innerHTML = displayTitle;

                const authors = document.createElement('p');
                authors.setAttribute('class', 'authors');
                authors.style.color = '#ccc';
                authors.style.fontSize = '0.7em';
                authors.innerHTML = volumeInfo.authors ? `by ${volumeInfo.authors.join(', ')}` : 'Unknown Author';

                const centre = document.createElement('centre'); 

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
                        if (bookDescription && bookDescription !== 'No description available.') {
                            const TextToSpeak = `${volumeInfo.title}. ${volumeInfo.authors ? `By ${volumeInfo.authors.join(', ')}. ` : ''}[pause 0.3s] Summary:[pause 0.75s] ${bookDescription}`;
                            playSummaryAudio(TextToSpeak);
                        } else {
                            console.log(`No description available for ${volumeInfo.title}. Skipping audio summary.`);
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

    if (!selectedMurfVoiceId) {
        console.error("No Murf voice selected. Cannot generate audio.");
        alert("Please select a voice language from the dropdown menu.");
        return;
    }

    try {
        const text = textToSpeak.length > 800 ? textToSpeak.substring(0, 800) + "..." : textToSpeak;
        console.log("Requesting audio from Murf AI via proxy for:", text.substring(0, 100) + "...");

        const response = await fetch(`${BACKEND_BASE_URL}/api/murf/generate-audio`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                text: text,
                voice_id: selectedMurfVoiceId,
                rate: -22,
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
        console.log("Murf AI response (via proxy):", data);

        const audioUrl = data.audioFile ;

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
        const searchURL = `${BACKEND_BASE_URL}/api/books/search?q=${encodeURIComponent(searchItem)}`;
        returnBooks(searchURL);
        search.value = '';
    }
});