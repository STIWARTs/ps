import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { boardApi } from '../services/api';
import CreateBoardModal from '../components/CreateBoardModal';
import RootwiseLogo from '../assets/rootwise-logo.svg';

function TeacherDashboard() {
    const navigate = useNavigate();
    const [boards, setBoards] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    
    // For demo purposes, using a static teacher ID
    const teacherId = 'teacher_001';
    const teacherName = 'Demo Teacher';

    useEffect(() => {
        loadBoards();
    }, []);

    const loadBoards = async () => {
        try {
            setLoading(true);
            const response = await boardApi.getAll(teacherId);
            setBoards(response.data);
        } catch (err) {
            console.error('Failed to load boards:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateBoard = async (boardData) => {
        try {
            const response = await boardApi.create({
                ...boardData,
                teacherId,
                teacherName
            });
            setBoards([response.data, ...boards]);
            setShowCreateModal(false);
        } catch (err) {
            console.error('Failed to create board:', err);
            alert('Failed to create board. Please try again.');
        }
    };

    const handleDeleteBoard = async (boardId, e) => {
        e.stopPropagation();
        if (!confirm('Are you sure you want to delete this board?')) {
            return;
        }
        try {
            await boardApi.delete(boardId);
            setBoards(boards.filter(b => b._id !== boardId));
        } catch (err) {
            console.error('Failed to delete board:', err);
            alert('Failed to delete board. Please try again.');
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="container">
            <header className="header">
                <div className="logo-title">
                    <img src={RootwiseLogo} alt="Rootwise" className="logo" />
                    <h1>Rootwise</h1>
                </div>
                <button 
                    className="btn btn-primary"
                    onClick={() => setShowCreateModal(true)}
                >
                    Create New Board
                </button>
            </header>

            {loading ? (
                <div className="loading">
                    <div className="spinner"></div>
                </div>
            ) : boards.length === 0 ? (
                <div className="empty-state">
                    <h3>No boards yet</h3>
                    <p>Create your first smart board to start teaching</p>
                    <button 
                        className="btn btn-primary"
                        onClick={() => setShowCreateModal(true)}
                    >
                        Create Board
                    </button>
                </div>
            ) : (
                <div className="boards-grid">
                    {boards.map(board => (
                        <div 
                            key={board._id} 
                            className="board-card"
                            onClick={() => navigate(`/board/${board._id}`)}
                        >
                            <h3>{board.title}</h3>
                            <p>{board.className} - {board.subject || 'General'}</p>
                            <p>{board.pages?.length || 1} page(s)</p>
                            <div className="meta">
                                <span>Updated: {formatDate(board.updatedAt)}</span>
                                <button 
                                    className="btn btn-danger"
                                    onClick={(e) => handleDeleteBoard(board._id, e)}
                                    style={{ padding: '5px 10px', fontSize: '12px' }}
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {showCreateModal && (
                <CreateBoardModal
                    onClose={() => setShowCreateModal(false)}
                    onCreate={handleCreateBoard}
                />
            )}
        </div>
    );
}

export default TeacherDashboard;
