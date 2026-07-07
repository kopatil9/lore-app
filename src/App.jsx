import { Routes, Route, Navigate } from 'react-router-dom'
import LandingPage from './pages/LandingPage.jsx'
import MissionPage from './pages/MissionPage.jsx'
import SubmitPage from './pages/SubmitPage.jsx'
import BoardPage from './pages/BoardPage.jsx'
import AdminPage from './pages/AdminPage.jsx'
import RecapPage from './pages/RecapPage.jsx'
import GiveMissionPage from './pages/GiveMissionPage.jsx'
import LockGate from './components/LockGate.jsx'

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />

      {/* Guest mission flow — locked until event.unlock_at */}
      <Route path="/mission" element={<LockGate><MissionPage /></LockGate>} />
      <Route path="/submit"  element={<LockGate><SubmitPage /></LockGate>} />
      <Route path="/board"   element={<LockGate><BoardPage /></LockGate>} />

      {/* Always open — guests can send Komal a mission anytime */}
      <Route path="/give-mission" element={<GiveMissionPage />} />

      {/* Admin / host — never locked */}
      <Route path="/admin" element={<AdminPage />} />
      <Route path="/host" element={<AdminPage />} />
      <Route path="/recap" element={<RecapPage />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
