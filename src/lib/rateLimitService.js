/**
 * Rate Limit Service
 * Tracks API usage and enforces rate limits
 * Monitors hourly and daily quotas
 * Production-grade with persistent storage
 */

import logger from './logger'

/**
 * Rate limit tiers
 */
const RATE_LIMITS = {
  free: {
    hourly: 10,
    daily: 100,
    tier_name: 'Free'
  },
  pro: {
    hourly: 100,
    daily: 1000,
    tier_name: 'Pro'
  },
  enterprise: {
    hourly: 1000,
    daily: 10000,
    tier_name: 'Enterprise'
  }
}

/**
 * Initialize rate limit tracker
 * @param {string} tier - 'free' | 'pro' | 'enterprise'
 */
export const initializeRateLimitTracker = (tier = 'free') => {
  try {
    logger.info(`📊 [RATE_LIMIT] Initializing rate limit tracker for tier: ${tier}`)

    const tracker = {
      tier,
      hourly_count: 0,
      daily_count: 0,
      hourly_reset_time: Date.now() + (60 * 60 * 1000), // 1 hour from now
      daily_reset_time: Date.now() + (24 * 60 * 60 * 1000), // 24 hours from now
      requests: [] // Array of request timestamps for detailed tracking
    }

    localStorage.setItem('rate_limit_tracker', JSON.stringify(tracker))
    logger.info('✅ [RATE_LIMIT] Rate limit tracker initialized')

    return tracker

  } catch (error) {
    logger.error('❌ [RATE_LIMIT] Error initializing rate limit tracker:', error)
    return null
  }
}

/**
 * Get current rate limit tracker
 * @returns {Object} Current tracker or null
 */
export const getRateLimitTracker = () => {
  try {
    const tracker = localStorage.getItem('rate_limit_tracker')
    
    if (!tracker) {
      logger.debug('ℹ️ [RATE_LIMIT] No tracker found, initializing new one')
      return initializeRateLimitTracker('free')
    }

    return JSON.parse(tracker)

  } catch (error) {
    logger.error('❌ [RATE_LIMIT] Error getting rate limit tracker:', error)
    return null
  }
}

/**
 * Update tracker with user subscription tier
 * @param {string} tier - 'free' | 'pro' | 'enterprise'
 */
export const updateTrackerTier = (tier) => {
  try {
    logger.info(`📊 [RATE_LIMIT] Updating tracker tier to: ${tier}`)

    let tracker = getRateLimitTracker()
    
    if (!tracker) {
      tracker = initializeRateLimitTracker(tier)
    } else {
      tracker.tier = tier
      localStorage.setItem('rate_limit_tracker', JSON.stringify(tracker))
    }

    logger.info('✅ [RATE_LIMIT] Tracker tier updated')
    return tracker

  } catch (error) {
    logger.error('❌ [RATE_LIMIT] Error updating tracker tier:', error)
    return null
  }
}

/**
 * Reset hourly counter if time has passed
 * @param {Object} tracker - Current tracker
 * @returns {Object} Updated tracker
 */
const resetHourlyIfNeeded = (tracker) => {
  const now = Date.now()

  if (now >= tracker.hourly_reset_time) {
    logger.info('🔄 [RATE_LIMIT] Resetting hourly counter')
    tracker.hourly_count = 0
    tracker.hourly_reset_time = now + (60 * 60 * 1000)
  }

  return tracker
}

/**
 * Reset daily counter if time has passed
 * @param {Object} tracker - Current tracker
 * @returns {Object} Updated tracker
 */
const resetDailyIfNeeded = (tracker) => {
  const now = Date.now()

  if (now >= tracker.daily_reset_time) {
    logger.info('🔄 [RATE_LIMIT] Resetting daily counter')
    tracker.daily_count = 0
    tracker.daily_reset_time = now + (24 * 60 * 60 * 1000)
  }

  return tracker
}

/**
 * Check if request is allowed
 * @returns {Object} { allowed: boolean, reason: string, usage: Object }
 */
