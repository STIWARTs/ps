const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Generate text content based on topic
router.post('/generate-text', async (req, res) => {
    try {
        const { topic, context, type } = req.body;
        
        if (!topic) {
            return res.status(400).json({ error: 'Topic is required' });
        }

        let prompt = '';
        
        switch (type) {
            case 'explanation':
                prompt = `You are an educational assistant. Explain the following topic in a clear and educational manner suitable for students: ${topic}. ${context ? `Additional context: ${context}` : ''}`;
                break;
            case 'summary':
                prompt = `You are an educational assistant. Provide a concise summary of the following topic: ${topic}. ${context ? `Additional context: ${context}` : ''}`;
                break;
            case 'keypoints':
                prompt = `You are an educational assistant. List the key points about the following topic in bullet points: ${topic}. ${context ? `Additional context: ${context}` : ''}`;
                break;
            case 'quiz':
                prompt = `You are an educational assistant. Generate 5 quiz questions with answers about the following topic: ${topic}. ${context ? `Additional context: ${context}` : ''}`;
                break;
            default:
                prompt = `You are an educational assistant helping teachers create content. Provide educational content about: ${topic}. ${context ? `Additional context: ${context}` : ''}`;
        }

        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const generatedText = response.text();

        res.json({ text: generatedText });
    } catch (err) {
        console.error('AI text generation error:', err.message);
        res.status(500).json({ 
            error: 'Failed to generate text content',
            details: err.message 
        });
    }
});

// Generate image suggestions based on topic
router.post('/generate-image', async (req, res) => {
    try {
        const { topic, style } = req.body;
        
        if (!topic) {
            return res.status(400).json({ error: 'Topic is required' });
        }

        const imageStyle = style || 'educational illustration';
        const prompt = `Create an ${imageStyle} about: ${topic}. Make it suitable for educational purposes and classroom use.`;

        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
        const result = await model.generateContent(
            `Based on the topic "${topic}", suggest 3 relevant image search terms that a teacher could use to find educational images. Return only the search terms, one per line.`
        );
        const response = await result.response;
        const searchTerms = response.text();

        res.json({ 
            message: 'Image search terms generated',
            prompt: prompt,
            searchTerms: searchTerms.split('\n').filter(term => term.trim())
        });
    } catch (err) {
        console.error('AI image generation error:', err);
        res.status(500).json({ error: 'Failed to generate image suggestions' });
    }
});

// Chat with AI for interactive help
router.post('/chat', async (req, res) => {
    try {
        const { message, conversationHistory } = req.body;
        
        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
        
        let fullPrompt = 'You are a helpful teaching assistant. Help the teacher with any questions about their lesson content, provide suggestions for explanations, and assist with educational content creation.\n\n';
        
        if (conversationHistory && Array.isArray(conversationHistory)) {
            conversationHistory.forEach(msg => {
                fullPrompt += `${msg.role === 'user' ? 'Teacher' : 'Assistant'}: ${msg.content}\n`;
            });
        }
        
        fullPrompt += `Teacher: ${message}\nAssistant:`;

        const result = await model.generateContent(fullPrompt);
        const response = await result.response;
        const reply = response.text();

        res.json({ reply });
    } catch (err) {
        console.error('AI chat error:', err);
        res.status(500).json({ error: 'Failed to get AI response' });
    }
});

// Search for educational content using Gemini
router.post('/search-content', async (req, res) => {
    try {
        const { query, contentType } = req.body;
        
        if (!query) {
            return res.status(400).json({ error: 'Query is required' });
        }

        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
        
        let prompt = '';
        switch (contentType) {
            case 'articles':
                prompt = `Provide a comprehensive educational article about "${query}" suitable for teaching. Include key concepts, examples, and important facts.`;
                break;
            case 'facts':
                prompt = `List 10 interesting and educational facts about "${query}" that a teacher could use in their lesson.`;
                break;
            case 'definitions':
                prompt = `Provide clear definitions and explanations of key terms related to "${query}" for educational purposes.`;
                break;
            default:
                prompt = `Provide helpful educational content about "${query}" that a teacher could use in their smart board presentation.`;
        }

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const content = response.text();

        res.json({ content });
    } catch (err) {
        console.error('AI search error:', err);
        res.status(500).json({ error: 'Failed to search for content' });
    }
});

module.exports = router;
