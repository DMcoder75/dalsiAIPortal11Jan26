import { supabase } from './supabase'
import logger from './logger'
import { generateAIResponse, generateEducationResponse } from './aiGenerationService'

// Grade levels for education model
export const GRADE_LEVELS = [
  { code: 'elementary', name: 'Elementary School (K-5)' },
  { code: 'middle', name: 'Middle School (6-8)' },
  { code: 'high', name: 'High School (9-12)' },
  { code: 'college', name: 'College/University' },
  { code: 'adult', name: 'Adult Learning' }
]

/**
 * Generate explanation for a topic
 */
export const generateExplanation = async (topic, gradeLevel = 'high', userId = null) => {
  try {
    logger.info('🎓 [TUTOR_SERVICE] Generating explanation...', { topic, gradeLevel })

    // Validate input
    if (!topic || topic.trim().length === 0) {
      throw new Error('Topic cannot be empty')
    }

    const prompt = `Explain the following topic in a clear and engaging way suitable for ${gradeLevel} level students. Include key concepts, examples, and important details.\n\nTopic: ${topic}`

    // Use education model for better learning content
    const response = await generateEducationResponse(prompt, { mode: 'chat', grade_level: gradeLevel })
    
    if (!response || !response.data || !response.data.response) {
      throw new Error('Failed to generate explanation')
    }

    logger.info('✅ [TUTOR_SERVICE] Explanation generated successfully')

    return {
      explanation: response.data.response,
      topic: topic,
      grade_level: gradeLevel
    }
  } catch (error) {
    logger.error('❌ [TUTOR_SERVICE] Error generating explanation:', error.message)
    throw error
  }
}

/**
 * Generate practice questions for a topic
 */
export const generatePracticeQuestions = async (topic, gradeLevel = 'high', questionCount = 5, userId = null) => {
  try {
    logger.info('🎓 [TUTOR_SERVICE] Generating practice questions...', { topic, gradeLevel, questionCount })

    // Validate input
    if (!topic || topic.trim().length === 0) {
      throw new Error('Topic cannot be empty')
    }

    const prompt = `Generate ${questionCount} practice questions about the following topic suitable for ${gradeLevel} level students. For each question, provide 4 multiple choice options (A, B, C, D) and indicate the correct answer. Format each question clearly.\n\nTopic: ${topic}`

    // Use education model
    const response = await generateEducationResponse(prompt, { mode: 'chat', grade_level: gradeLevel })
    
    if (!response || !response.data || !response.data.response) {
      throw new Error('Failed to generate practice questions')
    }

    logger.info('✅ [TUTOR_SERVICE] Practice questions generated successfully')

    return {
      questions: response.data.response,
      topic: topic,
      grade_level: gradeLevel,
      question_count: questionCount
    }
  } catch (error) {
    logger.error('❌ [TUTOR_SERVICE] Error generating practice questions:', error.message)
    throw error
  }
}

/**
 * Save tutor session to database
 */
export const saveTutorSession = async (sessionData) => {
  try {
    logger.info('🎓 [TUTOR_SERVICE] Saving tutor session...', sessionData.topic)

    const { data, error } = await supabase
      .from('tutor_sessions')
      .insert([
        {
          user_id: sessionData.user_id,
          topic: sessionData.topic,
          grade_level: sessionData.grade_level,
          explanation: sessionData.explanation,
          practice_questions: sessionData.practice_questions,
          notes: sessionData.notes || '',
          metadata: sessionData.metadata || {}
        }
      ])
      .select()

    if (error) {
      logger.error('❌ [TUTOR_SERVICE] Error saving session:', error)
      throw error
    }

    logger.info('✅ [TUTOR_SERVICE] Tutor session saved successfully:', data[0]?.id)
    return data[0]
  } catch (error) {
    logger.error('❌ [TUTOR_SERVICE] Failed to save session:', error.message)
    throw error
  }
}

/**
 * Get tutor session history for a user
 */
export const getTutorSessionHistory = async (userId, limit = 50) => {
  try {
    logger.info('🎓 [TUTOR_SERVICE] Fetching tutor session history for user:', userId)

    const { data, error } = await supabase
      .from('tutor_sessions')
      .select('*')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      logger.error('❌ [TUTOR_SERVICE] Error fetching history:', error)
      throw error
    }

    logger.info('✅ [TUTOR_SERVICE] Fetched', data?.length || 0, 'tutor sessions')
    return data || []
  } catch (error) {
    logger.error('❌ [TUTOR_SERVICE] Failed to fetch history:', error.message)
    throw error
  }
}

/**
 * Get single tutor session by ID
 */
export const getTutorSessionById = async (sessionId, userId) => {
  try {
    logger.info('🎓 [TUTOR_SERVICE] Fetching tutor session:', sessionId)

    const { data, error } = await supabase
      .from('tutor_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('user_id', userId)
      .single()

    if (error) {
      logger.error('❌ [TUTOR_SERVICE] Error fetching session:', error)
      throw error
    }

    logger.info('✅ [TUTOR_SERVICE] Tutor session fetched successfully')
    return data
  } catch (error) {
    logger.error('❌ [TUTOR_SERVICE] Failed to fetch session:', error.message)
    throw error
  }
}

/**
 * Update tutor session (e.g., add notes, mark as completed)
 */
export const updateTutorSession = async (sessionId, userId, updates) => {
  try {
    logger.info('🎓 [TUTOR_SERVICE] Updating tutor session:', sessionId)

    const { data, error } = await supabase
      .from('tutor_sessions')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionId)
      .eq('user_id', userId)
      .select()

    if (error) {
      logger.error('❌ [TUTOR_SERVICE] Error updating session:', error)
      throw error
    }

    logger.info('✅ [TUTOR_SERVICE] Tutor session updated successfully')
    return data[0]
  } catch (error) {
    logger.error('❌ [TUTOR_SERVICE] Failed to update session:', error.message)
    throw error
  }
}

