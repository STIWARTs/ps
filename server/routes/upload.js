const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Board = require('../models/Board');

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        let subDir = 'others';
        if (file.mimetype === 'application/pdf') {
            subDir = 'pdfs';
        } else if (file.mimetype.startsWith('audio/')) {
            subDir = 'audio';
        }
        
        const destPath = path.join(uploadsDir, subDir);
        if (!fs.existsSync(destPath)) {
            fs.mkdirSync(destPath, { recursive: true });
        }
        cb(null, destPath);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

// File filter
const fileFilter = (req, file, cb) => {
    const allowedTypes = [
        'application/pdf',
        'audio/mpeg',
        'audio/wav',
        'audio/webm',
        'audio/ogg',
        'audio/mp3'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only PDF and audio files are allowed.'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 50 * 1024 * 1024 // 50MB limit
    }
});

// Upload PDF file
router.post('/pdf', upload.single('pdf'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No PDF file uploaded' });
        }

        const { boardId, pageNumber } = req.body;

        const fileData = {
            type: 'pdf',
            filename: req.file.filename,
            originalName: req.file.originalname,
            path: req.file.path,
            size: req.file.size
        };

        if (boardId && pageNumber) {
            const board = await Board.findById(boardId);
            if (board) {
                const pageIndex = board.pages.findIndex(
                    p => p.pageNumber === parseInt(pageNumber)
                );
                if (pageIndex !== -1) {
                    board.pages[pageIndex].attachments.push(fileData);
                    await board.save();
                }
            }
        }

        res.json({
            message: 'PDF uploaded successfully',
            file: fileData
        });
    } catch (err) {
        console.error('PDF upload error:', err);
        res.status(500).json({ error: 'Failed to upload PDF' });
    }
});

// Upload voice/audio file
router.post('/voice', upload.single('audio'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No audio file uploaded' });
        }

        const { boardId, pageNumber } = req.body;

        const fileData = {
            type: 'voice',
            filename: req.file.filename,
            originalName: req.file.originalname,
            path: req.file.path,
            size: req.file.size
        };

        if (boardId && pageNumber) {
            const board = await Board.findById(boardId);
            if (board) {
                const pageIndex = board.pages.findIndex(
                    p => p.pageNumber === parseInt(pageNumber)
                );
                if (pageIndex !== -1) {
                    board.pages[pageIndex].attachments.push(fileData);
                    await board.save();
                }
            }
        }

        res.json({
            message: 'Audio uploaded successfully',
            file: fileData
        });
    } catch (err) {
        console.error('Audio upload error:', err);
        res.status(500).json({ error: 'Failed to upload audio' });
    }
});

// Get file by filename
router.get('/file/:type/:filename', (req, res) => {
    try {
        const { type, filename } = req.params;
        const filePath = path.join(uploadsDir, type === 'pdf' ? 'pdfs' : 'audio', filename);
        
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: 'File not found' });
        }

        res.sendFile(filePath);
    } catch (err) {
        console.error('File retrieval error:', err);
        res.status(500).json({ error: 'Failed to retrieve file' });
    }
});

// Delete file
router.delete('/file/:type/:filename', async (req, res) => {
    try {
        const { type, filename } = req.params;
        const { boardId, pageNumber } = req.body;
        
        const filePath = path.join(uploadsDir, type === 'pdf' ? 'pdfs' : 'audio', filename);
        
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        if (boardId && pageNumber) {
            const board = await Board.findById(boardId);
            if (board) {
                const pageIndex = board.pages.findIndex(
                    p => p.pageNumber === parseInt(pageNumber)
                );
                if (pageIndex !== -1) {
                    board.pages[pageIndex].attachments = board.pages[pageIndex].attachments.filter(
                        a => a.filename !== filename
                    );
                    await board.save();
                }
            }
        }

        res.json({ message: 'File deleted successfully' });
    } catch (err) {
        console.error('File deletion error:', err);
        res.status(500).json({ error: 'Failed to delete file' });
    }
});

module.exports = router;
