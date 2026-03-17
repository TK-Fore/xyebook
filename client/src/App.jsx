import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import NovelDetail from './pages/NovelDetail';
import Reader from './pages/Reader';
import Profile from './pages/Profile';
import Login from './pages/Login';
import Register from './pages/Register';
import './styles/App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/novel/:id" element={<NovelDetail />} />
        <Route path="/read/:novelId/:chapterId" element={<Reader />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
