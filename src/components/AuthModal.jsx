import React, { useState } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { X, Mail, Lock, User, Eye, EyeOff } from 'lucide-react'
// import { supabase } from '../lib/supabase'
import { loginWithJWT, signupWithGmail, loginWithGmail } from '../lib/jwtAuth'
import { useAuth } from '../contexts/AuthContext'
import { subscriptionManager } from '../lib/subscriptionManager'
import { updateTrackerTier } from '../lib/rateLimitService'
import { migrateGuestConversations } from '../lib/guestMigrationService'
import { checkUserExists, checkUserExistsByGoogleId } from '../lib/userExistenceService'
import GoogleDataDisclosure from './GoogleDataDisclosure'
import GoogleProfileSetup from './GoogleProfileSetup'
import logo from '../assets/DalSiAILogo2.png'

export default function AuthModal({ isOpen, onClose, onSuccess }) {
  const { login } = useAuth()
  const [isLogin, setIsLogin] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    companyName: ''
  })
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [showGoogleDisclosure, setShowGoogleDisclosure] = useState(false)
  const [showGoogleProfileSetup, setShowGoogleProfileSetup] = useState(false)
  const [googleData, setGoogleData] = useState(null)
  const [isProcessingGoogle, setIsProcessingGoogle] = useState(false)
  const [isNewGoogleUser, setIsNewGoogleUser] = useState(null)

  if (!isOpen) return null

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
    setError('')
    setSuccessMessage('')
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    console.log('🔐 [AUTH_MODAL] handleLogin started')
    console.log('📧 [AUTH_MODAL] Email:', formData.email)
    setIsLoading(true)
    setError('')
    console.log('✅ [AUTH_MODAL] Loading state set, error cleared')

    try {
      console.log('🎯 [AUTH_MODAL] Entering try block...')
      console.log('🔐 [AUTH_MODAL] Attempting JWT login...')
      
      const result = await loginWithJWT(formData.email, formData.password)
      console.log('📊 [AUTH_MODAL] JWT login result:', result)
      
      if (result.success) {
        console.log('✅ [AUTH_MODAL] JWT login successful')
        console.log('📦 [AUTH_MODAL] User data from JWT API:', result.user)
        console.log('📦 [AUTH_MODAL] User first_name:', result.user?.first_name)
        
        // loginWithJWT() already stored the complete user data to localStorage
        // Just reload the page to pick up the stored data
        if (onSuccess) onSuccess()
        onClose()
        
        // Reload after a short delay to ensure modal closes
        setTimeout(() => {
          window.location.reload()
        }, 300)
        return
      } else {
        // JWT login failed
        const errorMsg = result.error || 'Authentication failed'
        console.error('❌ [AUTH_MODAL] JWT login failed:', errorMsg)
        throw new Error(errorMsg)
      }
      
    } catch (error) {
      console.error('❌❌❌ [AUTH_MODAL] LOGIN ERROR CAUGHT ❌❌❌')
      console.error('🔴 [AUTH_MODAL] Error type:', error.constructor.name)
      console.error('🔴 [AUTH_MODAL] Error message:', error.message)
      console.error('🔴 [AUTH_MODAL] Error stack:', error.stack)
      console.error('🔴 [AUTH_MODAL] Full error:', error)
      
      // Provide user-friendly error messages
      let userMessage = error.message
      
      if (error.message.includes('fetch') || error.message.includes('network') || error.message.includes('Failed to fetch')) {
        userMessage = 'Something went wrong while fetching data. Please try later.'
      } else if (error.message.includes('CORS') || error.message.includes('NetworkError')) {
        userMessage = 'Something went wrong while fetching data. Please try later.'
      } else if (error.name === 'TypeError' && !error.message) {
        userMessage = 'Something went wrong while fetching data. Please try later.'
      } else if (!error.message) {
        userMessage = 'Login failed. Please check your credentials and try again.'
      }
      
      console.log('🚨 [AUTH_MODAL] Setting error message:', userMessage)
      setError(userMessage)
      console.log('✅ [AUTH_MODAL] Error state updated')
    } finally {
      console.log('🔄 [AUTH_MODAL] Finally block - setting isLoading to false')
      setIsLoading(false)
      console.log('✅ [AUTH_MODAL] handleLogin completed')
    }
  }

  const handleSignup = async (e) => {
    e.preventDefault()
    console.log('📝 [AUTH_MODAL] handleSignup started')
    setIsLoading(true)
    setError('')

    try {
      // Validate form data
      if (!formData.email || !formData.password || !formData.firstName || !formData.lastName) {
        throw new Error('Please fill in all required fields')
      }

      if (formData.password.length < 6) {
        throw new Error('Password must be at least 6 characters')
      }

      console.log('🔐 [AUTH_MODAL] Attempting signup with JWT API...')
      
      // Call signup endpoint (you'll need to add this to jwtAuth.js)
      const response = await fetch('https://api.neodalsi.com/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          first_name: formData.firstName,
          last_name: formData.lastName,
          company_name: formData.companyName || null,
          guest_api_key: localStorage.getItem('api_key') || null  // Include for migration
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Signup failed')
      }

      if (!data.success || !data.token || !data.user) {
        throw new Error('Invalid response from server')
      }

      console.log('✅ [AUTH_MODAL] Signup successful')
      console.log('📦 [AUTH_MODAL] User data:', data.user)

      // Store JWT token and user info
      localStorage.setItem('jwt_token', data.token)
      localStorage.setItem('user_info', JSON.stringify(data.user))
      localStorage.setItem('user_type', 'registered')

      // Clear guest data after successful migration
      localStorage.removeItem('api_key')
      localStorage.removeItem('guest_user_id')

      // Create initial free tier subscription for new user
      console.log('🎁 [AUTH_MODAL] Creating initial free subscription...')
      try {
        await subscriptionManager.createInitialSubscription(data.user.id)
        console.log('✅ [AUTH_MODAL] Initial subscription created')
      } catch (subError) {
        console.error('⚠️ [AUTH_MODAL] Error creating subscription:', subError)
        // Don't fail signup if subscription creation fails
      }

      // Initialize rate limit tracker for new user
      console.log('📊 [AUTH_MODAL] Initializing rate limit tracker...')
      try {
        updateTrackerTier(data.user.subscription_tier || 'free')
        console.log('✅ [AUTH_MODAL] Rate limit tracker initialized')
      } catch (rateLimitError) {
        console.error('⚠️ [AUTH_MODAL] Error initializing rate limits:', rateLimitError)
        // Don't fail signup if rate limit init fails
      }

      // Migrate guest conversations
      console.log('🔄 [AUTH_MODAL] Starting guest conversation migration...')
      try {
        const migrationResult = await migrateGuestConversations(data.user.id, data.token)
        if (migrationResult.success && migrationResult.migratedCount > 0) {
          console.log('✅ [AUTH_MODAL] Migrated conversations:', migrationResult.migratedCount)
        }
      } catch (migrationError) {
        console.error('⚠️ [AUTH_MODAL] Error migrating guest conversations:', migrationError)
      }

      // Show migration message if applicable
      let successMsg = 'Account created successfully! Check your email to verify your account.'
      if (data.migration && data.migration.conversations_migrated > 0) {
        successMsg = `${data.migration.message} Also check your email to verify your account.`
        console.log('✅ [AUTH_MODAL] Guest conversations migrated:', data.migration.conversations_migrated)
      }
      
      successMsg += ' Redirecting...'

      // Show success message
      setSuccessMessage(successMsg)
      
      if (onSuccess) onSuccess()
      onClose()

      // Reload after a short delay
      setTimeout(() => {
        window.location.reload()
      }, 1000)

    } catch (error) {
      console.error('❌ [AUTH_MODAL] SIGNUP ERROR:', error)
      
      let userMessage = error.message
      
      if (error.message.includes('fetch') || error.message.includes('network') || error.message.includes('Failed to fetch')) {
        userMessage = 'Network error. Please check your connection and try again.'
      } else if (error.message.includes('already exists')) {
        userMessage = 'This email is already registered. Please login instead.'
      } else if (!error.message) {
        userMessage = 'Signup failed. Please try again.'
      }
      
      setError(userMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleGmailSignup = async () => {
    console.log('📧 [AUTH_MODAL] handleGmailSignup started')
    setIsProcessingGoogle(true)
    setError('')
    
    try {
      // For signup, we don't have email yet, so we go directly to Gmail
      // The backend will check if user exists and handle accordingly
      setIsNewGoogleUser(true) // Assume new user for signup flow
      setShowGoogleDisclosure(true)
    } catch (error) {
      console.error('❌ [AUTH_MODAL] Error in Gmail signup:', error)
      setError('Failed to initiate Gmail signup')
      setIsProcessingGoogle(false)
    }
  }

  const handleGoogleDisclosureContinue = async () => {
    console.log('🔐 [AUTH_MODAL] User accepted disclosure, redirecting to Gmail...')
    setIsProcessingGoogle(true)
    try {
      await signupWithGmail()
    } catch (error) {
      console.error('❌ [AUTH_MODAL] GMAIL SIGNUP ERROR:', error)
      setError(error.message || 'Gmail signup failed. Please try again.')
      setShowGoogleDisclosure(false)
      setIsProcessingGoogle(false)
    }
  }

  const handleGmailLogin = async () => {
    console.log('📧 [AUTH_MODAL] handleGmailLogin started')
    setIsProcessingGoogle(false) // Don't process yet, just show disclosure
    setError('')
    
    try {
      // Show disclosure modal for login too
      setIsNewGoogleUser(false) // Mark as login flow (existing user)
      setShowGoogleDisclosure(true) // Show disclosure modal
    } catch (error) {
      console.error('❌ [AUTH_MODAL] Error in Gmail login:', error)
      setError('Failed to initiate Gmail login')
      setIsProcessingGoogle(false)
    }
  }

  const handleGoogleLoginContinue = async () => {
    console.log('🔐 [AUTH_MODAL] User accepted disclosure, redirecting to Gmail for login...')
    setIsProcessingGoogle(true)
    try {
      await loginWithGmail()
    } catch (error) {
      console.error('❌ [AUTH_MODAL] GMAIL LOGIN ERROR:', error)
      setError(error.message || 'Gmail login failed. Please try again.')
      setShowGoogleDisclosure(false)
      setIsProcessingGoogle(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-card border-border">
        <CardHeader className="relative">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="absolute right-2 top-2 h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
          
          <div className="flex items-center space-x-3 mb-4">
            <img src={logo} alt="Dalsi AI" className="h-10 w-10" />
            <div>
              <CardTitle className="text-xl">
                {isLogin ? 'Welcome Back' : 'Join Dalsi AI'}
              </CardTitle>
              <CardDescription>
                {isLogin ? 'Sign in to your account' : 'Create your account to get started'}
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={isLogin ? handleLogin : handleSignup} className="space-y-4">
            {!isLogin && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      name="firstName"
                      placeholder="First Name"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className="pl-10"
                      required
                    />
                  </div>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      name="lastName"
                      placeholder="Last Name"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    name="companyName"
                    placeholder="Company Name"
                    value={formData.companyName}
                    onChange={handleInputChange}
                    className="pl-10"
                  />
                </div>
              </>
            )}

            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                type="email"
                name="email"
                placeholder="Email Address"
                value={formData.email}
                onChange={handleInputChange}
                className="pl-10"
                required
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                type={showPassword ? 'text' : 'password'}
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleInputChange}
                className="pl-10 pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded text-red-600 text-sm">
                {error}
              </div>
            )}

            {successMessage && (
              <div className="p-3 bg-green-500/10 border border-green-500/20 rounded text-green-600 text-sm">
                {successMessage}
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
              disabled={isLoading}
            >
              {isLoading ? 'Loading...' : isLogin ? 'Sign In' : 'Sign Up'}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-card text-muted-foreground">Or continue with</span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full flex items-center justify-center gap-2"
              onClick={isLogin ? handleGmailLogin : handleGmailSignup}
              disabled={isLoading}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Gmail
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-card text-muted-foreground">
                  {isLogin ? "Don't have an account?" : 'Already have an account?'}
                </span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => {
                setIsLogin(!isLogin)
                setError('')
                setSuccessMessage('')
              }}
            >
              {isLogin ? 'Sign up' : 'Sign in'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Google Data Disclosure Modal - For both login and signup */}
      <GoogleDataDisclosure
        isOpen={showGoogleDisclosure}
        onClose={() => {
          setShowGoogleDisclosure(false)
          setIsProcessingGoogle(false)
        }}
        onContinue={isNewGoogleUser ? handleGoogleDisclosureContinue : handleGoogleLoginContinue}
        isLoading={isProcessingGoogle}
      />

      {/* Google Profile Setup Modal */}
      <GoogleProfileSetup
        isOpen={showGoogleProfileSetup}
        googleData={googleData}
        onClose={() => setShowGoogleProfileSetup(false)}
        onSubmit={handleGoogleProfileSubmit}
        isLoading={isProcessingGoogle}
      />
    </div>
  )
}
