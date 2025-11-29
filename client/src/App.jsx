import { BrowserRouter, Routes, Route } from 'react-router-dom';
import TeacherDashboard from './pages/TeacherDashboard';
import Whiteboard from './pages/Whiteboard';

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<TeacherDashboard />} />
                <Route path="/board/:boardId" element={<Whiteboard />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
