import { supabase } from './supabase'
import logger from './logger'

/**
 * Save generated email to database
 */
export const saveEmailGeneration = async (emailData) => {
  try {
    logger.info('📧 [EMAIL_SERVICE] Saving email generation...', emailData.recipient_email)

    const { data, error } = await supabase
      .from('email_generations')
      .insert([
        {
          user_id: emailData.user_id,
          email_type: emailData.email_type,
          recipient_name: emailData.recipient_name,
          recipient_email: emailData.recipient_email,
          subject: emailData.subject,
          body: emailData.body,
          tone: emailData.tone,
          key_points: emailData.key_points || [],
          metadata: emailData.metadata || {}
        }
      ])
      .select()

    if (error) {
      logger.error('❌ [EMAIL_SERVICE] Error saving email:', error)
      throw error
    }

    logger.info('✅ [EMAIL_SERVICE] Email saved successfully:', data[0]?.id)
    return data[0]
  } catch (error) {
    logger.error('❌ [EMAIL_SERVICE] Failed to save email:', error.message)
    throw error
  }
}

/**
 * Get email generation history for a user
 */
export const getEmailHistory = async (userId, limit = 50) => {
  try {
    logger.info('📧 [EMAIL_SERVICE] Fetching email history for user:', userId)

    const { data, error } = await supabase
      .from('email_generations')
      .select('*')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      logger.error('❌ [EMAIL_SERVICE] Error fetching history:', error)
      throw error
    }

    logger.info('✅ [EMAIL_SERVICE] Fetched', data?.length || 0, 'emails')
    return data || []
  } catch (error) {
    logger.error('❌ [EMAIL_SERVICE] Failed to fetch history:', error.message)
    throw error
  }
}

/**
 * Get single email by ID
 */
export const getEmailById = async (emailId, userId) => {
  try {
    logger.info('📧 [EMAIL_SERVICE] Fetching email:', emailId)

    const { data, error } = await supabase
      .from('email_generations')
      .select('*')
      .eq('id', emailId)
      .eq('user_id', userId)
      .single()

    if (error) {
      logger.error('❌ [EMAIL_SERVICE] Error fetching email:', error)
      throw error
    }

    logger.info('✅ [EMAIL_SERVICE] Email fetched successfully')
    return data
  } catch (error) {
    logger.error('❌ [EMAIL_SERVICE] Failed to fetch email:', error.message)
    throw error
  }
}

/**
 * Update email (e.g., mark as favorite, update notes)
 */
export const updateEmail = async (emailId, userId, updates) => {
  try {
    logger.info('📧 [EMAIL_SERVICE] Updating email:', emailId)

    const { data, error } = await supabase
      .from('email_generations')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', emailId)
      .eq('user_id', userId)
      .select()

    if (error) {
      logger.error('❌ [EMAIL_SERVICE] Error updating email:', error)
      throw error
    }

    logger.info('✅ [EMAIL_SERVICE] Email updated successfully')
    return data[0]
  } catch (error) {
    logger.error('❌ [EMAIL_SERVICE] Failed to update email:', error.message)
    throw error
  }
}

/**
 * Toggle email as favorite
 */
export const toggleEmailFavorite = async (emailId, userId) => {
  try {
    // First get current state
    const email = await getEmailById(emailId, userId)
    const newState = !email.is_favorite

    logger.info('📧 [EMAIL_SERVICE] Toggling favorite:', emailId, '→', newState)

    return await updateEmail(emailId, userId, {
      is_favorite: newState
    })
  } catch (error) {
    logger.error('❌ [EMAIL_SERVICE] Failed to toggle favorite:', error.message)
    throw error
  }
}

/**
 * Delete email (soft delete)
 */
export const deleteEmail = async (emailId, userId) => {
  try {
    logger.info('📧 [EMAIL_SERVICE] Deleting email:', emailId)

    return await updateEmail(emailId, userId, {
      deleted_at: new Date().toISOString()
    })
  } catch (error) {
    logger.error('❌ [EMAIL_SERVICE] Failed to delete email:', error.message)
    throw error
  }
}

/**
 * Get favorite emails
 */
export const getFavoriteEmails = async (userId, limit = 50) => {
  try {
    logger.info('📧 [EMAIL_SERVICE] Fetching favorite emails for user:', userId)

    const { data, error } = await supabase
      .from('email_generations')
      .select('*')
      .eq('user_id', userId)
      .eq('is_favorite', true)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      logger.error('❌ [EMAIL_SERVICE] Error fetching favorites:', error)
      throw error
    }

    logger.info('✅ [EMAIL_SERVICE] Fetched', data?.length || 0, 'favorite emails')
    return data || []
  } catch (error) {
    logger.error('❌ [EMAIL_SERVICE] Failed to fetch favorites:', error.message)
    throw error
  }
}

/**
 * Search emails by subject or recipient
 */
export const searchEmails = async (userId, query, limit = 50) => {
  try {
    logger.info('📧 [EMAIL_SERVICE] Searching emails:', query)

    const { data, error } = await supabase
      .from('email_generations')
      .select('*')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .or(`subject.ilike.%${query}%,recipient_name.ilike.%${query}%,recipient_email.ilike.%${query}%`)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      logger.error('❌ [EMAIL_SERVICE] Error searching emails:', error)
      throw error
    }

    logger.info('✅ [EMAIL_SERVICE] Found', data?.length || 0, 'matching emails')
    return data || []
  } catch (error) {
    logger.error('❌ [EMAIL_SERVICE] Failed to search emails:', error.message)
    throw error
  }
}

/**
 * Get emails by type
 */
export const getEmailsByType = async (userId, emailType, limit = 50) => {
  try {
    logger.info('📧 [EMAIL_SERVICE] Fetching emails of type:', emailType)

    const { data, error } = await supabase
      .from('email_generations')
      .select('*')
      .eq('user_id', userId)
      .eq('email_type', emailType)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      logger.error('❌ [EMAIL_SERVICE] Error fetching emails:', error)
      throw error
    }

    logger.info('✅ [EMAIL_SERVICE] Fetched', data?.length || 0, 'emails of type', emailType)
    return data || []
  } catch (error) {
    logger.error('❌ [EMAIL_SERVICE] Failed to fetch emails:', error.message)
    throw error
  }
}

/**
 * Get email statistics for user
 */
export const getEmailStats = async (userId) => {
  try {
    logger.info('📧 [EMAIL_SERVICE] Fetching email statistics for user:', userId)

    const { data, error } = await supabase
      .from('email_generations')
      .select('email_type, count')
      .eq('user_id', userId)
      .is('deleted_at', null)

    if (error) {
      logger.error('❌ [EMAIL_SERVICE] Error fetching stats:', error)
      throw error
    }

    // Calculate stats
    const stats = {
      total: data?.length || 0,
      byType: {}
    }

    data?.forEach(email => {
      stats.byType[email.email_type] = (stats.byType[email.email_type] || 0) + 1
    })

    logger.info('✅ [EMAIL_SERVICE] Stats calculated:', stats)
    return stats
  } catch (error) {
    logger.error('❌ [EMAIL_SERVICE] Failed to fetch stats:', error.message)
    throw error
  }
}

export default {
  saveEmailGeneration,
  getEmailHistory,
  getEmailById,
  updateEmail,
  toggleEmailFavorite,
  deleteEmail,
  getFavoriteEmails,
  searchEmails,
  getEmailsByType,
  getEmailStats
}
