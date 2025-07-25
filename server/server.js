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

app.get('/api/movies/popular', async (req, res) => {
    try {
        const response = await axios.get(`${TMDB_BASE_URL}/discover/movie?sort_by=popularity.desc&page=1&api_key=${TMDB_API_KEY}`);
        res.json(response.data);
    } catch (error) {
        console.error("Error fetching popular movies from TMDB:", error.message);
        res.status(error.response?.status || 500).json({ error: 'Failed to fetch popular movies', details: error.message });
    }
});

app.get('/api/movies/search', async (req, res) => {
    const query = req.query.q;
    if (!query) {
        return res.status(400).json({ error: 'Search query parameter (q) is required.' });
    }
    try {
        const response = await axios.get(`${TMDB_BASE_URL}/search/movie?query=${encodeURIComponent(query)}&api_key=${TMDB_API_KEY}`);
        res.json(response.data);
    } catch (error) {
        console.error("Error searching movies from TMDB:", error.message);
        res.status(error.response?.status || 500).json({ error: 'Failed to search movies', details: error.message });
    }
});



app.get('/api/books/initial', async (req, res) => {
  try {
    const url = `${GOOGLE_BOOKS_API_BASE}?q=fiction&maxResults=25&key=${GOOGLE_API_KEY}`;
    console.log("Requesting:", url); 
    const response = await axios.get(url);
    res.json(response.data);
  } catch (error) {
    console.error("Google Books Error:", error.message);
    res.status(500).json({ error: "Failed to fetch books" });
  }
});

app.get('/api/books/search', async (req, res) => {
  const query = req.query.q;
  console.log("Search Query Received:", query);
  
  if (!query) {
    return res.status(400).json({ error: 'Search query (q) is required' });
  }

  try {
    const url = `${GOOGLE_BOOKS_API_BASE}?q=${encodeURIComponent(query)}&maxResults=30&key=${GOOGLE_API_KEY}`;
    console.log("Google Books API URL:", url); 
    
    const response = await axios.get(url);
    res.json(response.data);
  } catch (error) {
    console.error("Google Books API Error:", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to search books" });
  }
});

app.post('/api/murf/generate-audio', async (req, res) => {
    const { text, voice_id, rate, pitch, style } = req.body;

    if (!text || !voice_id) {
        return res.status(400).json({ error: 'Missing text or voice_id in request body.' });
    }

    try {
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
        res.status(error.response?.status || 500).json({ error: 'Failed to generate audio', details: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});