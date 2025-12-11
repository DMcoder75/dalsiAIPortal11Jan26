import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { subscriptionManager } from '../lib/subscriptionManager'
import logger from '../lib/logger'
import Navigation from '../components/Navigation'
import Footer from '../components/Footer'
import { Check, X } from 'lucide-react'

const PLANS = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'Free',
    displayName: 'Free',
    monthlyPrice: 0,
    yearlyPrice: 0,
    description: 'Perfect for trying out DalSi AI with basic features',
    features: [
      'Up to 5 AI queries per day',
      'Basic DalSiAI text processing',
      'Standard response time (< 10 seconds)',
      'Email support (72-hour response)',
      'Basic analytics dashboard',
      'Community forum access',
      'Basic training materials',
      'Single domain deployment',
      'No API access',
      'Standard security protocols'
    ],
    limits: {
      queries_per_day: 5,
      queries_per_month: 150,
      api_calls_per_month: 0,
      domains: 1,
      storage_gb: 1,
      users: 1
    },
    cta: 'Start Free Trial',
    trialDays: 0,
    tier: 1
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    name: 'Starter',
    displayName: 'Starter',
    monthlyPrice: 29,
    yearlyPrice: 261,
    description: 'Ideal for small practices and educational institutions',
    features: [
      'Up to 1,000 AI queries per month',
      'Full DalSiAI text processing',
      'Advanced response time (< 5 seconds)',
      'Email support (48-hour response)',
      'Advanced analytics dashboard',
      'API access with rate limiting (100 req/min)',
      'Basic customization options',
      'Single domain deployment',
      'Standard security protocols',
      'Training materials & documentation',
      'Monthly usage reports',
      'Basic integrations support'
    ],
    limits: {
      queries_per_day: 50,
      queries_per_month: 1000,
      api_calls_per_month: 1000,
      domains: 1,
      storage_gb: 10,
      users: 5
    },
    cta: 'Start Free Trial',
    trialDays: 14,
    tier: 2
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    name: 'Explorer',
    displayName: 'Explorer',
    monthlyPrice: 89,
    yearlyPrice: 801,
    description: 'Growing organizations needing more AI power',
    features: [
      'Up to 10,000 AI queries per month',
      'Full DalSiAI + DalSiAIVi (vision) access',
      'Multimodal processing capabilities',
      'Priority response time (< 3 seconds)',
      'Priority email support (24-hour response)',
      'Advanced analytics & insights',
      'Full API access (1,000 req/min)',
      'Custom integrations support',
      'Multi-domain deployment (up to 3)',
      'Enhanced security & compliance',
      'Advanced training & onboarding',
      'Dedicated account manager (part-time)',
      'Monthly strategy consultations',
      'Custom AI model fine-tuning (limited)',
      'Usage alerts & optimization tips'
    ],
    limits: {
      queries_per_day: 333,
      queries_per_month: 10000,
      api_calls_per_month: 10000,
      domains: 3,
      storage_gb: 50,
      users: 20
    },
    cta: 'Start Free Trial',
    trialDays: 14,
    tier: 3,
    popular: true
  },
  {
    id: '44444444-4444-4444-4444-444444444444',
    name: 'Pro',
    displayName: 'Pro',
    monthlyPrice: 199,
    yearlyPrice: 1791,
    description: 'Comprehensive solution for healthcare providers and educational networks',
    features: [
      'Up to 50,000 AI queries per month',
      'Full DalSiAI + DalSiAIVi + DalSiAI VD suite',
      'Real-time processing (< 2 seconds)',
      'Video & document processing',
      '24/7 priority phone & email support',
      'Advanced analytics & reporting',
      'Full API access (5,000 req/min)',
      'White-label solutions available',
      'Multi-domain deployment (unlimited)',
      'Advanced security & compliance',
      'Dedicated account manager (full-time)',
      'Weekly strategy consultations',
      'Custom AI model development',
      'Advanced integrations & webhooks',
      'SLA guarantee (99.5% uptime)',
      'Custom training programs',
      'Priority feature requests',
      'Advanced usage analytics'
    ],
    limits: {
      queries_per_day: 1667,
      queries_per_month: 50000,
      api_calls_per_month: 50000,
      domains: 999,
      storage_gb: 200,
      users: 100
    },
    cta: 'Start Free Trial',
    trialDays: 14,
    tier: 4
  },
  {
    id: '55555555-5555-5555-5555-555555555555',
    name: 'Enterprise',
    displayName: 'Enterprise',
    monthlyPrice: 0,
    yearlyPrice: 0,
    description: 'Unlimited AI power for large organizations',
    features: [
      'Unlimited AI queries',
      'Full DalSiAI + DalSiAIVi + DalSiAI VD suite',
      'Real-time processing (< 1 second)',
      'White-label solutions available',
      'Dedicated cloud infrastructure',
      'Custom AI model development',
      'Advanced security & compliance',
      '24/7 dedicated support team',
      'On-premise deployment options',
      'Custom integrations & APIs',
      'Advanced analytics & reporting',
      'Multi-tenant architecture',
      'Regulatory compliance assistance',
      'Executive-level consultations',
      'Custom training programs',
      'Revenue sharing opportunities',
      'Priority feature development',
      'SLA guarantee (99.99% uptime)',
      'Custom security protocols',
      'Dedicated infrastructure'
    ],
    limits: {
      queries_per_day: 999999,
      queries_per_month: 999999,
      api_calls_per_month: 999999,
      domains: 999999,
      storage_gb: 999999,
      users: 999999
    },
    cta: 'Contact Sales',
    trialDays: 0,
    tier: 5
  }
]

