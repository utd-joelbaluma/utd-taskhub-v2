import { BrowserRouter, Routes, Route } from 'react-router-dom'
import AppLayout from '@/layouts/AppLayout'
import DesignSystemPage from '@/pages/DesignSystemPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<div className="p-6 text-[#191b23]">Dashboard (coming soon)</div>} />
          <Route path="/projects" element={<div className="p-6 text-[#191b23]">Projects (coming soon)</div>} />
          <Route path="/tasks" element={<div className="p-6 text-[#191b23]">Tasks (coming soon)</div>} />
          <Route path="/kanban" element={<div className="p-6 text-[#191b23]">Kanban Board (coming soon)</div>} />
          <Route path="/analytics" element={<div className="p-6 text-[#191b23]">Analytics (coming soon)</div>} />
          <Route path="/settings" element={<div className="p-6 text-[#191b23]">Settings (coming soon)</div>} />
          <Route path="/design-system" element={<DesignSystemPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
