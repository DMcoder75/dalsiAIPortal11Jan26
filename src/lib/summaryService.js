import { supabase } from './supabase'
import logger from './logger'
import { generateAIResponse, generateEducationResponse } from './aiGenerationService'

/**
 * Generate summary using AI
 */
export const generateSummary = async (text, summaryLength = 'medium', userId = null) => {
  try {
    logger.info('📝 [SUMMARY_SERVICE] Generating summary...', { length: summaryLength, textLength: text.length })

    // Validate input
    if (!text || text.trim().length === 0) {
      throw new Error('Text cannot be empty')
    }

    if (text.length < 50) {
      throw new Error('Text must be at least 50 characters long')
    }

    // Prepare prompt based on summary length
    const lengthInstructions = {
      short: 'Provide a very brief summary in 2-3 sentences.',
      medium: 'Provide a concise summary in 4-5 sentences.',
      long: 'Provide a comprehensive summary in 8-10 sentences.'
    }

    const instruction = lengthInstructions[summaryLength] || lengthInstructions.medium

    const prompt = `${instruction}\n\nText to summarize:\n${text}`

    // Call AI API
    const response = await generateAIResponse(prompt, { mode: 'chat' })
    
    if (!response || !response.data || !response.data.response) {
      throw new Error('Failed to generate summary from AI')
    }

    logger.info('✅ [SUMMARY_SERVICE] Summary generated successfully')

    return {
      summary: response.data.response,
      original_length: text.length,
      summary_length: response.data.response.length,
      compression_ratio: (response.data.response.length / text.length * 100).toFixed(2) + '%'
    }
  } catch (error) {
    logger.error('❌ [SUMMARY_SERVICE] Error generating summary:', error.message)
    throw error
  }
}

/**
 * Save summary to database
 */
export const saveSummary = async (summaryData) => {
  try {
    logger.info('📝 [SUMMARY_SERVICE] Saving summary...', summaryData.title)

    const { data, error } = await supabase
      .from('summaries')
      .insert([
        {
          user_id: summaryData.user_id,
          title: summaryData.title,
          original_text: summaryData.original_text,
          summary_text: summaryData.summary_text,
          summary_length: summaryData.summary_length,
          word_count_original: summaryData.word_count_original,
          word_count_summary: summaryData.word_count_summary,
          compression_ratio: summaryData.compression_ratio,
          metadata: summaryData.metadata || {}
        }
      ])
      .select()

    if (error) {
      logger.error('❌ [SUMMARY_SERVICE] Error saving summary:', error)
      throw error
    }

    logger.info('✅ [SUMMARY_SERVICE] Summary saved successfully:', data[0]?.id)
    return data[0]
  } catch (error) {
    logger.error('❌ [SUMMARY_SERVICE] Failed to save summary:', error.message)
    throw error
  }
}

/**
 * Get summary history for a user
 */
export const getSummaryHistory = async (userId, limit = 50) => {
  try {
    logger.info('📝 [SUMMARY_SERVICE] Fetching summary history for user:', userId)

    const { data, error } = await supabase
      .from('summaries')
      .select('*')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      logger.error('❌ [SUMMARY_SERVICE] Error fetching history:', error)
      throw error
    }

    logger.info('✅ [SUMMARY_SERVICE] Fetched', data?.length || 0, 'summaries')
    return data || []
  } catch (error) {
    logger.error('❌ [SUMMARY_SERVICE] Failed to fetch history:', error.message)
    throw error
  }
}

/**
 * Get single summary by ID
 */
export const getSummaryById = async (summaryId, userId) => {
  try {
    logger.info('📝 [SUMMARY_SERVICE] Fetching summary:', summaryId)

    const { data, error } = await supabase
      .from('summaries')
      .select('*')
      .eq('id', summaryId)
      .eq('user_id', userId)
      .single()

    if (error) {
      logger.error('❌ [SUMMARY_SERVICE] Error fetching summary:', error)
      throw error
    }

    logger.info('✅ [SUMMARY_SERVICE] Summary fetched successfully')
    return data
  } catch (error) {
    logger.error('❌ [SUMMARY_SERVICE] Failed to fetch summary:', error.message)
    throw error
  }
}

/**
 * Update summary (e.g., mark as favorite, update notes)
 */
