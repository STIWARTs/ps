import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Tldraw, exportToSvg } from '@tldraw/tldraw';
import '@tldraw/tldraw/tldraw.css';
import { boardApi } from '../services/api';
import SidePanel from '../components/SidePanel';

function Whiteboard() {
    const { boardId } = useParams();
    const navigate = useNavigate();
    const editorRef = useRef(null);
    
    const [board, setBoard] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [sidePanelOpen, setSidePanelOpen] = useState(false);
    const [sidePanelTab, setSidePanelTab] = useState('ai');

    useEffect(() => {
        loadBoard();
    }, [boardId]);

    const loadBoard = async () => {
        try {
            setLoading(true);
            const response = await boardApi.getOne(boardId);
            setBoard(response.data);
            setCurrentPage(response.data.currentPage || 1);
        } catch (err) {
            console.error('Failed to load board:', err);
            alert('Failed to load board');
            navigate('/');
        } finally {
            setLoading(false);
        }
    };

    const handleMount = useCallback((editor) => {
        editorRef.current = editor;
        
        // Load saved tldraw data if exists
        if (board && board.pages) {
            const pageData = board.pages.find(p => p.pageNumber === currentPage);
            if (pageData && pageData.tlDrawData && Object.keys(pageData.tlDrawData).length > 0) {
                try {
                    // Restore the snapshot
                    editor.store.loadSnapshot(pageData.tlDrawData);
                } catch (err) {
                    console.error('Failed to load page data:', err);
                }
            }
        }
    }, [board, currentPage]);

    const savePage = async () => {
        if (!editorRef.current) return;
        
        try {
            setSaving(true);
            const editor = editorRef.current;
            
            // Get the current snapshot
            const snapshot = editor.store.getSnapshot();
            
            // Export to SVG
            const shapeIds = editor.getCurrentPageShapeIds();
            let svgContent = '';
            
            if (shapeIds.size > 0) {
                const svg = await exportToSvg(editor, {
                    ids: Array.from(shapeIds),
                    padding: 20
                });
                svgContent = svg.outerHTML;
            }
            
            await boardApi.savePage(boardId, currentPage, {
                svgContent,
                tlDrawData: snapshot
            });
            
        } catch (err) {
            console.error('Failed to save page:', err);
            alert('Failed to save. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const addNewPage = async () => {
        await savePage();
        try {
            const response = await boardApi.addPage(boardId);
            setBoard(response.data);
            setCurrentPage(response.data.pages.length);
            
            // Clear the editor for new page
            if (editorRef.current) {
                editorRef.current.selectAll();
                editorRef.current.deleteShapes(editorRef.current.getSelectedShapeIds());
            }
        } catch (err) {
            console.error('Failed to add page:', err);
        }
    };

    const goToPage = async (pageNum) => {
        if (pageNum === currentPage) return;
        await savePage();
        setCurrentPage(pageNum);
        
        // Load the page data
        if (board && board.pages && editorRef.current) {
            const pageData = board.pages.find(p => p.pageNumber === pageNum);
            if (pageData && pageData.tlDrawData && Object.keys(pageData.tlDrawData).length > 0) {
                try {
                    editorRef.current.store.loadSnapshot(pageData.tlDrawData);
                } catch (err) {
                    console.error('Failed to load page:', err);
                }
            } else {
                // Clear for empty page
                editorRef.current.selectAll();
                editorRef.current.deleteShapes(editorRef.current.getSelectedShapeIds());
            }
        }
    };

    const shareWithStudents = async () => {
        await savePage();
        try {
            await boardApi.share(boardId);
            alert('Board shared with students successfully!');
        } catch (err) {
            console.error('Failed to share:', err);
            alert('Failed to share board');
        }
    };

    const handleBack = async () => {
        await savePage();
        navigate('/');
    };

    const openPanel = (tab) => {
        setSidePanelTab(tab);
        setSidePanelOpen(true);
    };

    if (loading) {
        return (
            <div className="whiteboard-container">
                <div className="loading" style={{ height: '100vh' }}>
                    <div className="spinner"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="whiteboard-container">
            <div className="whiteboard-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <button className="btn btn-secondary" onClick={handleBack}>
                        Back
                    </button>
                    <h2>{board?.title}</h2>
                </div>
                
                <div className="whiteboard-actions">
                    <div className="page-indicator">
                        Page {currentPage} of {board?.pages?.length || 1}
                    </div>
                    
                    {currentPage > 1 && (
                        <button 
                            className="btn btn-secondary"
                            onClick={() => goToPage(currentPage - 1)}
                        >
                            Prev
                        </button>
                    )}
                    
                    {currentPage < (board?.pages?.length || 1) && (
                        <button 
                            className="btn btn-secondary"
                            onClick={() => goToPage(currentPage + 1)}
                        >
                            Next
                        </button>
                    )}
                    
                    <button className="btn btn-secondary" onClick={addNewPage}>
                        Add Page
                    </button>
                    
                    <button 
                        className="btn btn-secondary"
                        onClick={() => openPanel('ai')}
                    >
                        AI Tools
                    </button>
                    
                    <button 
                        className="btn btn-secondary"
                        onClick={() => openPanel('youtube')}
                    >
                        YouTube
                    </button>
                    
                    <button 
                        className="btn btn-secondary"
                        onClick={() => openPanel('attachments')}
                    >
                        Attachments
                    </button>
                    
                    <button 
                        className="btn btn-primary"
                        onClick={savePage}
                        disabled={saving}
                    >
                        {saving ? 'Saving...' : 'Save'}
                    </button>
                    
                    <button className="btn btn-primary" onClick={shareWithStudents}>
                        Share with Students
                    </button>
                </div>
            </div>
            
            <div className="tldraw-container">
                <Tldraw
                    onMount={handleMount}
                    autoFocus
                />
            </div>
            
            <SidePanel
                isOpen={sidePanelOpen}
                onClose={() => setSidePanelOpen(false)}
                activeTab={sidePanelTab}
                onTabChange={setSidePanelTab}
                boardId={boardId}
                currentPage={currentPage}
                onRefresh={loadBoard}
            />
        </div>
    );
}

export default Whiteboard;
