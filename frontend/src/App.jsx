import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './auth/AuthContext.jsx'
import { RequireAuth } from './auth/RequireAuth.jsx'
import { AppLayout } from './layouts/AppLayout.jsx'
import { AuthLayout } from './layouts/AuthLayout.jsx'
import { CreateSchedulePage } from './pages/CreateSchedulePage.jsx'
import { DashboardPage } from './pages/DashboardPage.jsx'
import { LoginPage } from './pages/LoginPage.jsx'
import { ProgressPage } from './pages/ProgressPage.jsx'
import { RegisterPage } from './pages/RegisterPage.jsx'
import { TasksPage } from './pages/TasksPage.jsx'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
          </Route>

          <Route element={<RequireAuth />}>
            <Route element={<AppLayout />}>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/tasks" element={<TasksPage />} />
              <Route path="/schedule/new" element={<CreateSchedulePage />} />
              <Route path="/progress" element={<ProgressPage />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
