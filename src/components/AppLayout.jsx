import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Header from './Header'
import BottomNav from './BottomNav'
import SyncBanner from './SyncBanner'
import MoreSheet from './MoreSheet'

const AppLayout = () => {
  const [isMoreOpen, setIsMoreOpen] = useState(false)

  return (
    <div className="min-h-screen">
      <Header onOpenMore={() => setIsMoreOpen(true)} />
      <main className="mx-auto max-w-6xl px-4 pb-28 pt-4 md:px-10">
        <SyncBanner />
        <Outlet />
      </main>
      <BottomNav onOpenMore={() => setIsMoreOpen(true)} />
      <MoreSheet open={isMoreOpen} onClose={() => setIsMoreOpen(false)} />
    </div>
  )
}

export default AppLayout
