import { Navbar } from "@/components/navbar"
import { Sidebar } from "@/components/sidebar"
import { FeaturedCarousel } from "@/components/featured-carousel"
import { ClubsGrid } from "@/components/clubs-grid"
import { ThemesSection } from "@/components/themes-section"

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-black text-purple-50">
      <Navbar />

      <div className="flex flex-1">
        <Sidebar />

        <main className="flex-1 p-4 md:p-6 overflow-y-auto bg-gradient-to-b from-black to-zinc-900">
          <div className="max-w-7xl mx-auto space-y-8">
            {/* Featured Clubs */}
            <section>
              <h2 className="text-2xl font-bold mb-4 text-purple-100">Featured Clubs</h2>
              <FeaturedCarousel />
            </section>

            {/* Live Clubs */}
            <section>
              <h2 className="text-2xl font-bold mb-4 text-purple-100">Live Now</h2>
              <ClubsGrid />
            </section>

            {/* Club Themes */}
            <section>
              <h2 className="text-2xl font-bold mb-4 text-purple-100">Popular Themes</h2>
              <ThemesSection />
            </section>
          </div>
        </main>
      </div>
    </div>
  )
}
