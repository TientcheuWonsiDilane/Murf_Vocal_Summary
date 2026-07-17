require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const TMDB_API_KEY = process.env.TMDB_API_KEY; 
const MURF_API_KEY = process.env.MURF_API_KEY;
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY; 

const TMDB_BASE_URL = "https://api.themoviedb.org/3"; 
const MURF_API_ENDPOINT = "https://api.murf.ai/v1/speech/generate";
const GOOGLE_BOOKS_API_BASE = "https://www.googleapis.com/books/v1/volumes"; 

// Premium Mock Fallback Database
const FALLBACK_MOVIES = {
  results: [
    {
      id: 101,
      title: "Interstellar",
      poster_path: "/gEU21jvw5r38u24lmrGejF73rJu.jpg",
      genre_ids: [878, 12, 18],
      overview: "The adventures of a group of explorers who make use of a newly discovered wormhole to surpass the limitations on human space travel and conquer the vast distances involved in an interstellar voyage."
    },
    {
      id: 102,
      title: "Inception",
      poster_path: "/oYu24ueLSgzFSxD13wpe5Vm2XcV.jpg",
      genre_ids: [28, 878, 12],
      overview: "Cobb, a skilled thief who commits subconscious espionage, is given a chance to have his life back and return to his children if he can perform the impossible task of inception: planting an idea."
    },
    {
      id: 103,
      title: "The Dark Knight",
      poster_path: "/qJ2KSHJhlFvASBMLbGuP7OFMaFg.jpg",
      genre_ids: [28, 53, 80],
      overview: "Batman raises the stakes in his war on crime. With the help of Lt. Jim Gordon and District Attorney Harvey Dent, Batman sets out to dismantle the remaining criminal organizations that plague the streets."
    },
    {
      id: 104,
      title: "Pulp Fiction",
      poster_path: "/d5iIlvfjmjeI0w09JGh6Jbs5XZ7.jpg",
      genre_ids: [53, 80, 35],
      overview: "A burger-loving hitman, his philosophical partner, a drug-addled gangster's moll, and a washed-up boxer converge in this sprawling, comedic crime caper. Their adventures unfurl in three stories."
    },
    {
      id: 105,
      title: "The Hobbit: An Unexpected Journey",
      poster_path: "/u21hyV24m5Ryp24sD1eA1eD2yC.jpg",
      genre_ids: [12, 14, 28],
      overview: "A reluctant Hobbit, Bilbo Baggins, sets out to the Lonely Mountain with a spirited group of dwarves to reclaim their mountain home, and the gold within it, from the dragon Smaug."
    },
    {
      id: 106,
      title: "Gladiator",
      poster_path: "/ty8hDCcc4hQ14XIF34XgkRceR8D.jpg",
      genre_ids: [28, 36, 12],
      overview: "In the year 180, the death of Emperor Marcus Aurelius throws the Roman Empire into chaos. Maximus Decimus Meridius, one of the Roman army's most capable generals, is betrayed and forced into slavery as a gladiator."
    },
    {
      id: 107,
      title: "Avatar",
      poster_path: "/kyeqWzo2vSSIS5wX75mcR9qEG0D.jpg",
      genre_ids: [878, 12, 14, 28],
      overview: "In the 22nd century, a paraplegic Marine is dispatched to the moon Pandora on a unique mission, but becomes torn between following his orders and protecting the world he feels is his home."
    },
    {
      id: 108,
      title: "The Hangover",
      poster_path: "/131hyV24m5Ryp24sD1eA1eD2yD.jpg",
      genre_ids: [35],
      overview: "Three buddies wake up from a bachelor party in Las Vegas with no memory of the previous night and the bachelor missing. They make their way around the city in order to find their friend before his wedding."
    }
  ]
};

