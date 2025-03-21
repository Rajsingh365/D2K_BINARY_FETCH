import Footer from '@/components/layout/Footer'
import Navbar from '@/components/layout/Navbar'
import React from 'react'
import { Outlet } from 'react-router-dom'

const RootLayout= () => {
  return (
      <div className="min-h-screen flex flex-col">
      <Navbar />
        <Outlet />
      <Footer />
      </div>
  )
}

export default RootLayout