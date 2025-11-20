'use client'
import { useState } from 'react'

export default function Navbar({ user }) {
  const [menuOpen, setMenuOpen] = useState(false)

  // Get first letter of user's name or email
  const firstLetter =
    user?.user_metadata?.full_name?.charAt(0)?.toUpperCase() ||
    user?.email?.charAt(0)?.toUpperCase() ||
    '?'

  return (
    <nav className="w-full bg-white text-black shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">

          {/* Left: App logo + name */}
          <div className="flex items-center space-x-2">
            <img
              src="/window.svg"
              alt="App Logo"
              className="w-8 h-8"
            />
            <span className="font-bold text-xl tracking-tight">retro</span>
          </div>

          {/* Right: User info (Desktop) */}
          <div className="hidden sm:flex items-center space-x-3">
            {/* Circle with first letter */}
            <div className="w-10 h-10 flex items-center justify-center rounded-full bg-black text-white font-semibold">
              {firstLetter}
            </div>

            {/* Username */}
            <p className="font-medium">
              {user?.user_metadata?.full_name || user?.email}
            </p>
          </div>

          {/* Mobile menu button */}
          <button
            className="sm:hidden p-2 rounded-md hover:bg-gray-100 transition"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d={
                  menuOpen
                    ? 'M6 18L18 6M6 6l12 12' // Close icon
                    : 'M4 6h16M4 12h16M4 18h16' // Hamburger icon
                }
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="sm:hidden bg-white border-t border-gray-200">
          <div className="px-4 py-3 flex items-center space-x-3">
            <div className="w-8 h-8 flex items-center justify-center rounded-full bg-black text-white font-semibold">
              {firstLetter}
            </div>
            <span className="text-sm font-medium">
              {user?.user_metadata?.full_name || user?.email}
            </span>
          </div>
        </div>
      )}
    </nav>
  )
}
