import { useState } from 'react';

function CreateBoardModal({ onClose, onCreate }) {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        className: '',
        subject: ''
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.title || !formData.className) {
            alert('Please fill in required fields');
            return;
        }
        onCreate(formData);
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()}>
                <h2>Create New Board</h2>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Title *</label>
                        <input
                            type="text"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            placeholder="e.g., Introduction to Algebra"
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Class Name *</label>
                        <input
                            type="text"
                            name="className"
                            value={formData.className}
                            onChange={handleChange}
                            placeholder="e.g., Class 10-A"
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Subject</label>
                        <input
                            type="text"
                            name="subject"
                            value={formData.subject}
                            onChange={handleChange}
                            placeholder="e.g., Mathematics"
                        />
                    </div>
                    <div className="form-group">
                        <label>Description</label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            placeholder="Brief description of the lesson..."
                            rows="3"
                        />
                    </div>
                    <div className="modal-actions">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary">
                            Create Board
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default CreateBoardModal;
