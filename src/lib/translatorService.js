import { supabase } from './supabase'
import logger from './logger'
import { generateAIResponse } from './aiGenerationService'

// Supported languages
export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ru', name: 'Russian' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'zh', name: 'Chinese (Simplified)' },
  { code: 'ar', name: 'Arabic' },
  { code: 'hi', name: 'Hindi' },
  { code: 'tr', name: 'Turkish' },
  { code: 'pl', name: 'Polish' },
  { code: 'nl', name: 'Dutch' },
  { code: 'vi', name: 'Vietnamese' },
  { code: 'th', name: 'Thai' },
  { code: 'id', name: 'Indonesian' }
]

/**
 * Translate text to target language
 */
export const translateText = async (text, targetLanguage, userId = null) => {
  try {
    logger.info('🌐 [TRANSLATOR_SERVICE] Translating to:', targetLanguage)

    // Validate input
    if (!text || text.trim().length === 0) {
      throw new Error('Text cannot be empty')
    }

    // Find target language name
    const targetLangObj = SUPPORTED_LANGUAGES.find(lang => lang.code === targetLanguage)
    if (!targetLangObj) {
      throw new Error('Unsupported language')
    }

    const prompt = `Translate the following text to ${targetLangObj.name}. Provide only the translation without any additional explanation or commentary.\n\nText to translate:\n${text}`

    // Call AI API
    const response = await generateAIResponse(prompt, { mode: 'chat' })
    
    if (!response || !response.data || !response.data.response) {
      throw new Error('Failed to translate text')
    }

    logger.info('✅ [TRANSLATOR_SERVICE] Translation completed successfully')

    return {
      translated_text: response.data.response,
      source_language: 'auto-detected',
      target_language: targetLanguage,
      target_language_name: targetLangObj.name,
      original_length: text.length,
      translated_length: response.data.response.length
    }
  } catch (error) {
    logger.error('❌ [TRANSLATOR_SERVICE] Error translating text:', error.message)
    throw error
  }
}

/**
 * Save translation to database
 */
export const saveTranslation = async (translationData) => {
  try {
    logger.info('🌐 [TRANSLATOR_SERVICE] Saving translation...', translationData.target_language)

    const { data, error } = await supabase
      .from('translations')
      .insert([
        {
          user_id: translationData.user_id,
          title: translationData.title,
          original_text: translationData.original_text,
          translated_text: translationData.translated_text,
          source_language: translationData.source_language,
          target_language: translationData.target_language,
          target_language_name: translationData.target_language_name,
          metadata: translationData.metadata || {}
        }
      ])
      .select()

    if (error) {
      logger.error('❌ [TRANSLATOR_SERVICE] Error saving translation:', error)
      throw error
    }

    logger.info('✅ [TRANSLATOR_SERVICE] Translation saved successfully:', data[0]?.id)
    return data[0]
  } catch (error) {
    logger.error('❌ [TRANSLATOR_SERVICE] Failed to save translation:', error.message)
    throw error
  }
}

/**
 * Get translation history for a user
 */
export const getTranslationHistory = async (userId, limit = 50) => {
  try {
    logger.info('🌐 [TRANSLATOR_SERVICE] Fetching translation history for user:', userId)

    const { data, error } = await supabase
      .from('translations')
      .select('*')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      logger.error('❌ [TRANSLATOR_SERVICE] Error fetching history:', error)
      throw error
    }

    logger.info('✅ [TRANSLATOR_SERVICE] Fetched', data?.length || 0, 'translations')
    return data || []
  } catch (error) {
    logger.error('❌ [TRANSLATOR_SERVICE] Failed to fetch history:', error.message)
    throw error
  }
}

/**
 * Get single translation by ID
 */
export const getTranslationById = async (translationId, userId) => {
  try {
    logger.info('🌐 [TRANSLATOR_SERVICE] Fetching translation:', translationId)

    const { data, error } = await supabase
      .from('translations')
      .select('*')
      .eq('id', translationId)
      .eq('user_id', userId)
      .single()

    if (error) {
      logger.error('❌ [TRANSLATOR_SERVICE] Error fetching translation:', error)
      throw error
    }

    logger.info('✅ [TRANSLATOR_SERVICE] Translation fetched successfully')
    return data
  } catch (error) {
    logger.error('❌ [TRANSLATOR_SERVICE] Failed to fetch translation:', error.message)
    throw error
  }
}

/**
 * Update translation (e.g., mark as favorite, update notes)
 */
export const updateTranslation = async (translationId, userId, updates) => {
  try {
    logger.info('🌐 [TRANSLATOR_SERVICE] Updating translation:', translationId)

    const { data, error } = await supabase
      .from('translations')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', translationId)
      .eq('user_id', userId)
      .select()

    if (error) {
      logger.error('❌ [TRANSLATOR_SERVICE] Error updating translation:', error)
      throw error
    }

    logger.info('✅ [TRANSLATOR_SERVICE] Translation updated successfully')
    return data[0]
  } catch (error) {
    logger.error('❌ [TRANSLATOR_SERVICE] Failed to update translation:', error.message)
    throw error
  }
}

