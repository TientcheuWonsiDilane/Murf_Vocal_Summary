const BACKEND_BASE_URL = "https://murf-vocal-summary.onrender.com";
const IMG_PATH = "https://image.tmdb.org/t/p/w1280";

let selectedMurfVoiceId = "en-US-natalie";
let currentAudio = null;
let hoverTimeout = null;

let currentPage = 1;
let currentGenre = "fiction"; // Default to fiction initial search
let currentQuery = "";

const main = document.getElementById("section");
const navbarForm = document.getElementById("navbar-search-form");
const navbarSearchInput = document.getElementById("navbar-search-query");
const bodyForm = document.getElementById("body-search-form");
const bodySearchInput = document.getElementById("body-search-query");
const voiceLanguageSelect = document.getElementById("voice-language-select");
const loadMoreBtn = document.getElementById("load-more-btn");
const genreRadios = document.getElementsByName("genre");

if (voiceLanguageSelect) {
    selectedMurfVoiceId = voiceLanguageSelect.value;
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

// Initial fetch
fetchBooks();

// Fetch movie backdrops and start slideshow (Books page hero backdrop rotates movie images per user request)
fetch(`${BACKEND_BASE_URL}/api/movies/popular`)
    .then(res => res.json())
    .then(data => {
        if (data.results && data.results.length > 0) {
            const backdrops = data.results
                .filter(m => m.backdrop_path)
                .slice(0, 5)
                .map(m => `${IMG_PATH}${m.backdrop_path}`);

            if (backdrops.length > 0) {
                startBackdropSlideshow(backdrops);
            } else {
                startDefaultSlideshow();
            }
        } else {
            startDefaultSlideshow();
        }
    })
    .catch(err => {
        console.warn("Failed to fetch popular movie backdrops, using defaults:", err);
        startDefaultSlideshow();
    });

function startDefaultSlideshow() {
    const defaultBackdrops = [
        "https://image.tmdb.org/t/p/w1280/xJHokZbljvCY1i1OjfUFTYWmgU1.jpg",
        "https://image.tmdb.org/t/p/w1280/s3TBrRGB1K73Kn45hVQQ1V2V2dY.jpg",
        "https://image.tmdb.org/t/p/w1280/o86u0244AX74rl75mY4DxU7m445.jpg",
        "https://image.tmdb.org/t/p/w1280/suaEO51FW5Kyj2w7X76461SB36P.jpg",
        "https://image.tmdb.org/t/p/w1280/vL5f6jHjH4hdxtLIjMgr4Cgd59I.jpg"
    ];
    startBackdropSlideshow(defaultBackdrops);
}

let backdropIndex = 0;
function startBackdropSlideshow(backdrops) {
    const heroBg = document.querySelector('.hero-bg-overlay');
    if (!heroBg) return;

    // Set initial background image
    heroBg.style.backgroundImage = `url('${backdrops[0]}')`;
    heroBg.style.opacity = 0.35;

    setInterval(() => {
        backdropIndex = (backdropIndex + 1) % backdrops.length;

        // Fade out
        heroBg.style.opacity = 0;

        setTimeout(() => {
            // Change background image and fade in
            heroBg.style.backgroundImage = `url('${backdrops[backdropIndex]}')`;
            heroBg.style.opacity = 0.35;
        }, 800); // Wait for fade-out transition (0.8s matching style.css)
    }, 10000); // 10 seconds interval
}

function fetchBooks(append = false) {
    let url = "";
    if (currentQuery) {
        url = `${BACKEND_BASE_URL}/api/books/search?q=${encodeURIComponent(currentQuery)}&page=${currentPage}`;
    } else if (currentGenre) {
        url = `${BACKEND_BASE_URL}/api/books/search?q=${encodeURIComponent(currentGenre)}&page=${currentPage}`;
    } else {
        url = `${BACKEND_BASE_URL}/api/books/initial?page=${currentPage}`;
    }

    returnBooks(url, append);
}

async function returnBooks(url, append = false) {
    try {
        console.log(`Fetching: ${url}, append=${append}`);
        if (!append) {
            main.innerHTML = '<p style="font-size: 1.1rem; color: #ccc; text-align: center; grid-column: 1 / -1;">Loading books...</p>';
        }

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log("Google Books API response:", data);

        if (!append) {
            main.innerHTML = '';
        }

        if (data.items && data.items.length > 0) {
            data.items.forEach(book => {
                const volumeInfo = book.volumeInfo || {};
                const div_card = document.createElement('div');
                div_card.setAttribute('class', 'card');

                const image = document.createElement('img');
                image.setAttribute('class', 'thumbnail');
                image.setAttribute('alt', `Cover for ${volumeInfo.title || 'Unknown book'}`);

                if (volumeInfo.imageLinks && volumeInfo.imageLinks.thumbnail) {
                    image.src = volumeInfo.imageLinks.thumbnail;
                } else if (volumeInfo.imageLinks && volumeInfo.imageLinks.smallThumbnail) {
                    image.src = volumeInfo.imageLinks.smallThumbnail;
                } else {
                    image.src = 'https://via.placeholder.com/128x192?text=No+Cover';
                }

                const description = volumeInfo.description ? volumeInfo.description.replace(/<[^>]*>/g, '').trim() : 'No description available.';
                image.dataset.description = description;

                const title = document.createElement('h4');
                const displayTitle = volumeInfo.title ? (volumeInfo.title.length > 40 ? volumeInfo.title.substring(0, 37) + "..." : volumeInfo.title) : 'Unknown Title';
                title.innerHTML = displayTitle;

                const authors = document.createElement('p');
                authors.setAttribute('class', 'authors');
                authors.innerHTML = volumeInfo.authors ? `by ${volumeInfo.authors.join(', ')}` : 'Unknown Author';

                const centre_tag = document.createElement('centre');

                centre_tag.appendChild(image);
                div_card.appendChild(centre_tag);
                div_card.appendChild(title);
                div_card.appendChild(authors);
                main.appendChild(div_card);

                let timeoutId;

                image.addEventListener('mouseenter', () => {
                    if (timeoutId) {
                        clearTimeout(timeoutId);
                    }
                    timeoutId = setTimeout(() => {
                        console.log(`Mouse hovered over: ${volumeInfo.title}`);
                        const bookDescription = image.dataset.description;
                        if (bookDescription && bookDescription !== 'No description available.') {
                            const TextToSpeak = `${volumeInfo.title}. ${volumeInfo.authors ? `By ${volumeInfo.authors.join(', ')}. ` : ''}[pause 0.4s] Summary: [pause 0.8s] ${bookDescription}`;
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
            if (!append) {
                main.innerHTML = '<p style="color: #ccc; text-align: center; grid-column: 1 / -1;">No books found for your search.</p>';
            } else {
                alert("No more books found.");
            }
        }

    } catch (error) {
        console.error("Error fetching books:", error);
        if (!append) {
            main.innerHTML = "<p style='color: #ef4444; text-align: center; grid-column: 1 / -1;'>Failed to load books. Please check your backend connection.</p>";
        } else {
            alert("Failed to load more books.");
        }
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
                rate: -15,
                pitch: 0,
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

        const audioUrl = data.audioFile || data.audio_url;

        if (audioUrl) {
            currentAudio = new Audio(audioUrl);
            currentAudio.play().catch(e => console.error("Error playing audio:", e));
        } else {
            console.error("No audio URL found in Murf AI response. Response data:", data);
        }

    } catch (error) {
        console.error("Failed to fetch or play Murf AI audio:", error);
    }
}

// Bind navbar and body searches
function handleSearch(searchQuery) {
    if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
        currentAudio = null;
    }
    clearTimeout(hoverTimeout);

    currentQuery = searchQuery;
    currentPage = 1;

    // Clear sidebar highlights since we are doing a text search
    genreRadios.forEach(radio => {
        radio.checked = false;
    });
    currentGenre = "";

    fetchBooks(false);
}

if (navbarForm) {
    navbarForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const searchItem = navbarSearchInput.value.trim();
        if (searchItem) {
            handleSearch(searchItem);
            navbarSearchInput.value = searchItem; // preserve text in query bar
            if (bodySearchInput) bodySearchInput.value = "";
        }
    });
}

if (bodyForm) {
    bodyForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const searchItem = bodySearchInput.value.trim();
        if (searchItem) {
            handleSearch(searchItem);
            bodySearchInput.value = searchItem;
            if (navbarSearchInput) navbarSearchInput.value = "";
        }
    });
}

// Click listener on search image icons
document.querySelectorAll(".search-img").forEach(img => {
    img.addEventListener("click", () => {
        const parentForm = img.closest("form");
        if (parentForm) {
            parentForm.requestSubmit();
        }
    });
});

// Bind Category Sidebar Radio filters
genreRadios.forEach(radio => {
    radio.addEventListener("change", (e) => {
        if (e.target.checked) {
            if (currentAudio) {
                currentAudio.pause();
                currentAudio.currentTime = 0;
                currentAudio = null;
            }

            currentGenre = e.target.value;
            currentQuery = "";
            currentPage = 1;

            // Reset text searches
            if (navbarSearchInput) navbarSearchInput.value = "";
            if (bodySearchInput) bodySearchInput.value = "";

            fetchBooks(false);
        }
    });
});

// Bind pagination Load More Button
if (loadMoreBtn) {
    loadMoreBtn.addEventListener("click", () => {
        currentPage++;
        fetchBooks(true);
    });
}