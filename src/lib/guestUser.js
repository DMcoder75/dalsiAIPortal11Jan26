/**
 * Guest User Management
 * 
 * Handles getting the guest user ID from the session
 * The guest user ID is returned by the /api/auth/guest-key endpoint
 * and stored in sessionStorage when the guest session is created
 */

/**
 * Get the guest user ID from sessionStorage
 * This ID is set when /api/auth/guest-key is called during auth initialization
 * 
 * @returns {string|null} - Guest user ID or null if not found
 */
export const getGuestUserId = () => {
  try {
    const guestUserId = sessionStorage.getItem('dalsi_guest_user_id')
    
    if (guestUserId) {
      console.log('✅ Guest user ID retrieved from session:', guestUserId)
      return guestUserId
    } else {
      console.warn('⚠️ Guest user ID not found in session. Guest session may not be initialized.')
      return null
    }
  } catch (error) {
    console.error('❌ Error getting guest user ID from session:', error)
    return null
  }
}

/**
 * Clear the guest user session data
 * Useful for logout or session reset
 */
export const clearGuestUserSession = () => {
  try {
    sessionStorage.removeItem('dalsi_guest_user_id')
    sessionStorage.removeItem('dalsi_guest_key')
    sessionStorage.removeItem('dalsi_guest_limits')
    console.log('🗑️ Guest user session cleared')
  } catch (error) {
    console.error('❌ Error clearing guest user session:', error)
  }
}