const FALLBACK_BOOKS = {
  items: [
    {
      id: "book101",
      volumeInfo: {
        title: "To Kill a Mockingbird",
        authors: ["Harper Lee"],
        categories: ["Fiction", "History"],
        imageLinks: {
          thumbnail: "https://books.google.com/books/content?id=AY4vDwAAQBAJ&printsec=frontcover&img=1&zoom=1"
        },
        description: "The unforgettable novel of a childhood in a sleepy Southern town and the crisis of conscience that rocked it, To Kill a Mockingbird became both an instant bestseller and a critical success."
      }
    },
    {
      id: "book102",
      volumeInfo: {
        title: "1984",
        authors: ["George Orwell"],
        categories: ["Fiction", "Science"],
        imageLinks: {
          thumbnail: "https://books.google.com/books/content?id=kldYDwAAQBAJ&printsec=frontcover&img=1&zoom=1"
        },
        description: "Written more than seventy years ago, 1984 was George Orwell’s chilling prophecy about the future. And while 1984 has come and gone, his dystopian vision of a government that will do anything to control the narrative is timelier than ever."
      }
    },
    {
      id: "book103",
      volumeInfo: {
        title: "A Brief History of Time",
        authors: ["Stephen Hawking"],
        categories: ["Science", "Technology"],
        imageLinks: {
          thumbnail: "https://books.google.com/books/content?id=lVn5DwAAQBAJ&printsec=frontcover&img=1&zoom=1"
        },
        description: "Stephen Hawking's landmark work explores the most profound questions of cosmology: How did the universe begin? What is time? Will it ever end? Beautifully clear, it opens the universe to everyone."
      }
    },
    {
      id: "book104",
      volumeInfo: {
        title: "The Hobbit",
        authors: ["J.R.R. Tolkien"],
        categories: ["Fiction", "Fantasy"],
        imageLinks: {
          thumbnail: "https://books.google.com/books/content?id=hF1YDwAAQBAJ&printsec=frontcover&img=1&zoom=1"
        },
        description: "A glorious illustrated edition of J.R.R. Tolkien's masterpiece, introducing the glorious world of Middle-earth and its memorable characters, including Bilbo Baggins."
      }
    },
    {
      id: "book105",
      volumeInfo: {
        title: "Steve Jobs",
        authors: ["Walter Isaacson"],
        categories: ["Biography", "Technology"],
        imageLinks: {
          thumbnail: "https://books.google.com/books/content?id=ay5vDwAAQBAJ&printsec=frontcover&img=1&zoom=1"
        },
        description: "Based on more than forty interviews with Steve Jobs conducted over two years—as well as interviews with more than a hundred family members, friends, adversaries, competitors, and colleagues."
      }
    },
    {
      id: "book106",
      volumeInfo: {
        title: "The Waste Land",
        authors: ["T.S. Eliot"],
        categories: ["Poetry", "History"],
        imageLinks: {
          thumbnail: "https://books.google.com/books/content?id=bK1YDwAAQBAJ&printsec=frontcover&img=1&zoom=1"
        },
        description: "T.S. Eliot's modernist masterpiece, 'The Waste Land', exploring post-war disillusionment, mythology, and cultural decay through stunning, evocative, and fragmented poetry."
      }
    },
    {
      id: "book107",
      volumeInfo: {
        title: "The Hound of the Baskervilles",
        authors: ["Arthur Conan Doyle"],
        categories: ["Mystery", "Fiction"],
        imageLinks: {
          thumbnail: "https://books.google.com/books/content?id=cf1YDwAAQBAJ&printsec=frontcover&img=1&zoom=1"
        },
        description: "Sherlock Holmes and Dr. Watson investigate the legend of a supernatural hound on the desolate moors of Devonshire, solving one of the most chilling mysteries of detective history."
      }
    }
  ]
};

// HELPER FOR MOCK MOVIE FILTERS
function getFallbackMovies(query, genre, page) {
  let filtered = [...FALLBACK_MOVIES.results];
  
  if (genre && genre !== "popular") {
    const genreId = parseInt(genre);
    filtered = filtered.filter(m => m.genre_ids && m.genre_ids.includes(genreId));
  }
  
  if (query) {
    const term = query.toLowerCase();
    filtered = filtered.filter(m => 
      m.title.toLowerCase().includes(term) || 
      m.overview.toLowerCase().includes(term)
    );
  }
  
  // Basic pagination
  const perPage = 4;
  const start = (page - 1) * perPage;
  const paginated = filtered.slice(start, start + perPage);
  
  return {
    results: paginated,
    page: page,
    total_pages: Math.ceil(filtered.length / perPage),
    total_results: filtered.length
  };
}

