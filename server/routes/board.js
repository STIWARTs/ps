const express = require('express');
const router = express.Router();
const Board = require('../models/Board');

// Get all boards for a teacher
router.get('/teacher/:teacherId', async (req, res) => {
    try {
        const boards = await Board.find({ teacherId: req.params.teacherId })
            .sort({ updatedAt: -1 });
        res.json(boards);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get a single board by ID
router.get('/:id', async (req, res) => {
    try {
        const board = await Board.findById(req.params.id);
        if (!board) {
            return res.status(404).json({ error: 'Board not found' });
        }
        res.json(board);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create a new board
router.post('/', async (req, res) => {
    try {
        const { title, description, teacherId, teacherName, className, subject } = req.body;
        
        const board = new Board({
            title,
            description,
            teacherId,
            teacherName,
            className,
            subject,
            pages: [{
                pageNumber: 1,
                svgContent: '',
                tlDrawData: {},
                attachments: []
            }]
        });
        
        const savedBoard = await board.save();
        res.status(201).json(savedBoard);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Update a board
router.put('/:id', async (req, res) => {
    try {
        const board = await Board.findByIdAndUpdate(
            req.params.id,
            { ...req.body, updatedAt: Date.now() },
            { new: true }
        );
        if (!board) {
            return res.status(404).json({ error: 'Board not found' });
        }
        res.json(board);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Delete a board
router.delete('/:id', async (req, res) => {
    try {
        const board = await Board.findByIdAndDelete(req.params.id);
        if (!board) {
            return res.status(404).json({ error: 'Board not found' });
        }
        res.json({ message: 'Board deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Save page data (SVG and tldraw data)
router.post('/:id/pages/:pageNumber', async (req, res) => {
    try {
        const { svgContent, tlDrawData } = req.body;
        const board = await Board.findById(req.params.id);
        
        if (!board) {
            return res.status(404).json({ error: 'Board not found' });
        }
        
        const pageIndex = board.pages.findIndex(
            p => p.pageNumber === parseInt(req.params.pageNumber)
        );
        
        if (pageIndex === -1) {
            // Create new page
            board.pages.push({
                pageNumber: parseInt(req.params.pageNumber),
                svgContent: svgContent || '',
                tlDrawData: tlDrawData || {},
                attachments: []
            });
        } else {
            // Update existing page
            board.pages[pageIndex].svgContent = svgContent || board.pages[pageIndex].svgContent;
            board.pages[pageIndex].tlDrawData = tlDrawData || board.pages[pageIndex].tlDrawData;
            board.pages[pageIndex].updatedAt = Date.now();
        }
        
        board.currentPage = parseInt(req.params.pageNumber);
        const savedBoard = await board.save();
        res.json(savedBoard);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Add a new page to board
router.post('/:id/pages', async (req, res) => {
    try {
        const board = await Board.findById(req.params.id);
        
        if (!board) {
            return res.status(404).json({ error: 'Board not found' });
        }
        
        const newPageNumber = board.pages.length + 1;
        board.pages.push({
            pageNumber: newPageNumber,
            svgContent: '',
            tlDrawData: {},
            attachments: []
        });
        
        board.currentPage = newPageNumber;
        const savedBoard = await board.save();
        res.json(savedBoard);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Share board with students
router.post('/:id/share', async (req, res) => {
    try {
        const board = await Board.findByIdAndUpdate(
            req.params.id,
            { sharedWithStudents: true, updatedAt: Date.now() },
            { new: true }
        );
        if (!board) {
            return res.status(404).json({ error: 'Board not found' });
        }
        res.json({ message: 'Board shared with students', board });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
