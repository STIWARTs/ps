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
        const baseInstruction = `You are an educational content writer creating material for teachers to read and explain to students. Use clear, formal, and bookish language. Keep content concise but comprehensive. Structure the content well so teachers can easily read it aloud. Avoid overly complex terms but maintain academic quality. ${context ? `Context: ${context}` : ''}`;
        
        switch (type) {
            case 'explanation':
                prompt = `${baseInstruction}\n\nProvide a clear, well-structured explanation of "${topic}" that a teacher can read to students. Use proper academic language, include definitions, and provide 1-2 simple examples. Keep it to 8-10 sentences maximum.`;
                break;
            case 'summary':
                prompt = `${baseInstruction}\n\nWrite a concise academic summary of "${topic}" in 3-4 sentences. Make it suitable for a teacher to read as an introduction or recap.`;
                break;
            case 'keypoints':
                prompt = `List ONLY 5 key points about "${topic}". No introductions, no extra text. Just bullet points. Each point must be ONE short line (max 10-12 words). Start directly with the first bullet point.`;
                break;
            case 'quiz':
                prompt = `Generate ONLY 4 quiz questions about "${topic}". No explanations, no introductions, no extra text. Just questions and answers in this exact format:\n\nQ1: [question]\nA1: [answer]\n\nQ2: [question]\nA2: [answer]\n\nQ3: [question]\nA3: [answer]\n\nQ4: [question]\nA4: [answer]\n\nKeep questions easy to medium. Keep each question and answer to one short line.`;
                break;
            default:
                prompt = `${baseInstruction}\n\nProvide educational content about "${topic}" in a format suitable for classroom teaching.`;
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
