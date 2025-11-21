// Usage tracking utility for guest and logged-in users
import { supabase } from './supabase'

// Global variable to store the dynamic guest limit
let GUEST_LIMIT = 1 // Default value, will be updated from DB


/**
 * Fetches the guest message limit from the 'Free' plan in the database.
 */
export const fetchGuestLimit = async () => {
  try {
    const { data, error } = await supabase
      .from('subscription_plans')
      .select('limits')
      .eq('name', 'Free')
      .single()

    if (error) throw error

    if (data && data.limits && data.limits.queries_per_day) {
      GUEST_LIMIT = data.limits.queries_per_day
      console.log('✅ Dynamic Guest Limit set to:', GUEST_LIMIT)
    } else {
      console.warn('⚠️ Could not find queries_per_day in limits for Free plan. Keeping default GUEST_LIMIT:', GUEST_LIMIT)
    }
  } catch (error) {
    console.error('❌ Error fetching guest limit from DB:', error.message)
    // Keep default limit if fetch fails
  }
}

const GUEST_USAGE_KEY = 'dalsi_guest_messages'
const GUEST_LAST_USED_KEY = 'dalsi_guest_last_used'

const FREE_USER_LIMIT = 4 // Total: 1 guest + 3 after login

/**
 * Get guest message count from localStorage
 */
export const getGuestMessageCount = () => {
  try {
    const count = localStorage.getItem(GUEST_USAGE_KEY)
    return count ? parseInt(count, 10) : 0
  } catch (error) {
    console.error('Error reading guest usage:', error)
    return 0
  }
}







/**
 * Increment guest message count
 */
export const incrementGuestMessageCount = () => {
  try {
    const current = getGuestMessageCount() // This will also handle the daily reset check
    localStorage.setItem(GUEST_USAGE_KEY, (current + 1).toString())
    localStorage.setItem(GUEST_LAST_USED_KEY, new Date().toDateString()) // Update last used date
    return current + 1
  } catch (error) {
    console.error('Error incrementing guest usage:', error)
    // Return the current count if an error occurs, though it's likely a localStorage issue
    return current
  }
}

/**
 * Clear guest message count (call after login)
 */
export const clearGuestMessageCount = () => {
  try {
    localStorage.removeItem(GUEST_USAGE_KEY)
    localStorage.removeItem(GUEST_LAST_USED_KEY) // Clear last used date as well
  } catch (error) {
    console.error('Error clearing guest usage:', error)
  }
}

/**
 * Check if guest can send message
 */
export const getGuestLimit = () => GUEST_LIMIT;

export const canGuestSendMessage = () => {
  return getGuestMessageCount() < GUEST_LIMIT
}

/**
 * Check if logged-in user can send message
 * @param {number} userMessageCount - Total messages sent by user from DB
 * @param {object} subscription - User subscription object
 */
export const canUserSendMessage = (userMessageCount, subscription) => {
  // If user has active subscription, allow unlimited
  if (subscription && subscription.status === 'active') {
    return { canSend: true, reason: 'subscribed' }
  }

  // Check if user has reached free limit
  if (userMessageCount >= FREE_USER_LIMIT) {
    return { 
      canSend: false, 
      reason: 'limit_reached',
      remaining: 0
    }
  }

  return { 
    canSend: true, 
    reason: 'free_tier',
    remaining: FREE_USER_LIMIT - userMessageCount
  }
}

/**
 * Get usage status for display
 */
export const getUsageStatus = (isGuest, userMessageCount, subscription) => {
  if (isGuest) {
    const guestCount = getGuestMessageCount()
    return {
      isGuest: true,
      used: guestCount,
      limit: GUEST_LIMIT,
      remaining: Math.max(0, GUEST_LIMIT - guestCount),
      needsLogin: guestCount >= GUEST_LIMIT,
      needsSubscription: false
    }
  }

  if (subscription && subscription.status === 'active') {
    return {
      isGuest: false,
      used: userMessageCount,
      limit: Infinity,
      remaining: Infinity,
      needsLogin: false,
      needsSubscription: false,
      subscriptionType: subscription.plan_type
    }
  }

  return {
    isGuest: false,
    used: userMessageCount,
    limit: FREE_USER_LIMIT,
    remaining: Math.max(0, FREE_USER_LIMIT - userMessageCount),
    needsLogin: false,
    needsSubscription: userMessageCount >= FREE_USER_LIMIT
  }
}

export { GUEST_LIMIT, FREE_USER_LIMIT }
