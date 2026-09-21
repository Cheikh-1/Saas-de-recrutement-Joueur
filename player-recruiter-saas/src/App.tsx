import { Routes, Route } from 'react-router-dom'
import { LandingPage } from './features/landing/LandingPage'
import { LoginPage } from './features/auth/LoginPage'
import { SignUpPage } from './features/auth/SignUpPage'
import { UnauthorizedPage } from './features/auth/UnauthorizedPage'
import { NotFoundPage } from './features/common/NotFoundPage'
import { ProtectedRoute } from './components/ProtectedRoute'
import { PlayerDashboard } from './features/players/PlayerDashboard'
import { RecruiterDashboard } from './features/recruiters/RecruiterDashboard'
import { PlayerDetailPage } from './features/recruiters/PlayerDetailPage'
import { FavoritesPage } from './features/recruiters/FavoritesPage'
import { AcademyDashboard } from './features/academy/AcademyDashboard'
import { AdminOverview } from './features/admin/AdminOverview'
import { AcademyManagement } from './features/admin/AcademyManagement'
import { PlayerModeration } from './features/admin/PlayerModeration'

export default function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignUpPage />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />

      {/* Admin Protected Routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRole="admin">
            <AdminOverview />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/academies"
        element={
          <ProtectedRoute allowedRole="admin">
            <AcademyManagement />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/players"
        element={
          <ProtectedRoute allowedRole="admin">
            <PlayerModeration />
          </ProtectedRoute>
        }
      />

      {/* Player Protected Routes */}
      <Route
        path="/player/dashboard"
        element={
          <ProtectedRoute allowedRole="player">
            <PlayerDashboard />
          </ProtectedRoute>
        }
      />

      {/* Academy Protected Routes */}
      <Route
        path="/academy/dashboard"
        element={
          <ProtectedRoute allowedRole="academy">
            <AcademyDashboard />
          </ProtectedRoute>
        }
      />

      {/* Recruiter Protected Routes */}
      <Route
        path="/recruiter/dashboard"
        element={
          <ProtectedRoute allowedRole="recruiter">
            <RecruiterDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/recruiter/favorites"
        element={
          <ProtectedRoute allowedRole="recruiter">
            <FavoritesPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/recruiter/players/:id"
        element={
          <ProtectedRoute allowedRole="recruiter">
            <PlayerDetailPage />
          </ProtectedRoute>
        }
      />

      {/* 404 Fallback */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
