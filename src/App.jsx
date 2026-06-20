import { Routes, Route, Navigate } from 'react-router-dom'
import LandingPage from './pages/LandingPage.jsx'
import MissionPage from './pages/MissionPage.jsx'
import SubmitPage from './pages/SubmitPage.jsx'
import BoardPage from './pages/BoardPage.jsx'
import AdminPage from './pages/AdminPage.jsx'
import RecapPage from './pages/RecapPage.jsx'

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/mission" element={<MissionPage />} />
      <Route path="/submit" element={<SubmitPage />} />
      <Route path="/board" element={<BoardPage />} />
      <Route path="/admin" element={<AdminPage />} />
      <Route path="/recap" element={<RecapPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
