import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Tldraw, DefaultColorThemePalette } from '@tldraw/tldraw';
import '@tldraw/tldraw/tldraw.css';
import { boardApi } from '../services/api';
import SidePanel from '../components/SidePanel';
import RootwiseLogo from '../assets/rootwise-logo.svg';

function Whiteboard() {
    const { boardId } = useParams();
    const navigate = useNavigate();
    const editorRef = useRef(null);
    
    const [board, setBoard] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState('');
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
        
        // Load saved pages from database
        if (board && board.pages && board.pages.length > 0) {
            console.log('Loading', board.pages.length, 'saved pages');
            
            // Get current tldraw pages
            const existingPages = editor.getPages();
            const firstPageId = existingPages[0]?.id;
            
            board.pages.forEach((pageData, index) => {
                const pageNumber = pageData.pageNumber || (index + 1);
                
                if (pageData.tlDrawData && pageData.tlDrawData.shapes && pageData.tlDrawData.shapes.length > 0) {
                    let targetPageId;
                    
                    if (pageNumber === 1 && firstPageId) {
                        // Use the first existing page for page 1
                        targetPageId = firstPageId;
                    } else {
                        // Create a new page for subsequent pages
                        const newPageId = `page:page${pageNumber}`;
                        const existingPage = editor.getPage(newPageId);
                        
                        if (!existingPage) {
                            editor.createPage({ 
                                id: newPageId, 
                                name: pageData.tlDrawData.pageName || `Page ${pageNumber}` 
                            });
                        }
                        targetPageId = newPageId;
                    }
                    
                    // Load shapes for this page
                    const shapes = pageData.tlDrawData.shapes.map(shape => ({
                        ...shape,
                        parentId: targetPageId
                    }));
                    
                    try {
                        editor.createShapes(shapes);
                        console.log('Loaded', shapes.length, 'shapes for page', pageNumber);
                    } catch (err) {
                        console.error('Failed to load shapes for page', pageNumber, ':', err);
                    }
                }
            });
        }
    }, [board]);

    const savePage = async () => {
        if (!editorRef.current) {
            console.log('No editor ref');
            return false;
        }
        
        try {
            setSaving(true);
            const editor = editorRef.current;
            
            // Get all pages from tldraw
            const allPages = editor.getPages();
            console.log('Saving all pages:', allPages.length);
            
            // Store current page to restore later
            const currentPageId = editor.getCurrentPageId();
            
            // Save each page
            for (let i = 0; i < allPages.length; i++) {
                const page = allPages[i];
                const pageNumber = i + 1;
                
                // Switch to this page to get its shapes
                editor.setCurrentPage(page.id);
                
                // Get shapes for this page using getCurrentPageShapes
                const pageShapes = editor.getCurrentPageShapes();
                
                // Export to SVG for this page
                let svgContent = '';
                if (pageShapes.length > 0) {
                    try {
                        const shapeIds = pageShapes.map(s => s.id);
                        const svg = await editor.getSvg(shapeIds, { padding: 20 });
                        if (svg) {
                            svgContent = svg.outerHTML;
                        }
                    } catch (svgErr) {
                        console.error('SVG export failed for page', pageNumber, ':', svgErr);
                    }
                }
                
                // Save shapes data
                const shapesData = pageShapes.map(shape => ({
                    id: shape.id,
                    type: shape.type,
                    x: shape.x,
                    y: shape.y,
                    props: shape.props,
                    rotation: shape.rotation,
                    parentId: shape.parentId,
                    index: shape.index,
                    isLocked: shape.isLocked,
                    opacity: shape.opacity
                }));
                
                // Save this page to database
                await boardApi.savePage(boardId, pageNumber, {
                    svgContent,
                    tlDrawData: { 
                        shapes: shapesData,
                        pageId: page.id,
                        pageName: page.name
                    }
                });
                
                console.log('Saved page', pageNumber, 'with', pageShapes.length, 'shapes');
            }
            
            // Restore the original page
            editor.setCurrentPage(currentPageId);
            
            // Reload board to get updated data
            const response = await boardApi.getOne(boardId);
            setBoard(response.data);
            setSaveMessage('All pages saved!');
            setTimeout(() => setSaveMessage(''), 2000);
            return true;
            
        } catch (err) {
            console.error('Failed to save:', err);
            alert('Failed to save. Please try again.');
            return false;
        } finally {
            setSaving(false);
        }
    };

    const shareWithStudents = async () => {
        await savePage();
        try {
            await boardApi.share(boardId);
            const shareUrl = `${window.location.origin}/view/${boardId}`;
            await navigator.clipboard.writeText(shareUrl);
            alert(`Board shared! Link copied to clipboard:\n${shareUrl}`);
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
                    <div className="logo-title-small">
                        <img src={RootwiseLogo} alt="Rootwise" className="logo-small" />
                        <span>Rootwise</span>
                    </div>
                    <span style={{ color: '#666' }}>|</span>
                    <h2>{board?.title}</h2>
                </div>
                
                <div className="whiteboard-actions">
                    <button 
                        className={`btn btn-secondary ${sidePanelOpen && sidePanelTab === 'ai' ? 'active' : ''}`}
                        onClick={() => sidePanelOpen && sidePanelTab === 'ai' ? setSidePanelOpen(false) : openPanel('ai')}
                    >
                        AI Tools
                    </button>
                    
                    <button 
                        className={`btn btn-secondary ${sidePanelOpen && sidePanelTab === 'youtube' ? 'active' : ''}`}
                        onClick={() => sidePanelOpen && sidePanelTab === 'youtube' ? setSidePanelOpen(false) : openPanel('youtube')}
                    >
                        YouTube
                    </button>
                    
                    <button 
                        className={`btn btn-secondary ${sidePanelOpen && sidePanelTab === 'attachments' ? 'active' : ''}`}
                        onClick={() => sidePanelOpen && sidePanelTab === 'attachments' ? setSidePanelOpen(false) : openPanel('attachments')}
                    >
                        Attachments
                    </button>
                    
                    <div className="header-divider"></div>
                    
                    <button 
                        className="btn btn-primary"
                        onClick={savePage}
                        disabled={saving}
                    >
                        {saving ? 'Saving...' : 'Save'}
                    </button>
                    
                    {saveMessage && (
                        <span style={{ 
                            color: '#7cb342', 
                            fontWeight: '500',
                            fontSize: '14px'
                        }}>
                            {saveMessage}
                        </span>
                    )}
                    
                    <button className="btn btn-primary" onClick={shareWithStudents}>
                        Share
                    </button>
                </div>
            </div>
            
            <div className={`tldraw-container ${sidePanelOpen ? 'panel-open' : ''}`}>
                <Tldraw
                    onMount={handleMount}
                    autoFocus
                    options={{
                        defaultUserPreferences: {
                            colorScheme: 'light'
                        }
                    }}
                />
            </div>
            
            <SidePanel
                isOpen={sidePanelOpen}
                onClose={() => setSidePanelOpen(false)}
                activeTab={sidePanelTab}
                onTabChange={setSidePanelTab}
                boardId={boardId}
                onRefresh={loadBoard}
            />
        </div>
    );
}

export default Whiteboard;
