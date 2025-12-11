/**
 * Hook for automatic subscription setup on user registration
 */

import { useEffect, useState } from 'react'
import { subscriptionManager } from '../lib/subscriptionManager'

export const useSubscriptionSetup = (userId) => {
  const [subscriptionReady, setSubscriptionReady] = useState(false)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) {
      setLoading(false)
      return
    }

    const setupSubscription = async () => {
      try {
        setLoading(true)
        setError(null)

        // Check if user already has a subscription
        const currentSub = await subscriptionManager.getCurrentSubscription(userId)

        if (!currentSub) {
          // Create initial free tier subscription
          console.log('🆕 No subscription found, creating initial subscription...')
          await subscriptionManager.createInitialSubscription(userId)
        } else {
          console.log('✅ Subscription already exists:', currentSub.subscription_plans.name)
        }

        setSubscriptionReady(true)
      } catch (err) {
        console.error('❌ Error setting up subscription:', err)
        setError(err.message || 'Failed to setup subscription')
      } finally {
        setLoading(false)
      }
    }

    setupSubscription()
  }, [userId])

  return { subscriptionReady, loading, error }
}
