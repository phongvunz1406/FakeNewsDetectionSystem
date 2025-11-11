import { useState } from "react";
import { BrowserRouter, Link } from "react-router";
import { FiMenu, FiX } from "react-icons/fi";
import AppRouter from "./AppRouter";


export default function App() {
  const [isMenuOpen, setMenuOpen] = useState(false);
  const navLinkClass = "text-gray-700 hover:text-blue-600 transition-colors text-lg font-medium"
  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col font-sans bg-gray-50 text-gray-900">
        <header className="bg-white border-b border-gray-200 shadow-sm">
          <div className="container mx-auto px-6 py-4 flex flex-row items-center justify-between gap-3">
            <Link to="/"><h1 className="text-2xl font-semibold tracking-tight">MisInfo Guard</h1></Link>
            <nav className="hidden md:flex space-x-6">
              <Link to="/" className={navLinkClass}>Home</Link>
              <Link to="/analyze" className={navLinkClass}>Analyze</Link> {/*Remove this after analysis feature is available*/}
              <Link to="/about" className={navLinkClass}>About</Link>
            </nav>

            <button onClick={() => setMenuOpen(!isMenuOpen)} className="md:hidden text-gray-700 hover:text-blue-600 transition-colors">
              {isMenuOpen ? <FiX size={26}/> : <FiMenu size={26}/>}
            </button>
          </div>
          {isMenuOpen && (
            <nav className="md:hidden border-t border-gray-200 bg-white shadow-sm">
              <div className="flex flex-col divide-y divide-gray-200">
                <Link to="/" className={`${navLinkClass} px-6 py-4 hover:bg-blue-50`} onClick={() => setMenuOpen(false)}>Home</Link>
                <Link to="/analyze" className={`${navLinkClass} px-6 py-4 hover:bg-blue-50`} onClick={() => setMenuOpen(false)}>Analyze</Link>
                <Link to="/about" className={`${navLinkClass} px-6 py-4 hover:bg-blue-50`} onClick={() => setMenuOpen(false)}>About</Link>
              </div>
            </nav>
          )}
        </header>

        <main className="flex-1 container mx-auto px-4 py-8 bg-gray-50">
          <AppRouter />
        </main>
      </div>
    </BrowserRouter>
  );
}