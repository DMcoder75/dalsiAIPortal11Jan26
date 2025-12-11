/**
 * Subscription Settings Page
 * Allows users to view and manage their subscription
 */

import React, { useState } from 'react'
import Navigation from '../components/Navigation'
import Footer from '../components/Footer'
import Breadcrumb from '../components/Breadcrumb'
import SubscriptionManager from '../components/SubscriptionManager'
import { useAuth } from '../contexts/AuthContext'
import { Loader } from 'lucide-react'

export default function SubscriptionSettings() {
  const { user, loading } = useAuth()
  const [refreshKey, setRefreshKey] = useState(0)

  const handleSubscriptionChange = () => {
    // Refresh the subscription manager component
    setRefreshKey(prev => prev + 1)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground dark"
           style={{
             background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
             minHeight: '100vh'
           }}>
        <Navigation />
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <Loader className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background text-foreground dark"
           style={{
             background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
             minHeight: '100vh'
           }}>
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-foreground mb-4">Please Sign In</h1>
            <p className="text-muted-foreground">You need to be logged in to manage your subscription.</p>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground dark"
         style={{
           background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
           minHeight: '100vh'
         }}>
      <Navigation />
      <Breadcrumb items={[
        { label: 'Home', href: '/' },
        { label: 'Account', href: '/account' },
        { label: 'Subscription Settings', href: '/subscription-settings' }
      ]} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Subscription Settings
          </h1>
          <p className="text-xl text-muted-foreground">
            Manage your subscription plan and billing preferences
          </p>
        </div>

        {/* Subscription Manager Component */}
        <div key={refreshKey}>
          <SubscriptionManager
            userId={user.id}
            onSubscriptionChange={handleSubscriptionChange}
          />
        </div>

        {/* Additional Info */}
        <div className="mt-12 grid md:grid-cols-2 gap-6">
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-foreground mb-2">Need Help?</h3>
            <p className="text-muted-foreground text-sm mb-4">
              If you have questions about your subscription or need assistance, our support team is here to help.
            </p>
            <a href="/support" className="text-primary hover:underline text-sm font-medium">
              Contact Support →
            </a>
          </div>

          <div className="bg-primary/5 border border-primary/20 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-foreground mb-2">Billing Information</h3>
            <p className="text-muted-foreground text-sm mb-4">
              View and manage your billing address, payment methods, and invoices.
            </p>
            <a href="/billing" className="text-primary hover:underline text-sm font-medium">
              Go to Billing →
            </a>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
