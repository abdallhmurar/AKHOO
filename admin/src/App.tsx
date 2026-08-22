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
import { BusinessesPage } from '@/pages/businesses/BusinessesPage'
import { NewBusinessPage } from '@/pages/businesses/NewBusinessPage'
import { EditBusinessPage } from '@/pages/businesses/EditBusinessPage'
import { BusinessDetailPage } from '@/pages/businesses/BusinessDetailPage'
import { OffersPage } from '@/pages/offers/OffersPage'
import { NewOfferPage } from '@/pages/offers/NewOfferPage'
import { EditOfferPage } from '@/pages/offers/EditOfferPage'
import { OfferDetailPage } from '@/pages/offers/OfferDetailPage'
import { ReviewsPage } from '@/pages/reviews/ReviewsPage'
import { OperationsMapPage } from '@/pages/map/OperationsMapPage'

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
          <Route path="businesses" element={<BusinessesPage />} />
          <Route path="businesses/new" element={<NewBusinessPage />} />
          <Route path="businesses/:id/edit" element={<EditBusinessPage />} />
          <Route path="businesses/:id" element={<BusinessDetailPage />} />
          <Route path="offers" element={<OffersPage />} />
          <Route path="offers/new" element={<NewOfferPage />} />
          <Route path="offers/:id/edit" element={<EditOfferPage />} />
          <Route path="offers/:id" element={<OfferDetailPage />} />
          <Route path="reviews" element={<ReviewsPage />} />
          <Route path="map" element={<OperationsMapPage />} />
        </Route>
      </Route>
    </Routes>
  )
}
