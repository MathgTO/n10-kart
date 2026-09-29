import { BrowserRouter, HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Shell } from '@/components/Shell'
import { SessionsProvider } from '@/hooks/SessionsContext'
import { assertRubricV18 } from '@/lib/assertRubric'
import { NativeFileOpen } from '@/native/NativeFileOpen'
import { isNative } from '@/native/platform'
import { DrillsPage } from '@/pages/Drills'
import { Home } from '@/pages/Home'
import { KnowledgePage } from '@/pages/Knowledge'
import { PrivacyPage } from '@/pages/Privacy'
import { SessionPage } from '@/pages/Session'

// Startup assert — rubric schema 1.8 required
assertRubricV18()

function AppRoutes() {
  return (
    <Routes>
      <Route element={<Shell />}>
        <Route index element={<Home />} />
        <Route path="session/:id" element={<SessionPage />} />
        <Route path="drills" element={<DrillsPage />} />
        <Route path="knowledge" element={<KnowledgePage />} />
        <Route path="privacy" element={<PrivacyPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

export default function App() {
  return (
    <SessionsProvider>
      {isNative ? (
        // iOS shell: the web build uses base './', so path URLs like /session/:id would break
        // relative asset loading after a WebView reload. HashRouter keeps index.html as the document.
        <HashRouter>
          <NativeFileOpen />
          <AppRoutes />
        </HashRouter>
      ) : (
        <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <AppRoutes />
        </BrowserRouter>
      )}
    </SessionsProvider>
  )
}
