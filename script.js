const BACKEND_BASE_URL = "https://murf-vocal-summary.onrender.com";
const IMG_PATH = "https://image.tmdb.org/t/p/w1280";

let selectedMurfVoiceId = "en-US-natalie";
let currentAudio = null;
let hoverTimeout = null;

let currentPage = 1;
let currentGenre = "popular"; 
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

fetchMovies();

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
let slideshowInterval = null;

function startBackdropSlideshow(backdrops) {
    const heroBg = document.querySelector('.hero-bg-overlay');
    if (!heroBg) return;

    if (slideshowInterval) clearInterval(slideshowInterval);

    heroBg.style.backgroundImage = `url('${backdrops[0]}')`;
    heroBg.style.opacity = 0.35;

    slideshowInterval = setInterval(() => {
        backdropIndex = (backdropIndex + 1) % backdrops.length;

        heroBg.style.opacity = 0;

        setTimeout(() => {
            heroBg.style.backgroundImage = `url('${backdrops[backdropIndex]}')`;
            heroBg.style.opacity = 0.35;
        }, 800); 
    }, 10000); 
} 

function fetchMovies(append = false) {
    let url = "";
    if (currentQuery) {
        url = `${BACKEND_BASE_URL}/api/movies/search?q=${encodeURIComponent(currentQuery)}&page=${currentPage}`;
    } else if (currentGenre && currentGenre !== "popular") {
        url = `${BACKEND_BASE_URL}/api/movies/popular?genre=${currentGenre}&page=${currentPage}`;
    } else {
        url = `${BACKEND_BASE_URL}/api/movies/popular?page=${currentPage}`;
    }

    returnMovie(url, append);
}

function returnMovie(url, append = false) {
    console.log(`Fetching: ${url}, append=${append}`);

    if (!append) {
        main.innerHTML = '<p style="font-size: 1.1rem; color: #ccc; text-align: center; grid-column: 1 / -1;">Loading movies...</p>';
    }

    fetch(url)
        .then(res => {
            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }
            return res.json();
        })
        .then(data => {
            if (!append) {
                main.innerHTML = "";
            }

            if (!data.results || data.results.length === 0) {
                if (!append) {
                    main.innerHTML = '<p style="font-size: 1.1rem; color: #ccc; text-align: center; grid-column: 1 / -1;">No movies found.</p>';
                } else {
                    console.log("No more movies to load.");
                    alert("No more movies found.");
                }
                return;
            }

            data.results.forEach(element => {
                const div_card = document.createElement('div');
                div_card.setAttribute('class', 'card');

                const center_tag = document.createElement('center');
                center_tag.style.position = 'relative'; // Required for loader positioning

                const image = document.createElement('img');
                image.setAttribute('class', 'thumbnail');
                image.setAttribute('alt', `Cover for ${element.title}`);

                image.dataset.overview = element.overview || "No description available.";

                const title = document.createElement('h4');
                title.innerHTML = element.title;

                if (element.poster_path) {
                    image.src = IMG_PATH + element.poster_path;
                } else {
                    image.src = 'https://via.placeholder.com/240x360?text=No+Cover';
                }

                center_tag.appendChild(image);
                div_card.appendChild(center_tag);
                div_card.appendChild(title);
                main.appendChild(div_card);

                let timeoutId;

                image.addEventListener('mouseenter', () => {
                    if (timeoutId) {
                        clearTimeout(timeoutId);
                    }
                    timeoutId = setTimeout(() => {
                        console.log(`Mouse hovered over: ${element.title}`);
                        const movieOverview = `${element.title}. [pause 0.4s] Summary: [pause 0.8s] ` + image.dataset.overview;
                        if (image.dataset.overview && image.dataset.overview !== "No description available.") {
                            playSummaryAudio(movieOverview, center_tag); 
                        } else {
                            console.log(`No overview summary available for: ${element.title}`);
                        }
                    }, 1000);
                });

               image.addEventListener('mouseleave', () => {
                    if (timeoutId) {
                        clearTimeout(timeoutId);
                    }
                    
                    center_tag.querySelectorAll('.audio-overlay').forEach(el => el.remove());
                    
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
            if (!append) {
                main.innerHTML = '<p style="font-size: 1.1rem; color: #ef4444; text-align: center; grid-column: 1 / -1;">Failed to load movies. Please check your backend connection.</p>';
            } else {
                alert("Failed to load more movies.");
            }
        });
}

async function playSummaryAudio(textToSpeak, targetContainer) {
    if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
        currentAudio = null;
    }

    document.querySelectorAll('.audio-overlay').forEach(el => el.remove());

    if (!selectedMurfVoiceId) {
        console.error("No Murf voice selected.");
        return;
    }

    const loader = document.createElement('div');
    loader.className = 'audio-overlay loading';
    loader.innerHTML = '<div class="spinner"></div>';
    
    if (targetContainer) {
        targetContainer.appendChild(loader);
    }

    try {
        const limitedText = textToSpeak.length > 800 ? textToSpeak.substring(0, 800) + "..." : textToSpeak;

        const response = await fetch(`${BACKEND_BASE_URL}/api/murf/generate-audio`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                text: limitedText,
                voice_id: selectedMurfVoiceId,
                rate: -20,
                pitch: 0,
                style: 'conversational',
            }),
        });

        loader.remove();

        if (!response.ok) throw new Error(`Proxy Error: ${response.statusText}`);

        const audioBlob = await response.blob();
        
        if (audioBlob.size > 0) {
            const audioUrl = URL.createObjectURL(audioBlob);
            currentAudio = new Audio(audioUrl);
            
            currentAudio.play().then(() => {
                const playingIndicator = document.createElement('div');
                playingIndicator.className = 'audio-overlay playing';
                playingIndicator.innerHTML = '<div class="bar"></div><div class="bar"></div><div class="bar"></div>';
                
                if (targetContainer) {
                    targetContainer.appendChild(playingIndicator);
                }

                currentAudio.addEventListener('ended', () => {
                    playingIndicator.remove();
                });

            }).catch(e => {
                console.warn("Audio play blocked by autoplay policy. Click the page first.");
            });
        }

    } catch (error) {
        loader.remove(); 
        console.error("Failed to fetch or play Murf AI audio:", error);
    }
}

function handleSearch(searchQuery) {
    if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
        currentAudio = null;
    }
    clearTimeout(hoverTimeout);

    currentQuery = searchQuery;
    currentPage = 1;

    genreRadios.forEach(radio => {
        radio.checked = false;
    });
    currentGenre = null;

    fetchMovies(false);
}

if (navbarForm) {
    navbarForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const searchItem = navbarSearchInput.value.trim();
        if (searchItem) {
            handleSearch(searchItem);
            navbarSearchInput.value = searchItem; 
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

document.querySelectorAll(".search-img").forEach(img => {
    img.addEventListener("click", () => {
        const parentForm = img.closest("form");
        if (parentForm) {
            parentForm.requestSubmit();
        }
    });
});

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

            if (navbarSearchInput) navbarSearchInput.value = "";
            if (bodySearchInput) bodySearchInput.value = "";

            fetchMovies(false);
        }
    });
});

if (loadMoreBtn) {
    loadMoreBtn.addEventListener("click", () => {
        currentPage++;
        fetchMovies(true);
    });
}