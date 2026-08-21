import { Routes, Route } from 'react-router-dom'
import { RequireAdmin } from '@/auth/RequireAdmin'
import { AdminShell } from '@/shell/AdminShell'
import { DashboardPage } from '@/pages/dashboard/DashboardPage'
import { RequestsPage } from '@/pages/requests/RequestsPage'
import { RequestDetailPage } from '@/pages/requests/RequestDetailPage'
import { UsersPage } from '@/pages/users/UsersPage'
import { UserDetailPage } from '@/pages/users/UserDetailPage'
import { VolunteersPage } from '@/pages/volunteers/VolunteersPage'
import { VolunteerDetailPage } from '@/pages/volunteers/VolunteerDetailPage'
import { PointsPage } from '@/pages/points/PointsPage'

export default function App() {
  return (
    <Routes>
      <Route element={<RequireAdmin />}>
        <Route element={<AdminShell />}>
          <Route index element={<DashboardPage />} />
          <Route path="requests" element={<RequestsPage />} />
          <Route path="requests/:id" element={<RequestDetailPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="users/:id" element={<UserDetailPage />} />
          <Route path="volunteers" element={<VolunteersPage />} />
          <Route path="volunteers/:id" element={<VolunteerDetailPage />} />
          <Route path="points" element={<PointsPage />} />
        </Route>
      </Route>
    </Routes>
  )
}