/**
 * Toggle translation as favorite
 */
export const toggleTranslationFavorite = async (translationId, userId) => {
  try {
    const translation = await getTranslationById(translationId, userId)
    const newState = !translation.is_favorite

    logger.info('🌐 [TRANSLATOR_SERVICE] Toggling favorite:', translationId, '→', newState)

    return await updateTranslation(translationId, userId, {
      is_favorite: newState
    })
  } catch (error) {
    logger.error('❌ [TRANSLATOR_SERVICE] Failed to toggle favorite:', error.message)
    throw error
  }
}

/**
 * Delete translation (soft delete)
 */
export const deleteTranslation = async (translationId, userId) => {
  try {
    logger.info('🌐 [TRANSLATOR_SERVICE] Deleting translation:', translationId)

    return await updateTranslation(translationId, userId, {
      deleted_at: new Date().toISOString()
    })
  } catch (error) {
    logger.error('❌ [TRANSLATOR_SERVICE] Failed to delete translation:', error.message)
    throw error
  }
}

/**
 * Get favorite translations
 */
export const getFavoriteTranslations = async (userId, limit = 50) => {
  try {
    logger.info('🌐 [TRANSLATOR_SERVICE] Fetching favorite translations for user:', userId)

    const { data, error } = await supabase
      .from('translations')
      .select('*')
      .eq('user_id', userId)
      .eq('is_favorite', true)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      logger.error('❌ [TRANSLATOR_SERVICE] Error fetching favorites:', error)
      throw error
    }

    logger.info('✅ [TRANSLATOR_SERVICE] Fetched', data?.length || 0, 'favorite translations')
    return data || []
  } catch (error) {
    logger.error('❌ [TRANSLATOR_SERVICE] Failed to fetch favorites:', error.message)
    throw error
  }
}

/**
 * Search translations by title
 */
export const searchTranslations = async (userId, query, limit = 50) => {
  try {
    logger.info('🌐 [TRANSLATOR_SERVICE] Searching translations:', query)

    const { data, error } = await supabase
      .from('translations')
      .select('*')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .ilike('title', `%${query}%`)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      logger.error('❌ [TRANSLATOR_SERVICE] Error searching translations:', error)
      throw error
    }

    logger.info('✅ [TRANSLATOR_SERVICE] Found', data?.length || 0, 'matching translations')
    return data || []
  } catch (error) {
    logger.error('❌ [TRANSLATOR_SERVICE] Failed to search translations:', error.message)
    throw error
  }
}

/**
 * Get translations by target language
 */
export const getTranslationsByLanguage = async (userId, targetLanguage, limit = 50) => {
  try {
    logger.info('🌐 [TRANSLATOR_SERVICE] Fetching translations for language:', targetLanguage)

    const { data, error } = await supabase
      .from('translations')
      .select('*')
      .eq('user_id', userId)
      .eq('target_language', targetLanguage)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      logger.error('❌ [TRANSLATOR_SERVICE] Error fetching translations:', error)
      throw error
    }

    logger.info('✅ [TRANSLATOR_SERVICE] Fetched', data?.length || 0, 'translations for', targetLanguage)
    return data || []
  } catch (error) {
    logger.error('❌ [TRANSLATOR_SERVICE] Failed to fetch translations:', error.message)
    throw error
  }
}

/**
 * Get translation statistics for user
 */
export const getTranslationStats = async (userId) => {
  try {
    logger.info('🌐 [TRANSLATOR_SERVICE] Fetching translation statistics for user:', userId)

    const { data, error } = await supabase
      .from('translations')
      .select('*')
      .eq('user_id', userId)
      .is('deleted_at', null)

    if (error) {
      logger.error('❌ [TRANSLATOR_SERVICE] Error fetching stats:', error)
      throw error
    }

    // Calculate stats
    const stats = {
      total: data?.length || 0,
      by_language: {}
    }

    if (data && data.length > 0) {
      data.forEach(translation => {
        const lang = translation.target_language_name || translation.target_language
        stats.by_language[lang] = (stats.by_language[lang] || 0) + 1
      })
    }

    logger.info('✅ [TRANSLATOR_SERVICE] Stats calculated:', stats)
    return stats
  } catch (error) {
    logger.error('❌ [TRANSLATOR_SERVICE] Failed to fetch stats:', error.message)
    throw error
  }
}

export default {
  translateText,
  saveTranslation,
  getTranslationHistory,
  getTranslationById,
  updateTranslation,
  toggleTranslationFavorite,
  deleteTranslation,
  getFavoriteTranslations,
  searchTranslations,
  getTranslationsByLanguage,
  getTranslationStats,
  SUPPORTED_LANGUAGES
}
