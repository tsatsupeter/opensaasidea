import { Link } from 'react-router-dom'
import { Crown, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface UpgradePromptProps {
  feature: string
  description?: string
  className?: string
}

export function UpgradePrompt({ feature, description, className = '' }: UpgradePromptProps) {
  return (
    <div className={`rounded-xl border border-brand/20 bg-brand/5 p-4 ${className}`}>
      <div className="flex items-start gap-3">
        <div className="h-9 w-9 rounded-lg bg-brand/10 flex items-center justify-center shrink-0">
          <Crown className="h-4.5 w-4.5 text-brand" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold">{feature}</h4>
          <p className="text-xs text-text-secondary mt-0.5">
            {description || 'Upgrade to Pro to unlock this feature.'}
          </p>
          <Link to="/pricing">
            <Button size="sm" className="mt-3 text-xs h-7 px-3">
              View Plans <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
