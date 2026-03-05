import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CheckCircle, ArrowRight, Loader2, PartyPopper } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export function CheckoutSuccessPage() {
  const [searchParams] = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')

  useEffect(() => {
    // Give webhook a moment to process
    const timer = setTimeout(() => {
      setStatus('success')
    }, 2000)
    return () => clearTimeout(timer)
  }, [])

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-brand mx-auto mb-4" />
          <p className="text-sm text-text-secondary">Confirming your payment...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-lg mx-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
      >
        <Card className="border-emerald/30">
          <CardContent className="p-8 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', bounce: 0.5 }}
              className="mb-6"
            >
              <div className="h-20 w-20 rounded-full bg-emerald/10 flex items-center justify-center mx-auto">
                <CheckCircle className="h-10 w-10 text-emerald" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="flex items-center justify-center gap-2 mb-2">
                <PartyPopper className="h-5 w-5 text-amber" />
                <h1 className="text-2xl font-extrabold">Payment Successful!</h1>
                <PartyPopper className="h-5 w-5 text-amber" />
              </div>
              <p className="text-text-secondary mt-2 mb-6">
                Your subscription has been activated. You now have access to all premium features.
                It may take a few seconds for your account to be updated.
              </p>

              <div className="flex flex-col gap-3">
                <Link to="/dashboard">
                  <Button className="w-full">
                    Go to Dashboard
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
                <Link to="/explore">
                  <Button variant="outline" className="w-full">
                    Explore Ideas
                  </Button>
                </Link>
              </div>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
