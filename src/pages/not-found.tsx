import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Home, Search, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SEO } from '@/components/seo'

export function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <SEO title="Page Not Found" description="The page you're looking for doesn't exist." url="/404" />
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="space-y-4"
      >
        <p className="text-6xl font-extrabold text-brand">404</p>
        <h1 className="text-xl font-bold text-text-primary">Page not found</h1>
        <p className="text-[14px] text-text-muted max-w-md">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <Link to="/">
            <Button className="gap-1.5">
              <Home className="h-3.5 w-3.5" /> Home
            </Button>
          </Link>
          <Link to="/explore">
            <Button variant="outline" className="gap-1.5">
              <Search className="h-3.5 w-3.5" /> Explore
            </Button>
          </Link>
        </div>
      </motion.div>
    </div>
  )
}
