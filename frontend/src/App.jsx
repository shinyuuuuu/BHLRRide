import { Navigate, Route, Routes } from 'react-router-dom'
import Browsepage from './Browsepage.jsx'
import AccountPage from './Accountpage.jsx'
import LoginPage from './Loginpage.jsx'
import ProtectedRoute from './auth/ProtectedRoute.jsx'
import Vehiclepage from './vehiclepage.jsx'
import VendorPage from './Vendorpage.jsx'
import AdminPage from './Adminpage.jsx'
import VendorSignup from './Vendorsignup.jsx'
import VendorHelp from './Vendorhelp.jsx'



function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/browse" replace />} />
      <Route path="/browse" element={<Browsepage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/vehicles/:id" element={<Vehiclepage />} />
      <Route path="/become-a-vendor" element={<VendorSignup />} />

      <Route
        path="/account"
        element={
          <ProtectedRoute roles={['customer']}>
            <AccountPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/vendor"
        element={
          <ProtectedRoute roles={['vendor']}>
            <VendorPage />
          </ProtectedRoute>
        }
      />

    <Route
        path="/vendor/help"
        element={
          <ProtectedRoute roles={['vendor']}>
            <VendorHelp />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin"
        element={
          <ProtectedRoute roles={['admin']}>
            <AdminPage />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/browse" replace />} />
    </Routes>
  )
}

export default App