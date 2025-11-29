const mongoose = require('mongoose');

const attachmentSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['pdf', 'voice'],
        required: true
    },
    filename: {
        type: String,
        required: true
    },
    originalName: {
        type: String,
        required: true
    },
    path: {
        type: String,
        required: true
    },
    size: {
        type: Number
    },
    uploadedAt: {
        type: Date,
        default: Date.now
    }
});

const pageSchema = new mongoose.Schema({
    pageNumber: {
        type: Number,
        required: true
    },
    svgContent: {
        type: String,
        default: ''
    },
    tlDrawData: {
        type: Object,
        default: {}
    },
    attachments: [attachmentSchema],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

const boardSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    teacherId: {
        type: String,
        required: true
    },
    teacherName: {
        type: String,
        required: true
    },
    className: {
        type: String,
        required: true
    },
    subject: {
        type: String
    },
    pages: [pageSchema],
    currentPage: {
        type: Number,
        default: 1
    },
    isPublished: {
        type: Boolean,
        default: false
    },
    sharedWithStudents: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update the updatedAt field before saving
boardSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('Board', boardSchema);
