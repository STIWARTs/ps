import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Tldraw } from 'tldraw';
import 'tldraw/tldraw.css';
import { boardApi } from '../services/api';

function ViewBoard() {
    const { boardId } = useParams();
    const [board, setBoard] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const loadBoard = async () => {
            try {
                const response = await boardApi.getOne(boardId);
                const boardData = response.data;
                
                if (!boardData.sharedWithStudents) {
                    setError('This board has not been shared yet.');
                    setLoading(false);
                    return;
                }
                
                setBoard(boardData);
                setLoading(false);
            } catch (err) {
                console.error('Failed to load board:', err);
                setError('Failed to load board. Please check the link.');
                setLoading(false);
            }
        };
        
        loadBoard();
    }, [boardId]);

    const handleMount = (editor) => {
        // Make editor read-only
        editor.updateInstanceState({ isReadonly: true });
        
        // Load all pages from the board
        if (board && board.pages) {
            board.pages.forEach((page) => {
                if (page.tlDrawData && page.tlDrawData.shapes) {
                    try {
                        const shapes = page.tlDrawData.shapes;
                        if (shapes.length > 0) {
                            editor.createShapes(shapes);
                        }
                    } catch (err) {
                        console.error('Error loading shapes for page:', page.pageNumber, err);
                    }
                }
            });
            editor.zoomToFit();
        }
    };

    if (loading) {
        return (
            <div className="view-loading">
                <h2>Loading board...</h2>
            </div>
        );
    }

    if (error) {
        return (
            <div className="view-error">
                <h2>⚠️ {error}</h2>
                <p>Please contact your teacher for the correct link.</p>
            </div>
        );
    }

    return (
        <div className="view-board">
            <div className="view-header">
                <h1>{board?.title || 'Shared Board'}</h1>
                <span className="view-badge">View Only</span>
            </div>
            <div className="view-canvas">
                <Tldraw
                    onMount={handleMount}
                    hideUi={false}
                />
            </div>
            <style>{`
                .view-board {
                    width: 100vw;
                    height: 100vh;
                    display: flex;
                    flex-direction: column;
                }
                .view-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 12px 24px;
                    background: #1a1a2e;
                    color: white;
                }
                .view-header h1 {
                    margin: 0;
                    font-size: 1.25rem;
                }
                .view-badge {
                    background: #4361ee;
                    padding: 4px 12px;
                    border-radius: 12px;
                    font-size: 0.875rem;
                }
                .view-canvas {
                    flex: 1;
                    position: relative;
                }
                .view-loading, .view-error {
                    width: 100vw;
                    height: 100vh;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    background: #1a1a2e;
                    color: white;
                }
                .view-error h2 {
                    color: #ff6b6b;
                }
            `}</style>
        </div>
    );
}

export default ViewBoard;
