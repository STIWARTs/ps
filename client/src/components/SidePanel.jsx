import { useState } from 'react';
import { aiApi, youtubeApi, uploadApi } from '../services/api';

function SidePanel({ isOpen, onClose, activeTab, onTabChange, boardId, onRefresh }) {
    const getTabTitle = () => {
        switch(activeTab) {
            case 'ai': return 'AI Generate';
            case 'youtube': return 'YouTube Search';
            case 'attachments': return 'Attachments';
            default: return 'Tools';
        }
    };

    return (
        <div className={`side-panel ${isOpen ? 'open' : ''}`}>
            <div className="side-panel-header">
                <h3>{getTabTitle()}</h3>
                <button 
                    className="close-btn" 
                    onClick={onClose} 
                    title="Close"
                    style={{
                        width: '28px',
                        height: '28px',
                        border: 'none',
                        background: '#f3f4f6',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '16px',
                        fontWeight: 'bold',
                        color: '#666',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                >
                    X
                </button>
            </div>
            
            <div className="side-panel-tabs">
                <button 
                    className={`side-panel-tab ${activeTab === 'ai' ? 'active' : ''}`}
                    onClick={() => onTabChange('ai')}
                >
                    AI Generate
                </button>
                <button 
                    className={`side-panel-tab ${activeTab === 'youtube' ? 'active' : ''}`}
                    onClick={() => onTabChange('youtube')}
                >
                    YouTube
                </button>
                <button 
                    className={`side-panel-tab ${activeTab === 'attachments' ? 'active' : ''}`}
                    onClick={() => onTabChange('attachments')}
                >
                    Attachments
                </button>
            </div>
            
            <div className="side-panel-content">
                {activeTab === 'ai' && <AIPanel />}
                {activeTab === 'youtube' && <YouTubePanel />}
                {activeTab === 'attachments' && (
                    <AttachmentsPanel 
                        boardId={boardId} 
                        onRefresh={onRefresh}
                    />
                )}
            </div>
        </div>
    );
}

function AIPanel() {
    const [aiMode, setAiMode] = useState('text'); // 'text' or 'image'
    const [topic, setTopic] = useState('');
    const [contentType, setContentType] = useState('explanation');
    const [result, setResult] = useState('');
    const [loading, setLoading] = useState(false);
    
    // Image generation states
    const [imagePrompt, setImagePrompt] = useState('');
    const [generatedImage, setGeneratedImage] = useState(null);
    const [imageLoading, setImageLoading] = useState(false);
    const [imageError, setImageError] = useState('');
    const [searchTerms, setSearchTerms] = useState([]);

    const contentTypes = [
        { value: 'explanation', label: 'Explanation' },
        { value: 'summary', label: 'Summary' },
        { value: 'keypoints', label: 'Key Points' },
        { value: 'quiz', label: 'Quiz Questions' }
    ];

    const generateContent = async () => {
        if (!topic.trim()) {
            alert('Please enter a topic');
            return;
        }
        
        try {
            setLoading(true);
            setResult('');
            const response = await aiApi.generateText({
                topic,
                type: contentType
            });
            setResult(response.data.text);
        } catch (err) {
            console.error('AI generation failed:', err);
            const errorMsg = err.response?.data?.details || err.response?.data?.error || err.message;
            setResult(`Failed to generate content: ${errorMsg}`);
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(result);
        alert('Copied to clipboard!');
    };

    const generateImage = async () => {
        if (!imagePrompt.trim()) {
            alert('Please enter an image description');
            return;
        }
        
        try {
            setImageLoading(true);
            setGeneratedImage(null);
            setImageError('');
            setSearchTerms([]);
            
            const response = await aiApi.generateImage({
                topic: imagePrompt,
                style: 'educational diagram'
            });
            
            if (response.data.success) {
                setGeneratedImage(response.data.image);
            } else if (response.data.fallback) {
                setImageError(response.data.message);
                setSearchTerms(response.data.searchTerms || []);
            } else {
                setImageError('Failed to generate image');
            }
        } catch (err) {
            console.error('Image generation failed:', err);
            const errorMsg = err.response?.data?.details || err.response?.data?.error || err.message;
            setImageError(`Failed to generate image: ${errorMsg}`);
        } finally {
            setImageLoading(false);
        }
    };

    const downloadImage = () => {
        if (!generatedImage) return;
        const link = document.createElement('a');
        link.href = generatedImage;
        link.download = `ai-image-${Date.now()}.png`;
        link.click();
    };

    const copyImageToClipboard = async () => {
        if (!generatedImage) return;
        try {
            const response = await fetch(generatedImage);
            const blob = await response.blob();
            await navigator.clipboard.write([
                new ClipboardItem({ 'image/png': blob })
            ]);
            alert('Image copied to clipboard!');
        } catch (err) {
            alert('Failed to copy image. Try downloading instead.');
        }
    };

    return (
        <div>
            {/* Mode Toggle Switch */}
            <div style={{
                display: 'flex',
                background: '#f3f4f6',
                borderRadius: '10px',
                padding: '4px',
                marginBottom: '20px'
            }}>
                <button
                    onClick={() => setAiMode('text')}
                    style={{
                        flex: 1,
                        padding: '10px 16px',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: '600',
                        fontSize: '14px',
                        transition: 'all 0.2s',
                        background: aiMode === 'text' ? '#3b82f6' : 'transparent',
                        color: aiMode === 'text' ? 'white' : '#6b7280'
                    }}
                >
                    📝 Text
                </button>
                <button
                    onClick={() => setAiMode('image')}
                    style={{
                        flex: 1,
                        padding: '10px 16px',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: '600',
                        fontSize: '14px',
                        transition: 'all 0.2s',
                        background: aiMode === 'image' ? 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)' : 'transparent',
                        color: aiMode === 'image' ? 'white' : '#6b7280'
                    }}
                >
                    🎨 Image
                </button>
            </div>

            {/* Text Generation Section */}
            {aiMode === 'text' && (
                <div>
                    <div className="ai-input-group">
                        <textarea
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            placeholder="Enter a topic to generate content about..."
                        />
                    </div>
                    
                    <div className="ai-options">
                        {contentTypes.map(type => (
                            <button
                                key={type.value}
                                className={`ai-option ${contentType === type.value ? 'selected' : ''}`}
                                onClick={() => setContentType(type.value)}
                            >
                                {type.label}
                            </button>
                        ))}
                    </div>
                    
                    <button 
                        className="btn btn-primary" 
                        onClick={generateContent}
                        disabled={loading}
                        style={{ width: '100%', marginBottom: '15px' }}
                    >
                        {loading ? 'Generating...' : 'Generate Content'}
                    </button>
                    
                    {result && (
                        <div>
                            <div className="ai-result">{result}</div>
                            <button 
                                className="btn btn-secondary" 
                                onClick={copyToClipboard}
                                style={{ marginTop: '10px' }}
                            >
                                Copy to Clipboard
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Image Generation Section */}
            {aiMode === 'image' && (
                <div>
                    <div className="ai-input-group">
                        <input
                            type="text"
                            value={imagePrompt}
                            onChange={(e) => setImagePrompt(e.target.value)}
                            placeholder="Describe the image (e.g., 'water cycle diagram')"
                            style={{ 
                                width: '100%', 
                                padding: '12px', 
                                border: '1px solid #d1d5db',
                                borderRadius: '8px',
                                fontSize: '14px',
                                marginBottom: '10px'
                            }}
                            onKeyPress={(e) => e.key === 'Enter' && generateImage()}
                        />
                    </div>
                    
                    <button 
                        className="btn btn-primary" 
                        onClick={generateImage}
                        disabled={imageLoading}
                        style={{ 
                            width: '100%', 
                            marginBottom: '15px',
                            background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)'
                        }}
                    >
                        {imageLoading ? '🎨 Generating Image...' : '🎨 Generate Image'}
                    </button>

                    {imageLoading && (
                        <div style={{ 
                            padding: '12px', 
                            background: '#eff6ff', 
                            borderRadius: '8px',
                            marginBottom: '10px',
                            fontSize: '13px',
                            color: '#1e40af',
                            textAlign: 'center'
                        }}>
                            ⏳ First generation may take 20-30 seconds...
                        </div>
                    )}

                    {imageError && (
                        <div style={{ 
                            padding: '12px', 
                            background: '#fef3c7', 
                            borderRadius: '8px',
                            marginBottom: '10px',
                            fontSize: '13px',
                            color: '#92400e'
                        }}>
                            {imageError}
                            {searchTerms.length > 0 && (
                                <ul style={{ margin: '8px 0 0 16px', padding: 0 }}>
                                    {searchTerms.map((term, i) => (
                                        <li key={i}>
                                            <a 
                                                href={`https://www.google.com/search?tbm=isch&q=${encodeURIComponent(term)}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                style={{ color: '#1d4ed8' }}
                                            >
                                                {term}
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    )}

                    {generatedImage && (
                        <div style={{ marginBottom: '15px' }}>
                            <img 
                                src={generatedImage} 
                                alt="AI Generated"
                                style={{ 
                                    width: '100%', 
                                    borderRadius: '8px',
                                    border: '1px solid #e5e7eb'
                                }}
                            />
                            <div style={{ 
                                display: 'flex', 
                                gap: '8px', 
                                marginTop: '10px' 
                            }}>
                                <button 
                                    className="btn btn-secondary"
                                    onClick={downloadImage}
                                    style={{ flex: 1 }}
                                >
                                    ⬇️ Download
                                </button>
                                <button 
                                    className="btn btn-secondary"
                                    onClick={copyImageToClipboard}
                                    style={{ flex: 1 }}
                                >
                                    📋 Copy
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

function YouTubePanel() {
    const [query, setQuery] = useState('');
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedVideo, setSelectedVideo] = useState(null);

    const searchVideos = async () => {
        if (!query.trim()) {
            alert('Please enter a search query');
            return;
        }
        
        try {
            setLoading(true);
            setVideos([]);
            const response = await youtubeApi.search(query, 8);
            setVideos(response.data.videos || []);
        } catch (err) {
            console.error('YouTube search failed:', err);
            alert('Failed to search videos. Please check your API key.');
        } finally {
            setLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            searchVideos();
        }
    };

    return (
        <div>
            <div className="ai-input-group">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Search for educational videos..."
                    style={{ 
                        width: '100%', 
                        padding: '12px', 
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '14px'
                    }}
                />
            </div>
            
            <button 
                className="btn btn-primary" 
                onClick={searchVideos}
                disabled={loading}
                style={{ width: '100%', marginBottom: '15px' }}
            >
                {loading ? 'Searching...' : 'Search Videos'}
            </button>
            
            {selectedVideo && (
                <div style={{ marginBottom: '15px' }}>
                    <iframe
                        width="100%"
                        height="200"
                        src={selectedVideo.embedUrl}
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        style={{ borderRadius: '8px' }}
                    ></iframe>
                    <p style={{ fontSize: '13px', marginTop: '8px', fontWeight: '500' }}>
                        {selectedVideo.title}
                    </p>
                    <button 
                        className="btn btn-secondary"
                        onClick={() => setSelectedVideo(null)}
                        style={{ marginTop: '8px' }}
                    >
                        Close Video
                    </button>
                </div>
            )}
            
            <div className="video-grid">
                {videos.map(video => (
                    <div 
                        key={video.videoId} 
                        className="video-card"
                        onClick={() => setSelectedVideo(video)}
                    >
                        <img src={video.thumbnail} alt={video.title} />
                        <div className="video-card-info">
                            <h4>{video.title}</h4>
                            <p>{video.channelTitle}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function AttachmentsPanel({ boardId, onRefresh }) {
    const [uploading, setUploading] = useState(false);

    const handlePdfUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        try {
            setUploading(true);
            const formData = new FormData();
            formData.append('pdf', file);
            formData.append('boardId', boardId);
            formData.append('pageNumber', 1);
            
            await uploadApi.uploadPdf(formData);
            alert('PDF uploaded successfully!');
            onRefresh();
        } catch (err) {
            console.error('PDF upload failed:', err);
            alert('Failed to upload PDF');
        } finally {
            setUploading(false);
        }
    };

    const handleVoiceUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        try {
            setUploading(true);
            const formData = new FormData();
            formData.append('audio', file);
            formData.append('boardId', boardId);
            formData.append('pageNumber', 1);
            
            await uploadApi.uploadVoice(formData);
            alert('Audio uploaded successfully!');
            onRefresh();
        } catch (err) {
            console.error('Audio upload failed:', err);
            alert('Failed to upload audio');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div>
            <h4 style={{ marginBottom: '15px', fontSize: '14px', fontWeight: '600' }}>
                Upload Attachments
            </h4>
            
            <div style={{ marginBottom: '20px' }}>
                <label className="upload-zone" style={{ display: 'block', marginBottom: '10px' }}>
                    <input 
                        type="file" 
                        accept=".pdf"
                        onChange={handlePdfUpload}
                        style={{ display: 'none' }}
                        disabled={uploading}
                    />
                    <p>{uploading ? 'Uploading...' : 'Click to upload PDF'}</p>
                </label>
                
                <label className="upload-zone" style={{ display: 'block' }}>
                    <input 
                        type="file" 
                        accept="audio/*"
                        onChange={handleVoiceUpload}
                        style={{ display: 'none' }}
                        disabled={uploading}
                    />
                    <p>{uploading ? 'Uploading...' : 'Click to upload Audio/Voice'}</p>
                </label>
            </div>
            
            <h4 style={{ marginBottom: '10px', fontSize: '14px', fontWeight: '600' }}>
                Voice Recording
            </h4>
            <VoiceRecorder boardId={boardId} onRefresh={onRefresh} />
        </div>
    );
}

function VoiceRecorder({ boardId, onRefresh }) {
    const [isRecording, setIsRecording] = useState(false);
    const [mediaRecorder, setMediaRecorder] = useState(null);
    const [audioChunks, setAudioChunks] = useState([]);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream);
            
            recorder.ondataavailable = (e) => {
                setAudioChunks(prev => [...prev, e.data]);
            };
            
            recorder.onstop = async () => {
                const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                const formData = new FormData();
                formData.append('audio', audioBlob, 'recording.webm');
                formData.append('boardId', boardId);
                formData.append('pageNumber', 1);
                
                try {
                    await uploadApi.uploadVoice(formData);
                    alert('Recording saved!');
                    onRefresh();
                } catch (err) {
                    console.error('Failed to save recording:', err);
                    alert('Failed to save recording');
                }
                
                setAudioChunks([]);
                stream.getTracks().forEach(track => track.stop());
            };
            
            recorder.start();
            setMediaRecorder(recorder);
            setIsRecording(true);
        } catch (err) {
            console.error('Failed to start recording:', err);
            alert('Failed to access microphone. Please grant permission.');
        }
    };

    const stopRecording = () => {
        if (mediaRecorder) {
            mediaRecorder.stop();
            setIsRecording(false);
        }
    };

    return (
        <div>
            {!isRecording ? (
                <button className="btn btn-primary" onClick={startRecording}>
                    Start Recording
                </button>
            ) : (
                <button className="btn btn-danger" onClick={stopRecording}>
                    Stop Recording
                </button>
            )}
            {isRecording && (
                <p style={{ marginTop: '10px', color: '#ef4444', fontSize: '14px' }}>
                    Recording in progress...
                </p>
            )}
        </div>
    );
}

export default SidePanel;