export const updateSummary = async (summaryId, userId, updates) => {
  try {
    logger.info('📝 [SUMMARY_SERVICE] Updating summary:', summaryId)

    const { data, error } = await supabase
      .from('summaries')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', summaryId)
      .eq('user_id', userId)
      .select()

    if (error) {
      logger.error('❌ [SUMMARY_SERVICE] Error updating summary:', error)
      throw error
    }

    logger.info('✅ [SUMMARY_SERVICE] Summary updated successfully')
    return data[0]
  } catch (error) {
    logger.error('❌ [SUMMARY_SERVICE] Failed to update summary:', error.message)
    throw error
  }
}

/**
 * Toggle summary as favorite
 */
export const toggleSummaryFavorite = async (summaryId, userId) => {
  try {
    const summary = await getSummaryById(summaryId, userId)
    const newState = !summary.is_favorite

    logger.info('📝 [SUMMARY_SERVICE] Toggling favorite:', summaryId, '→', newState)

    return await updateSummary(summaryId, userId, {
      is_favorite: newState
    })
  } catch (error) {
    logger.error('❌ [SUMMARY_SERVICE] Failed to toggle favorite:', error.message)
    throw error
  }
}

/**
 * Delete summary (soft delete)
 */
export const deleteSummary = async (summaryId, userId) => {
  try {
    logger.info('📝 [SUMMARY_SERVICE] Deleting summary:', summaryId)

    return await updateSummary(summaryId, userId, {
      deleted_at: new Date().toISOString()
    })
  } catch (error) {
    logger.error('❌ [SUMMARY_SERVICE] Failed to delete summary:', error.message)
    throw error
  }
}

/**
 * Get favorite summaries
 */
export const getFavoriteSummaries = async (userId, limit = 50) => {
  try {
    logger.info('📝 [SUMMARY_SERVICE] Fetching favorite summaries for user:', userId)

    const { data, error } = await supabase
      .from('summaries')
      .select('*')
      .eq('user_id', userId)
      .eq('is_favorite', true)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      logger.error('❌ [SUMMARY_SERVICE] Error fetching favorites:', error)
      throw error
    }

    logger.info('✅ [SUMMARY_SERVICE] Fetched', data?.length || 0, 'favorite summaries')
    return data || []
  } catch (error) {
    logger.error('❌ [SUMMARY_SERVICE] Failed to fetch favorites:', error.message)
    throw error
  }
}

/**
 * Search summaries by title
 */
export const searchSummaries = async (userId, query, limit = 50) => {
  try {
    logger.info('📝 [SUMMARY_SERVICE] Searching summaries:', query)

    const { data, error } = await supabase
      .from('summaries')
      .select('*')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .ilike('title', `%${query}%`)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      logger.error('❌ [SUMMARY_SERVICE] Error searching summaries:', error)
      throw error
    }

    logger.info('✅ [SUMMARY_SERVICE] Found', data?.length || 0, 'matching summaries')
    return data || []
  } catch (error) {
    logger.error('❌ [SUMMARY_SERVICE] Failed to search summaries:', error.message)
    throw error
  }
}

/**
 * Get summary statistics for user
 */
export const getSummaryStats = async (userId) => {
  try {
    logger.info('📝 [SUMMARY_SERVICE] Fetching summary statistics for user:', userId)

    const { data, error } = await supabase
      .from('summaries')
      .select('*')
      .eq('user_id', userId)
      .is('deleted_at', null)

    if (error) {
      logger.error('❌ [SUMMARY_SERVICE] Error fetching stats:', error)
      throw error
    }

    // Calculate stats
    const stats = {
      total: data?.length || 0,
      total_words_original: 0,
      total_words_summary: 0,
      average_compression: 0
    }

    if (data && data.length > 0) {
      data.forEach(summary => {
        stats.total_words_original += summary.word_count_original || 0
        stats.total_words_summary += summary.word_count_summary || 0
      })
      stats.average_compression = (stats.total_words_summary / stats.total_words_original * 100).toFixed(2) + '%'
    }

    logger.info('✅ [SUMMARY_SERVICE] Stats calculated:', stats)
    return stats
  } catch (error) {
    logger.error('❌ [SUMMARY_SERVICE] Failed to fetch stats:', error.message)
    throw error
  }
}

export default {
  generateSummary,
  saveSummary,
  getSummaryHistory,
  getSummaryById,
  updateSummary,
  toggleSummaryFavorite,
  deleteSummary,
  getFavoriteSummaries,
  searchSummaries,
  getSummaryStats
}