export default function Billing() {
  const { user } = useAuth()
  const [currentPlan, setCurrentPlan] = useState(null)
  const [billingCycle, setBillingCycle] = useState('monthly')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showChangePlanModal, setShowChangePlanModal] = useState(false)
  const [selectedPlanForChange, setSelectedPlanForChange] = useState(null)

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }

    const fetchCurrentPlan = async () => {
      try {
        logger.info('📋 Fetching current subscription plan...')
        const subscription = await subscriptionManager.getCurrentSubscription(user.id)
        if (subscription) {
          const plan = PLANS.find(p => p.id === subscription.plan_id)
          setCurrentPlan(plan)
          logger.info('✅ Current plan:', plan?.name)
        }
        setLoading(false)
      } catch (err) {
        logger.error('❌ Error fetching subscription:', err.message)
        setError(err.message)
        setLoading(false)
      }
    }

    fetchCurrentPlan()
  }, [user])

  const handleUpgrade = (planId) => {
    logger.info('🚀 Upgrading to plan:', planId)
    setSelectedPlanForChange(planId)
    setShowChangePlanModal(true)
  }

  const handleDowngrade = (planId) => {
    logger.info('📉 Downgrading to plan:', planId)
    setSelectedPlanForChange(planId)
    setShowChangePlanModal(true)
  }

  const confirmPlanChange = async () => {
    try {
      logger.info('✅ Confirming plan change to:', selectedPlanForChange)
      // TODO: Integrate with payment provider
      alert('Plan change functionality coming soon!')
      setShowChangePlanModal(false)
    } catch (err) {
      logger.error('❌ Error changing plan:', err.message)
      alert('Error changing plan: ' + err.message)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-4">Please Sign In</h1>
          <p className="text-gray-400">You need to be logged in to view billing information</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white"
         style={{
           background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
           minHeight: '100vh'
         }}>
      {/* Navigation */}
      <Navigation />

      {/* Hero Section */}
      <section className="py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-bold mb-6 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            Billing & Subscription
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Manage your subscription, view your current plan, and explore upgrade options
          </p>
        </div>
      </section>

      {/* Current Plan Section */}
      {currentPlan && (
        <section className="py-6 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-purple-900/10 to-transparent">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl font-bold mb-6 text-center">Your Current Plan</h2>
            <div className="bg-gradient-to-r from-purple-900/40 to-blue-900/40 border-2 border-purple-500 rounded-xl p-8 backdrop-blur-sm shadow-2xl shadow-purple-500/20">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-3xl font-bold text-purple-400 mb-2">{currentPlan.displayName}</h3>
                  <p className="text-gray-300 mb-6">{currentPlan.description}</p>
                  
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                        <span className="text-2xl font-bold text-purple-400">{currentPlan.limits.queries_per_month.toLocaleString()}</span>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Monthly Queries</p>
                        <p className="font-semibold">{currentPlan.limits.queries_per_month.toLocaleString()} queries/month</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                        <span className="text-2xl font-bold text-blue-400">{currentPlan.limits.queries_per_day}</span>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Daily Limit</p>
                        <p className="font-semibold">{currentPlan.limits.queries_per_day} queries/day</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                        <span className="text-2xl font-bold text-green-400">{currentPlan.limits.storage_gb}</span>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Storage</p>
                        <p className="font-semibold">{currentPlan.limits.storage_gb} GB</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col justify-center items-center md:items-end">
                  <div className="text-center md:text-right">
                    {currentPlan.monthlyPrice > 0 ? (
                      <>
                        <p className="text-6xl font-bold text-purple-400">${currentPlan.monthlyPrice}</p>
                        <p className="text-gray-400 text-lg">/month</p>
                      </>
                    ) : (
                      <p className="text-5xl font-bold text-green-400">Free</p>
                    )}
                    <p className="text-gray-400 mt-4">Active since today</p>
                    <button
                      onClick={() => setShowChangePlanModal(true)}
                      className="mt-6 px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold rounded-lg transition-all duration-300"
                    >
                      Change Plan
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Billing Cycle Toggle */}
      <section className="py-4 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center gap-6 mb-8">
            <span className={`text-lg font-semibold transition-colors ${billingCycle === 'monthly' ? 'text-white' : 'text-gray-400'}`}>
              Monthly
            </span>
            <button
              onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
              className="relative inline-flex h-10 w-20 items-center rounded-full bg-gradient-to-r from-gray-700 to-gray-600 hover:from-gray-600 hover:to-gray-500 transition-all duration-300"
            >
              <span
                className={`inline-block h-8 w-8 transform rounded-full bg-white shadow-lg transition-all duration-300 ${
                  billingCycle === 'yearly' ? 'translate-x-11' : 'translate-x-1'
                }`}
              />
            </button>
            <span className={`text-lg font-semibold transition-colors ${billingCycle === 'yearly' ? 'text-white' : 'text-gray-400'}`}>
              Yearly
            </span>
            {billingCycle === 'yearly' && (
              <span className="ml-4 px-4 py-2 bg-gradient-to-r from-green-500/20 to-green-400/20 text-green-400 rounded-full text-sm font-bold border border-green-500/50">
                Save 25%
              </span>
            )}
          </div>
        </div>
      </section>

      {/* Plans Grid Section */}
      <section className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold mb-2 text-center">All Plans</h2>
          <p className="text-xl text-gray-300 text-center mb-8 max-w-3xl mx-auto">
            Choose the perfect plan for your needs. Upgrade or downgrade anytime.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            {PLANS.map((plan) => (
              <div
                key={plan.id}
                className={`relative rounded-xl border transition-all duration-300 overflow-visible group ${
                  currentPlan?.id === plan.id
                    ? 'border-purple-500 bg-gradient-to-b from-purple-900/40 to-purple-900/10 ring-2 ring-purple-500/50 scale-105 pt-6'
                    : plan.popular
                    ? 'border-purple-500/50 bg-gradient-to-b from-purple-900/30 to-transparent hover:border-purple-400/70 hover:scale-105 pt-6'
                    : 'border-gray-700/50 bg-gradient-to-b from-gray-900/20 to-transparent hover:border-gray-600/70 hover:scale-105'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
                    <span className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-4 py-1 rounded-full text-sm font-bold shadow-lg">
                      Most Popular
                    </span>
                  </div>
                )}

                {currentPlan?.id === plan.id && (
                  <div className="absolute -top-3 right-6 z-10">
                    <span className="bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-1 rounded-full text-sm font-bold shadow-lg">
                      Current
                    </span>
                  </div>
                )}

                <div className="px-6 pb-6 h-full flex flex-col">
                  {!currentPlan?.id === plan.id && !plan.popular && <div className="h-0"></div>}
                  {/* Plan Name and Description */}
                  <h3 className="text-2xl font-bold mb-2 text-white">{plan.displayName}</h3>
                  <p className="text-sm text-gray-400 mb-6 h-10 line-clamp-2">{plan.description}</p>

                  {/* Price */}
                  <div className="mb-6 pb-6 border-b border-gray-700/50">
                    {plan.monthlyPrice === 0 && plan.yearlyPrice === 0 ? (
                      <div>
                        <p className="text-4xl font-bold text-white">Custom</p>
                        <p className="text-sm text-gray-400">pricing</p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-4xl font-bold text-white">
                          ${billingCycle === 'monthly' ? plan.monthlyPrice : Math.round(plan.yearlyPrice / 12)}
                        </p>
                        <p className="text-sm text-gray-400">/month</p>
                        {billingCycle === 'yearly' && (
                          <p className="text-xs text-gray-500 mt-1">
                            ${plan.yearlyPrice}/year
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* CTA Button */}
                  <button
                    onClick={() => {
                      if (currentPlan?.id === plan.id) {
                        // Already on this plan
                      } else if (plan.tier > (currentPlan?.tier || 0)) {
                        handleUpgrade(plan.id)
                      } else if (plan.tier < (currentPlan?.tier || 0)) {
                        handleDowngrade(plan.id)
                      } else {
                        handleUpgrade(plan.id)
                      }
                    }}
                    className={`w-full py-3 px-4 rounded-lg font-bold transition-all duration-300 mb-6 ${
                      currentPlan?.id === plan.id
                        ? 'bg-gray-700/50 text-gray-300 cursor-default'
                        : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl'
                    }`}
                  >
                    {currentPlan?.id === plan.id ? 'Current Plan' : plan.cta}
                  </button>

                  {plan.trialDays > 0 && currentPlan?.id !== plan.id && (
                    <p className="text-xs text-gray-400 text-center mb-6">
                      {plan.trialDays}-day free trial • No credit card required
                    </p>
                  )}

                  {/* Key Limits */}
                  <div className="space-y-3 mb-6 pb-6 border-b border-gray-700/50">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-400">Queries/Month</span>
                      <span className="font-bold text-white">{plan.limits.queries_per_month === 999999 ? '∞' : plan.limits.queries_per_month.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-400">API Calls/Month</span>
                      <span className="font-bold text-white">{plan.limits.api_calls_per_month === 999999 ? '∞' : plan.limits.api_calls_per_month.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-400">Domains</span>
                      <span className="font-bold text-white">{plan.limits.domains === 999999 ? '∞' : plan.limits.domains}</span>
                    </div>
                  </div>

                  {/* Features */}
                  <div className="flex-grow">
                    <p className="text-sm font-bold text-gray-300 mb-4">Key Features</p>
                    <ul className="space-y-3">
                      {plan.features.slice(0, 4).map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-xs text-gray-400">
                          <Check className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
                          <span>{feature}</span>
                        </li>
                      ))}
                      {plan.features.length > 4 && (
                        <li className="text-xs text-purple-400 font-semibold pt-2">
                          +{plan.features.length - 4} more features
                        </li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Comparison Section */}
      <section className="py-8 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-purple-900/10 to-transparent">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold mb-8 text-center">Complete Feature Comparison</h2>
          
          <div className="overflow-x-auto rounded-xl border border-gray-700/50">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700/50 bg-gray-900/30">
                  <th className="text-left py-4 px-6 font-bold text-white">Feature</th>
                  {PLANS.map((plan) => (
                    <th key={plan.id} className="text-center py-4 px-4 font-bold text-white">
                      {plan.displayName}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-700/30 hover:bg-gray-900/20 transition-colors">
                  <td className="py-4 px-6 text-gray-300 font-semibold">Queries per Month</td>
                  {PLANS.map((plan) => (
                    <td key={plan.id} className="text-center py-4 px-4 text-white font-semibold">
                      {plan.limits.queries_per_month === 999999 ? '∞' : plan.limits.queries_per_month.toLocaleString()}
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-gray-700/30 hover:bg-gray-900/20 transition-colors">
                  <td className="py-4 px-6 text-gray-300 font-semibold">API Calls per Month</td>
                  {PLANS.map((plan) => (
                    <td key={plan.id} className="text-center py-4 px-4 text-white font-semibold">
                      {plan.limits.api_calls_per_month === 999999 ? '∞' : plan.limits.api_calls_per_month.toLocaleString()}
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-gray-700/30 hover:bg-gray-900/20 transition-colors">
                  <td className="py-4 px-6 text-gray-300 font-semibold">Storage</td>
                  {PLANS.map((plan) => (
                    <td key={plan.id} className="text-center py-4 px-4 text-white font-semibold">
                      {plan.limits.storage_gb === 999999 ? '∞' : `${plan.limits.storage_gb} GB`}
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-gray-700/30 hover:bg-gray-900/20 transition-colors">
                  <td className="py-4 px-6 text-gray-300 font-semibold">Domains</td>
                  {PLANS.map((plan) => (
                    <td key={plan.id} className="text-center py-4 px-4 text-white font-semibold">
                      {plan.limits.domains === 999999 ? '∞' : plan.limits.domains}
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-gray-700/30 hover:bg-gray-900/20 transition-colors">
                  <td className="py-4 px-6 text-gray-300 font-semibold">Users</td>
                  {PLANS.map((plan) => (
                    <td key={plan.id} className="text-center py-4 px-4 text-white font-semibold">
                      {plan.limits.users === 999999 ? '∞' : plan.limits.users}
                    </td>
                  ))}
                </tr>
                <tr className="hover:bg-gray-900/20 transition-colors">
                  <td className="py-4 px-6 text-gray-300 font-semibold">Support</td>
                  {PLANS.map((plan) => (
                    <td key={plan.id} className="text-center py-4 px-4 text-white font-semibold">
                      {plan.tier === 1 && '72-hour'}
                      {plan.tier === 2 && '48-hour'}
                      {plan.tier === 3 && '24-hour'}
                      {plan.tier === 4 && '24/7'}
                      {plan.tier === 5 && '24/7 Dedicated'}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold mb-8 text-center">Frequently Asked Questions</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="p-6 rounded-xl border border-gray-700/50 bg-gradient-to-br from-gray-900/30 to-transparent hover:border-gray-600/70 transition-all duration-300">
              <h3 className="text-lg font-bold mb-3 text-white">Can I change my plan anytime?</h3>
              <p className="text-gray-400">Yes, you can upgrade or downgrade your plan at any time. Changes will take effect immediately on your next billing cycle.</p>
            </div>

            <div className="p-6 rounded-xl border border-gray-700/50 bg-gradient-to-br from-gray-900/30 to-transparent hover:border-gray-600/70 transition-all duration-300">
              <h3 className="text-lg font-bold mb-3 text-white">Do you offer refunds?</h3>
              <p className="text-gray-400">We offer a 14-day money-back guarantee for all paid plans. If you're not satisfied, contact our support team.</p>
            </div>

            <div className="p-6 rounded-xl border border-gray-700/50 bg-gradient-to-br from-gray-900/30 to-transparent hover:border-gray-600/70 transition-all duration-300">
              <h3 className="text-lg font-bold mb-3 text-white">What payment methods do you accept?</h3>
              <p className="text-gray-400">We accept all major credit cards, PayPal, and bank transfers for Enterprise plans.</p>
            </div>

            <div className="p-6 rounded-xl border border-gray-700/50 bg-gradient-to-br from-gray-900/30 to-transparent hover:border-gray-600/70 transition-all duration-300">
              <h3 className="text-lg font-bold mb-3 text-white">Can I get a custom plan?</h3>
              <p className="text-gray-400">Yes! Contact our sales team for custom pricing and features tailored to your specific needs.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-8 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-purple-900/20 to-blue-900/20">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">Ready to upgrade your plan?</h2>
          <p className="text-xl text-gray-300 mb-8">Get started with a plan that fits your needs. No credit card required for trial plans.</p>
          <button className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl">
            View All Plans
          </button>
        </div>
      </section>

      {/* Change Plan Modal */}
      {showChangePlanModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-gray-900 to-black border border-purple-500/50 rounded-xl p-8 max-w-2xl w-full shadow-2xl shadow-purple-500/30">
            <h2 className="text-3xl font-bold mb-6 text-white">Change Your Plan</h2>
            
            {selectedPlanForChange && (
              <div>
                <div className="mb-6 p-6 bg-purple-900/20 border border-purple-500/30 rounded-lg">
                  <h3 className="text-xl font-bold text-purple-400 mb-2">
                    {PLANS.find(p => p.id === selectedPlanForChange)?.displayName}
                  </h3>
                  <p className="text-gray-300 mb-4">
                    {PLANS.find(p => p.id === selectedPlanForChange)?.description}
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-400">Monthly Price</p>
                      <p className="text-2xl font-bold text-white">
                        ${PLANS.find(p => p.id === selectedPlanForChange)?.monthlyPrice || 'Custom'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Queries/Month</p>
                      <p className="text-2xl font-bold text-white">
                        {PLANS.find(p => p.id === selectedPlanForChange)?.limits.queries_per_month.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <p className="text-gray-300 mb-4">
                    {currentPlan?.id === selectedPlanForChange
                      ? "You're already on this plan."
                      : currentPlan && PLANS.find(p => p.id === selectedPlanForChange)?.tier > currentPlan.tier
                      ? `You will be upgraded from ${currentPlan.displayName} to ${PLANS.find(p => p.id === selectedPlanForChange)?.displayName}.`
                      : `You will be downgraded from ${currentPlan.displayName} to ${PLANS.find(p => p.id === selectedPlanForChange)?.displayName}.`}
                  </p>
                </div>
              </div>
            )}

            <div className="flex gap-4">
              <button
                onClick={() => setShowChangePlanModal(false)}
                className="flex-1 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-lg transition-all duration-300"
              >
                Cancel
              </button>
              <button
                onClick={confirmPlanChange}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold rounded-lg transition-all duration-300 shadow-lg"
              >
                Confirm Change
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <Footer />
    </div>
  )
}