export const checkRateLimit = () => {
  try {
    let tracker = getRateLimitTracker()

    if (!tracker) {
      logger.error('❌ [RATE_LIMIT] No tracker found')
      return {
        allowed: false,
        reason: 'Rate limit tracker not initialized',
        usage: null
      }
    }

    // Reset counters if needed
    tracker = resetHourlyIfNeeded(tracker)
    tracker = resetDailyIfNeeded(tracker)

    const limits = RATE_LIMITS[tracker.tier] || RATE_LIMITS.free
    const hourlyRemaining = limits.hourly - tracker.hourly_count
    const dailyRemaining = limits.daily - tracker.daily_count

    logger.debug(`📊 [RATE_LIMIT] Current usage - Hourly: ${tracker.hourly_count}/${limits.hourly}, Daily: ${tracker.daily_count}/${limits.daily}`)

    // Check limits
    if (tracker.hourly_count >= limits.hourly) {
      logger.warn('⚠️ [RATE_LIMIT] Hourly limit exceeded')
      return {
        allowed: false,
        reason: `Hourly limit exceeded. Reset in ${Math.ceil((tracker.hourly_reset_time - Date.now()) / 60000)} minutes.`,
        usage: {
          hourly: { used: tracker.hourly_count, limit: limits.hourly, remaining: 0 },
          daily: { used: tracker.daily_count, limit: limits.daily, remaining: dailyRemaining }
        }
      }
    }

    if (tracker.daily_count >= limits.daily) {
      logger.warn('⚠️ [RATE_LIMIT] Daily limit exceeded')
      return {
        allowed: false,
        reason: `Daily limit exceeded. Reset in ${Math.ceil((tracker.daily_reset_time - Date.now()) / (60 * 60 * 1000))} hours.`,
        usage: {
          hourly: { used: tracker.hourly_count, limit: limits.hourly, remaining: hourlyRemaining },
          daily: { used: tracker.daily_count, limit: limits.daily, remaining: 0 }
        }
      }
    }

    logger.info('✅ [RATE_LIMIT] Request allowed')
    return {
      allowed: true,
      reason: null,
      usage: {
        hourly: { used: tracker.hourly_count, limit: limits.hourly, remaining: hourlyRemaining },
        daily: { used: tracker.daily_count, limit: limits.daily, remaining: dailyRemaining }
      }
    }

  } catch (error) {
    logger.error('❌ [RATE_LIMIT] Error checking rate limit:', error)
    return {
      allowed: false,
      reason: 'Error checking rate limit',
      usage: null
    }
  }
}

/**
 * Record a successful API request
 */
export const recordRequest = () => {
  try {
    let tracker = getRateLimitTracker()

    if (!tracker) {
      logger.error('❌ [RATE_LIMIT] No tracker found')
      return
    }

    // Reset counters if needed
    tracker = resetHourlyIfNeeded(tracker)
    tracker = resetDailyIfNeeded(tracker)

    // Increment counters
    tracker.hourly_count += 1
    tracker.daily_count += 1
    tracker.requests.push(Date.now())

    // Keep only last 1000 requests for memory efficiency
    if (tracker.requests.length > 1000) {
      tracker.requests = tracker.requests.slice(-1000)
    }

    localStorage.setItem('rate_limit_tracker', JSON.stringify(tracker))

    logger.debug(`📊 [RATE_LIMIT] Request recorded - Hourly: ${tracker.hourly_count}, Daily: ${tracker.daily_count}`)

  } catch (error) {
    logger.error('❌ [RATE_LIMIT] Error recording request:', error)
  }
}

/**
 * Get current usage statistics
 * @returns {Object} Usage stats
 */
export const getUsageStats = () => {
  try {
    let tracker = getRateLimitTracker()

    if (!tracker) {
      return null
    }

    // Reset counters if needed
    tracker = resetHourlyIfNeeded(tracker)
    tracker = resetDailyIfNeeded(tracker)

    const limits = RATE_LIMITS[tracker.tier] || RATE_LIMITS.free
    const hourlyRemaining = Math.max(0, limits.hourly - tracker.hourly_count)
    const dailyRemaining = Math.max(0, limits.daily - tracker.daily_count)

    return {
      tier: tracker.tier,
      tier_name: limits.tier_name,
      hourly: {
        used: tracker.hourly_count,
        limit: limits.hourly,
        remaining: hourlyRemaining,
        percentage: Math.round((tracker.hourly_count / limits.hourly) * 100)
      },
      daily: {
        used: tracker.daily_count,
        limit: limits.daily,
        remaining: dailyRemaining,
        percentage: Math.round((tracker.daily_count / limits.daily) * 100)
      },
      hourly_reset_in_minutes: Math.ceil((tracker.hourly_reset_time - Date.now()) / 60000),
      daily_reset_in_hours: Math.ceil((tracker.daily_reset_time - Date.now()) / (60 * 60 * 1000))
    }

  } catch (error) {
    logger.error('❌ [RATE_LIMIT] Error getting usage stats:', error)
    return null
  }
}

/**
 * Reset all rate limit data
 */
export const resetRateLimitData = () => {
  try {
    logger.info('🔄 [RATE_LIMIT] Resetting all rate limit data')
    localStorage.removeItem('rate_limit_tracker')
    logger.info('✅ [RATE_LIMIT] Rate limit data reset')
  } catch (error) {
    logger.error('❌ [RATE_LIMIT] Error resetting rate limit data:', error)
  }
}

export default {
  initializeRateLimitTracker,
  getRateLimitTracker,
  updateTrackerTier,
  checkRateLimit,
  recordRequest,
  getUsageStats,
  resetRateLimitData,
  RATE_LIMITS
}
