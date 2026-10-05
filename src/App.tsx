import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Shell } from '@/components/Shell'
import { SessionsProvider } from '@/hooks/SessionsContext'
import { assertRubricV18 } from '@/lib/assertRubric'
import { Home } from '@/pages/Home'
import { SessionPage } from '@/pages/Session'
import { SetupStepPage } from '@/pages/SetupStep'

// Startup assert — rubric schema 1.8 required
assertRubricV18()

export default function App() {
  return (
    <SessionsProvider>
      <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '')}>
        <Routes>
          <Route element={<Shell />}>
            <Route index element={<Home />} />
            <Route path="session/:id" element={<SessionPage />} />
            <Route path="session/:id/setup" element={<SetupStepPage />} />
            {/* Knowledge + Drills pages removed: drills live in the report drill-down. */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </SessionsProvider>
  )
}