// HELPER FOR MOCK BOOK FILTERS
function getFallbackBooks(query, page) {
  let filtered = [...FALLBACK_BOOKS.items];
  
  if (query) {
    const term = query.toLowerCase();
    // Check for subject format e.g. "subject:science"
    if (term.startsWith("subject:")) {
      const subject = term.replace("subject:", "").trim();
      filtered = filtered.filter(b => 
        b.volumeInfo.categories && 
        b.volumeInfo.categories.some(c => c.toLowerCase().includes(subject))
      );
    } else {
      filtered = filtered.filter(b => 
        b.volumeInfo.title.toLowerCase().includes(term) || 
        (b.volumeInfo.authors && b.volumeInfo.authors.some(a => a.toLowerCase().includes(term))) ||
        (b.volumeInfo.description && b.volumeInfo.description.toLowerCase().includes(term))
      );
    }
  }
  
  const perPage = 4;
  const start = (page - 1) * perPage;
  const paginated = filtered.slice(start, start + perPage);
  
  return {
    items: paginated,
    totalItems: filtered.length
  };
}

// ENDPOINTS
app.get('/api/movies/popular', async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const genre = req.query.genre;
    try {
        let url = `${TMDB_BASE_URL}/discover/movie?sort_by=popularity.desc&page=${page}&api_key=${TMDB_API_KEY}`;
        if (genre) {
            url += `&with_genres=${genre}`;
        }
        console.log("Requesting TMDB discover:", url);
        const response = await axios.get(url);
        res.json(response.data);
    } catch (error) {
        console.warn("TMDB error, returning mock movie fallbacks:", error.message);
        res.json(getFallbackMovies("", genre, page));
    }
});

app.get('/api/movies/search', async (req, res) => {
    const query = req.query.q;
    const page = parseInt(req.query.page) || 1;
    if (!query) {
        return res.status(400).json({ error: 'Search query parameter (q) is required.' });
    }
    try {
        const url = `${TMDB_BASE_URL}/search/movie?query=${encodeURIComponent(query)}&page=${page}&api_key=${TMDB_API_KEY}`;
        console.log("Searching TMDB:", url);
        const response = await axios.get(url);
        res.json(response.data);
    } catch (error) {
        console.warn("TMDB search error, returning mock movie fallbacks:", error.message);
        res.json(getFallbackMovies(query, "", page));
    }
});

app.get('/api/books/initial', async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const maxResults = 20;
  const startIndex = (page - 1) * maxResults;
  try {
    let url = `${GOOGLE_BOOKS_API_BASE}?q=fiction&startIndex=${startIndex}&maxResults=${maxResults}`;
    if (GOOGLE_API_KEY && GOOGLE_API_KEY !== 'undefined') {
      url += `&key=${GOOGLE_API_KEY}`;
    }
    console.log("Requesting Google Books initial:", url); 
    const response = await axios.get(url);
    res.json(response.data);
  } catch (error) {
    console.warn("Google Books error, returning mock book fallbacks:", error.message);
    res.json(getFallbackBooks("fiction", page));
  }
});

app.get('/api/books/search', async (req, res) => {
  const query = req.query.q;
  const page = parseInt(req.query.page) || 1;
  console.log("Search Query Received:", query, "Page:", page);
  
  if (!query) {
    return res.status(400).json({ error: 'Search query (q) is required' });
  }

  try {
    const maxResults = 20;
    const startIndex = (page - 1) * maxResults;
    let url = `${GOOGLE_BOOKS_API_BASE}?q=${encodeURIComponent(query)}&startIndex=${startIndex}&maxResults=${maxResults}`;
    if (GOOGLE_API_KEY && GOOGLE_API_KEY !== 'undefined') {
      url += `&key=${GOOGLE_API_KEY}`;
    }
    console.log("Google Books API URL:", url); 
    
    const response = await axios.get(url);
    res.json(response.data);
  } catch (error) {
    console.warn("Google Books API error, returning mock book fallbacks:", error.message);
    res.json(getFallbackBooks(query, page));
  }
});

app.post('/api/murf/generate-audio', async (req, res) => {
    const { text, voice_id, rate, pitch, style } = req.body;

    if (!text || !voice_id) {
        return res.status(400).json({ error: 'Missing text or voice_id in request body.' });
    }

    try {
        console.log(`Generating audio with Murf for text size: ${text.length}`);
        const murfResponse = await axios.post(MURF_API_ENDPOINT, {
            text,
            voice_id,
            rate,
            pitch,
            style,
        }, {
            headers: {
                'api-key': MURF_API_KEY,
                'Content-Type': 'application/json'
            }
        });
        res.json(murfResponse.data);
    } catch (error) {
        console.error("Error generating Murf AI audio:", error.message);
        // Fallback to simple speech synthesis url or standard error response
        res.status(error.response?.status || 500).json({ error: 'Failed to generate audio', details: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});