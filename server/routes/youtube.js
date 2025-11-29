const express = require('express');
const router = express.Router();

// YouTube Data API v3 base URL
const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';

// Search YouTube videos
router.get('/search', async (req, res) => {
    try {
        const { query, maxResults } = req.query;
        
        if (!query) {
            return res.status(400).json({ error: 'Search query is required' });
        }

        const apiKey = process.env.YOUTUBE_API_KEY;
        
        if (!apiKey) {
            return res.status(500).json({ error: 'YouTube API key not configured' });
        }

        const searchUrl = `${YOUTUBE_API_BASE}/search?part=snippet&type=video&q=${encodeURIComponent(query)}&maxResults=${maxResults || 10}&key=${apiKey}`;
        
        const response = await fetch(searchUrl);
        const data = await response.json();

        if (data.error) {
            return res.status(400).json({ error: data.error.message });
        }

        const videos = data.items.map(item => ({
            videoId: item.id.videoId,
            title: item.snippet.title,
            description: item.snippet.description,
            thumbnail: item.snippet.thumbnails.medium.url,
            channelTitle: item.snippet.channelTitle,
            publishedAt: item.snippet.publishedAt,
            embedUrl: `https://www.youtube.com/embed/${item.id.videoId}`
        }));

        res.json({ videos });
    } catch (err) {
        console.error('YouTube search error:', err);
        res.status(500).json({ error: 'Failed to search YouTube videos' });
    }
});

// Get video details
router.get('/video/:videoId', async (req, res) => {
    try {
        const { videoId } = req.params;
        const apiKey = process.env.YOUTUBE_API_KEY;
        
        if (!apiKey) {
            return res.status(500).json({ error: 'YouTube API key not configured' });
        }

        const videoUrl = `${YOUTUBE_API_BASE}/videos?part=snippet,contentDetails,statistics&id=${videoId}&key=${apiKey}`;
        
        const response = await fetch(videoUrl);
        const data = await response.json();

        if (data.error) {
            return res.status(400).json({ error: data.error.message });
        }

        if (!data.items || data.items.length === 0) {
            return res.status(404).json({ error: 'Video not found' });
        }

        const video = data.items[0];
        res.json({
            videoId: video.id,
            title: video.snippet.title,
            description: video.snippet.description,
            thumbnail: video.snippet.thumbnails.high.url,
            channelTitle: video.snippet.channelTitle,
            publishedAt: video.snippet.publishedAt,
            duration: video.contentDetails.duration,
            viewCount: video.statistics.viewCount,
            likeCount: video.statistics.likeCount,
            embedUrl: `https://www.youtube.com/embed/${video.id}`
        });
    } catch (err) {
        console.error('YouTube video details error:', err);
        res.status(500).json({ error: 'Failed to get video details' });
    }
});

// Search educational channels
router.get('/channels', async (req, res) => {
    try {
        const { query } = req.query;
        const apiKey = process.env.YOUTUBE_API_KEY;
        
        if (!apiKey) {
            return res.status(500).json({ error: 'YouTube API key not configured' });
        }

        const searchUrl = `${YOUTUBE_API_BASE}/search?part=snippet&type=channel&q=${encodeURIComponent(query + ' education')}&maxResults=5&key=${apiKey}`;
        
        const response = await fetch(searchUrl);
        const data = await response.json();

        if (data.error) {
            return res.status(400).json({ error: data.error.message });
        }

        const channels = data.items.map(item => ({
            channelId: item.id.channelId,
            title: item.snippet.title,
            description: item.snippet.description,
            thumbnail: item.snippet.thumbnails.medium.url
        }));

        res.json({ channels });
    } catch (err) {
        console.error('YouTube channel search error:', err);
        res.status(500).json({ error: 'Failed to search YouTube channels' });
    }
});

module.exports = router;
