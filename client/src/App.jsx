import { BrowserRouter, Routes, Route } from 'react-router-dom';
import TeacherDashboard from './pages/TeacherDashboard';
import Whiteboard from './pages/Whiteboard';
import ViewBoard from './pages/ViewBoard';

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<TeacherDashboard />} />
                <Route path="/board/:boardId" element={<Whiteboard />} />
                <Route path="/view/:boardId" element={<ViewBoard />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