/**
 * Mark tutor session as completed
 */
export const markSessionCompleted = async (sessionId, userId, score = null) => {
  try {
    logger.info('🎓 [TUTOR_SERVICE] Marking session as completed:', sessionId)

    return await updateTutorSession(sessionId, userId, {
      is_completed: true,
      completed_at: new Date().toISOString(),
      score: score
    })
  } catch (error) {
    logger.error('❌ [TUTOR_SERVICE] Failed to mark session completed:', error.message)
    throw error
  }
}

/**
 * Delete tutor session (soft delete)
 */
export const deleteTutorSession = async (sessionId, userId) => {
  try {
    logger.info('🎓 [TUTOR_SERVICE] Deleting tutor session:', sessionId)

    return await updateTutorSession(sessionId, userId, {
      deleted_at: new Date().toISOString()
    })
  } catch (error) {
    logger.error('❌ [TUTOR_SERVICE] Failed to delete session:', error.message)
    throw error
  }
}

/**
 * Get completed tutor sessions
 */
export const getCompletedSessions = async (userId, limit = 50) => {
  try {
    logger.info('🎓 [TUTOR_SERVICE] Fetching completed tutor sessions for user:', userId)

    const { data, error } = await supabase
      .from('tutor_sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('is_completed', true)
      .is('deleted_at', null)
      .order('completed_at', { ascending: false })
      .limit(limit)

    if (error) {
      logger.error('❌ [TUTOR_SERVICE] Error fetching completed sessions:', error)
      throw error
    }

    logger.info('✅ [TUTOR_SERVICE] Fetched', data?.length || 0, 'completed sessions')
    return data || []
  } catch (error) {
    logger.error('❌ [TUTOR_SERVICE] Failed to fetch completed sessions:', error.message)
    throw error
  }
}

/**
 * Search tutor sessions by topic
 */
export const searchTutorSessions = async (userId, query, limit = 50) => {
  try {
    logger.info('🎓 [TUTOR_SERVICE] Searching tutor sessions:', query)

    const { data, error } = await supabase
      .from('tutor_sessions')
      .select('*')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .ilike('topic', `%${query}%`)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      logger.error('❌ [TUTOR_SERVICE] Error searching sessions:', error)
      throw error
    }

    logger.info('✅ [TUTOR_SERVICE] Found', data?.length || 0, 'matching sessions')
    return data || []
  } catch (error) {
    logger.error('❌ [TUTOR_SERVICE] Failed to search sessions:', error.message)
    throw error
  }
}

/**
 * Get tutor sessions by grade level
 */
export const getSessionsByGradeLevel = async (userId, gradeLevel, limit = 50) => {
  try {
    logger.info('🎓 [TUTOR_SERVICE] Fetching sessions for grade level:', gradeLevel)

    const { data, error } = await supabase
      .from('tutor_sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('grade_level', gradeLevel)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      logger.error('❌ [TUTOR_SERVICE] Error fetching sessions:', error)
      throw error
    }

    logger.info('✅ [TUTOR_SERVICE] Fetched', data?.length || 0, 'sessions for grade level', gradeLevel)
    return data || []
  } catch (error) {
    logger.error('❌ [TUTOR_SERVICE] Failed to fetch sessions:', error.message)
    throw error
  }
}

/**
 * Get tutor statistics for user
 */
export const getTutorStats = async (userId) => {
  try {
    logger.info('🎓 [TUTOR_SERVICE] Fetching tutor statistics for user:', userId)

    const { data, error } = await supabase
      .from('tutor_sessions')
      .select('*')
      .eq('user_id', userId)
      .is('deleted_at', null)

    if (error) {
      logger.error('❌ [TUTOR_SERVICE] Error fetching stats:', error)
      throw error
    }

    // Calculate stats
    const stats = {
      total_sessions: data?.length || 0,
      completed_sessions: 0,
      by_grade_level: {},
      average_score: 0,
      total_topics_studied: new Set()
    }

    if (data && data.length > 0) {
      let totalScore = 0
      let scoredCount = 0

      data.forEach(session => {
        if (session.is_completed) stats.completed_sessions++
        
        const gradeLevel = session.grade_level
        stats.by_grade_level[gradeLevel] = (stats.by_grade_level[gradeLevel] || 0) + 1
        
        stats.total_topics_studied.add(session.topic)
        
        if (session.score !== null) {
          totalScore += session.score
          scoredCount++
        }
      })

      if (scoredCount > 0) {
        stats.average_score = (totalScore / scoredCount).toFixed(2)
      }

      stats.total_topics_studied = stats.total_topics_studied.size
    }

    logger.info('✅ [TUTOR_SERVICE] Stats calculated:', stats)
    return stats
  } catch (error) {
    logger.error('❌ [TUTOR_SERVICE] Failed to fetch stats:', error.message)
    throw error
  }
}

export default {
  generateExplanation,
  generatePracticeQuestions,
  saveTutorSession,
  getTutorSessionHistory,
  getTutorSessionById,
  updateTutorSession,
  markSessionCompleted,
  deleteTutorSession,
  getCompletedSessions,
  searchTutorSessions,
  getSessionsByGradeLevel,
  getTutorStats,
  GRADE_LEVELS
}
