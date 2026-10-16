import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import { MotionConfig } from 'framer-motion'
import HubPage from '../pages/HubPage'
import ProfilePage from '../pages/ProfilePage'
import { ToastProvider } from '../components/ui/Toast'
import { Skeleton } from '../components/ui/primitives'

// الأقسام الخاصة تُحمّل عند الطلب فقط — لا تُرسل شيفرة الإدارة لزوار الدليل
const MyProfilePage = lazy(() => import('../pages/MyProfilePage'))
const AdminLayout = lazy(() => import('../pages/admin/AdminLayout'))
const AdminDashboard = lazy(() => import('../pages/admin/AdminDashboard'))
const AdminMembers = lazy(() => import('../pages/admin/AdminMembers'))
const AdminMemberEdit = lazy(() => import('../pages/admin/AdminMemberEdit'))
const AdminReviews = lazy(() => import('../pages/admin/AdminReviews'))
const AdminTaxonomy = lazy(() => import('../pages/admin/AdminTaxonomy'))
const AdminSettings = lazy(() => import('../pages/admin/AdminSettings').then((m) => ({ default: m.AdminSettings })))
const AdminAudit = lazy(() => import('../pages/admin/AdminSettings').then((m) => ({ default: m.AdminAudit })))

function Fallback() {
  return (
    <div className="mx-auto max-w-[1240px] space-y-4 px-4 pt-24 sm:px-6" aria-busy>
      <Skeleton className="h-10 w-64" />
      <Skeleton className="h-80 rounded-[18px]" />
    </div>
  )
}

/** مسارات محجوزة لا يمكن استخدامها كمعرّف رابط لعضو: admin, my-profile */
export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <ToastProvider>
        <Suspense fallback={<Fallback />}>
          <Routes>
            <Route path="/" element={<HubPage />} />
            <Route path="/my-profile" element={<MyProfilePage />} />
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="members" element={<AdminMembers />} />
              <Route path="members/:id" element={<AdminMemberEdit />} />
              <Route path="reviews" element={<AdminReviews />} />
              <Route path="taxonomy" element={<AdminTaxonomy />} />
              <Route path="settings" element={<AdminSettings />} />
              <Route path="audit" element={<AdminAudit />} />
            </Route>
            <Route path="/:slug" element={<ProfilePage />} />
          </Routes>
        </Suspense>
      </ToastProvider>
    </MotionConfig>
  )
}
