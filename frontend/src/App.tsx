import { useState } from "react";
import { BrowserRouter, Link, useNavigate } from "react-router";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import AppRouter from "./AppRouter";

function NavigationContent() {
  const [isMenuOpen, setMenuOpen] = useState(false);
  const { isAuthenticated, user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const navLinkClass = "text-gray-700 hover:text-blue-600 transition-colors text-lg font-medium";

  const handleLogout = async () => {
    await logout();
    navigate('/login');
    setMenuOpen(false);
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-gray-50 text-gray-900">
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-6 py-4 flex flex-row items-center justify-between gap-3">
          <Link to="/"><h1 className="text-2xl font-semibold tracking-tight">MisInfo Guard</h1></Link>

          <nav className="hidden md:flex items-center space-x-6">
            {isAuthenticated ? (
              <>
                <Link to="/" className={navLinkClass}>Home</Link>
                {isAdmin && (
                  <Link to="/admin" className="text-purple-600 hover:text-purple-700 transition-colors text-lg font-semibold">
                    Admin Dashboard
                  </Link>
                )}
                <span className="text-sm text-gray-600">Welcome, {user?.username}{isAdmin && ' (Admin)'}</span>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/" className={navLinkClass}>Home</Link>
                <Link to="/login" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium">
                  Login
                </Link>
                <Link to="/register" className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium">
                  Register
                </Link>
              </>
            )}
          </nav>

          <button onClick={() => setMenuOpen(!isMenuOpen)} className="md:hidden text-gray-700 hover:text-blue-600 transition-colors">
            {isMenuOpen ? 'Close' : 'Menu'}
          </button>
        </div>

        {isMenuOpen && (
          <nav className="md:hidden border-t border-gray-200 bg-white shadow-sm">
            <div className="flex flex-col divide-y divide-gray-200">
              {isAuthenticated ? (
                <>
                  <Link to="/" className={`${navLinkClass} px-6 py-4 hover:bg-blue-50`} onClick={() => setMenuOpen(false)}>Home</Link>
                  {isAdmin && (
                    <Link to="/admin" className="px-6 py-4 text-purple-600 hover:bg-purple-50 font-semibold" onClick={() => setMenuOpen(false)}>
                      Admin Dashboard
                    </Link>
                  )}
                  <div className="px-6 py-4 bg-gray-50">
                    <p className="text-sm text-gray-600 mb-2">Logged in as: {user?.username}{isAdmin && ' (Admin)'}</p>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium"
                    >
                      Logout
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <Link to="/" className={`${navLinkClass} px-6 py-4 hover:bg-blue-50`} onClick={() => setMenuOpen(false)}>Home</Link>
                  <Link to="/login" className="px-6 py-4 text-blue-600 hover:bg-blue-50 font-medium" onClick={() => setMenuOpen(false)}>Login</Link>
                  <Link to="/register" className="px-6 py-4 text-green-600 hover:bg-green-50 font-medium" onClick={() => setMenuOpen(false)}>Register</Link>
                </>
              )}
            </div>
          </nav>
        )}
      </header>

      <main className="flex-1 container mx-auto px-4 py-8 bg-gray-50">
        <AppRouter />
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NavigationContent />
      </AuthProvider>
    </BrowserRouter>
  );
}
