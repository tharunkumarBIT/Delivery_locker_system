import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from './store/hooks';
import { getCurrentUser } from './store/authSlice';
import Login from './components/Login';
import Register from './components/Register';
import Navbar from './components/Navbar';
import AdminDashboard from './components/AdminDashboard';
import UserDashboard from './components/UserDashboard';
import CourierDashboard from './components/CourierDashboard';
import { Toaster } from 'react-hot-toast';

function App() {
  const [showRegister, setShowRegister] = useState(false);
  const dispatch = useAppDispatch();
  const { user, isAuthenticated, loading } = useAppSelector((state) => state.auth);

  useEffect(() => {
    dispatch(getCurrentUser());
  }, [dispatch]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <>
        <Toaster position="top-right" />
        {showRegister ? (
          <Register onToggleLogin={() => setShowRegister(false)} />
        ) : (
          <Login onToggleRegister={() => setShowRegister(true)} />
        )}
      </>
    );
  }

  const renderDashboard = () => {
    switch (user?.role) {
      case 'admin':
        return <AdminDashboard />;
      case 'courier':
        return <CourierDashboard />;
      default:
        return <UserDashboard />;
    }
  };

  return (
    <>
      <Toaster position="top-right" />
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        {renderDashboard()}
      </div>
    </>
  );
}

export default App;
