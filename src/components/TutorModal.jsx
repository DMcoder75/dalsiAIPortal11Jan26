import React, { useState, useRef } from 'react'
import { X, Send, Loader, Copy, Download, Save, AlertCircle, BookOpen } from 'lucide-react'
import { 
  generateExplanation, 
  generatePracticeQuestions, 
  saveTutorSession, 
  GRADE_LEVELS 
} from '../lib/tutorService'
import logger from '../lib/logger'

export default function TutorModal({ isOpen, onClose, user }) {
  const [topic, setTopic] = useState('')
  const [gradeLevel, setGradeLevel] = useState('high')
  const [questionCount, setQuestionCount] = useState(5)
  const [explanation, setExplanation] = useState(null)
  const [practiceQuestions, setPracticeQuestions] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)
  const [sessionNotes, setSessionNotes] = useState('')
  const [showSaveForm, setShowSaveForm] = useState(false)
  const [successMessage, setSuccessMessage] = useState(null)
  const [activeTab, setActiveTab] = useState('explanation') // 'explanation' or 'questions'
  const topicInputRef = useRef(null)

  const handleGenerateExplanation = async () => {
    try {
      setError(null)
      setLoading(true)
      logger.info('🎓 [TUTOR_MODAL] Generating explanation...', { topic, gradeLevel })

      const result = await generateExplanation(topic, gradeLevel, user?.id)
      setExplanation(result)
      setActiveTab('explanation')
      setShowSaveForm(true)
      logger.info('✅ [TUTOR_MODAL] Explanation generated successfully')
    } catch (err) {
      logger.error('❌ [TUTOR_MODAL] Error generating explanation:', err)
      setError(err.message || 'Failed to generate explanation')
    } finally {
      setLoading(false)
    }
  }

  const handleGeneratePracticeQuestions = async () => {
    try {
      setError(null)
      setLoading(true)
      logger.info('🎓 [TUTOR_MODAL] Generating practice questions...', { topic, gradeLevel, questionCount })

      const result = await generatePracticeQuestions(topic, gradeLevel, questionCount, user?.id)
      setPracticeQuestions(result)
      setActiveTab('questions')
      setShowSaveForm(true)
      logger.info('✅ [TUTOR_MODAL] Practice questions generated successfully')
    } catch (err) {
      logger.error('❌ [TUTOR_MODAL] Error generating questions:', err)
      setError(err.message || 'Failed to generate practice questions')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveSession = async () => {
    try {
      if (!user) {
        setError('Please log in to save learning sessions')
        return
      }

      setSaving(true)
      setError(null)
      logger.info('🎓 [TUTOR_MODAL] Saving tutor session...', topic)

      const sessionData = {
        user_id: user.id,
        topic: topic,
        grade_level: gradeLevel,
        explanation: explanation?.explanation || '',
        practice_questions: practiceQuestions?.questions || '',
        notes: sessionNotes,
        metadata: {
          created_at: new Date().toISOString(),
          question_count: questionCount
        }
      }

      await saveTutorSession(sessionData)
      setSuccessMessage('Learning session saved successfully!')
      setTimeout(() => setSuccessMessage(null), 3000)
      logger.info('✅ [TUTOR_MODAL] Tutor session saved successfully')
    } catch (err) {
      logger.error('❌ [TUTOR_MODAL] Error saving session:', err)
      setError(err.message || 'Failed to save session')
    } finally {
      setSaving(false)
    }
  }

  const handleCopyContent = (content) => {
    navigator.clipboard.writeText(content)
    setSuccessMessage('Content copied to clipboard!')
    setTimeout(() => setSuccessMessage(null), 2000)
    logger.info('✅ [TUTOR_MODAL] Content copied to clipboard')
  }

  const handleDownloadContent = (content, filename) => {
    const element = document.createElement('a')
    const file = new Blob([content], { type: 'text/plain' })
    element.href = URL.createObjectURL(file)
    element.download = filename
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
    logger.info('✅ [TUTOR_MODAL] Content downloaded')
  }

  const handleClearAll = () => {
    setTopic('')
    setExplanation(null)
    setPracticeQuestions(null)
    setSessionNotes('')
    setShowSaveForm(false)
    setError(null)
    setSuccessMessage(null)
    setActiveTab('explanation')
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto border border-border">
        {/* Header */}
        <div className="sticky top-0 bg-card border-b border-border p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">🎓 AI Tutor</h2>
            <p className="text-sm text-muted-foreground mt-1">Learn anything with AI-powered explanations and practice</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Error Message */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-500">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {successMessage && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 flex gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-1.5 flex-shrink-0" />
              <p className="text-sm text-green-500">{successMessage}</p>
            </div>
          )}

          {/* Input Section */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-foreground">
              What would you like to learn?
            </label>
            <input
              ref={topicInputRef}
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., Photosynthesis, World War II, Calculus..."
              className="w-full p-4 bg-muted border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          {/* Grade Level Selection */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-foreground">
              Grade Level
            </label>
            <select
              value={gradeLevel}
              onChange={(e) => setGradeLevel(e.target.value)}
              className="w-full p-3 bg-muted border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              {GRADE_LEVELS.map(level => (
                <option key={level.code} value={level.code}>
                  {level.name}
                </option>
              ))}
            </select>
          </div>

          {/* Question Count Selection */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-foreground">
              Number of Practice Questions
            </label>
            <select
              value={questionCount}
              onChange={(e) => setQuestionCount(parseInt(e.target.value))}
              className="w-full p-3 bg-muted border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              {[3, 5, 10, 15, 20].map(count => (
                <option key={count} value={count}>
                  {count} Questions
                </option>
              ))}
            </select>
          </div>

          {/* Generate Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleGenerateExplanation}
              disabled={loading || topic.trim().length === 0}
              className="bg-primary hover:bg-primary/90 disabled:bg-muted disabled:cursor-not-allowed text-primary-foreground font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <BookOpen className="w-4 h-4" />
                  Get Explanation
                </>
              )}
            </button>
            <button
              onClick={handleGeneratePracticeQuestions}
              disabled={loading || topic.trim().length === 0}
              className="bg-primary hover:bg-primary/90 disabled:bg-muted disabled:cursor-not-allowed text-primary-foreground font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Practice Questions
                </>
              )}
            </button>
          </div>

          {/* Tabs */}
          {(explanation || practiceQuestions) && (
            <div className="flex gap-2 border-b border-border">
              <button
                onClick={() => setActiveTab('explanation')}
                disabled={!explanation}
                className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 ${
                  activeTab === 'explanation'
                    ? 'text-primary border-primary'
                    : 'text-muted-foreground border-transparent hover:text-foreground disabled:opacity-50'
                }`}
              >
                📖 Explanation
              </button>
              <button
                onClick={() => setActiveTab('questions')}
                disabled={!practiceQuestions}
                className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 ${
                  activeTab === 'questions'
                    ? 'text-primary border-primary'
                    : 'text-muted-foreground border-transparent hover:text-foreground disabled:opacity-50'
                }`}
              >
                ✏️ Practice
              </button>
            </div>
          )}

          {/* Explanation Tab */}
          {activeTab === 'explanation' && explanation && (
            <div className="space-y-4 bg-muted/50 border border-border rounded-lg p-4">
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-2">Explanation: {explanation.topic}</h3>
                <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                  {explanation.explanation}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleCopyContent(explanation.explanation)}
                  className="p-2 bg-card hover:bg-card/80 border border-border rounded-lg transition-colors flex items-center justify-center gap-2 text-sm text-foreground"
                >
                  <Copy className="w-4 h-4" />
                  Copy
                </button>
                <button
                  onClick={() => handleDownloadContent(explanation.explanation, `explanation-${Date.now()}.txt`)}
                  className="p-2 bg-card hover:bg-card/80 border border-border rounded-lg transition-colors flex items-center justify-center gap-2 text-sm text-foreground"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
              </div>
            </div>
          )}

          {/* Questions Tab */}
          {activeTab === 'questions' && practiceQuestions && (
            <div className="space-y-4 bg-muted/50 border border-border rounded-lg p-4">
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-2">Practice Questions: {practiceQuestions.topic}</h3>
                <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                  {practiceQuestions.questions}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleCopyContent(practiceQuestions.questions)}
                  className="p-2 bg-card hover:bg-card/80 border border-border rounded-lg transition-colors flex items-center justify-center gap-2 text-sm text-foreground"
                >
                  <Copy className="w-4 h-4" />
                  Copy
                </button>
                <button
                  onClick={() => handleDownloadContent(practiceQuestions.questions, `practice-questions-${Date.now()}.txt`)}
                  className="p-2 bg-card hover:bg-card/80 border border-border rounded-lg transition-colors flex items-center justify-center gap-2 text-sm text-foreground"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
              </div>
            </div>
          )}

          {/* Save Form */}
          {showSaveForm && user && (explanation || practiceQuestions) && (
            <div className="space-y-3 bg-primary/5 border border-primary/20 rounded-lg p-4">
              <label className="block text-sm font-medium text-foreground">
                Session Notes (Optional)
              </label>
              <textarea
                value={sessionNotes}
                onChange={(e) => setSessionNotes(e.target.value)}
                placeholder="Add any notes about this learning session..."
                className="w-full h-20 p-2 bg-card border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm resize-none"
              />
              <button
                onClick={handleSaveSession}
                disabled={saving}
                className="w-full bg-primary hover:bg-primary/90 disabled:bg-muted disabled:cursor-not-allowed text-primary-foreground font-medium py-2 rounded-lg transition-colors text-sm flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Learning Session
                  </>
                )}
              </button>
            </div>
          )}

          {/* Clear Button */}
          {(explanation || practiceQuestions) && (
            <button
              onClick={handleClearAll}
              className="w-full p-2 bg-card hover:bg-card/80 border border-border rounded-lg transition-colors text-sm text-foreground font-medium"
            >
              Clear All
            </button>
          )}

          {/* Info Box */}
          {!explanation && !practiceQuestions && (
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
              <p className="text-sm text-foreground">
                <strong>💡 How it works:</strong> Enter a topic you want to learn about, select your grade level, and choose whether you want an explanation or practice questions. The AI tutor will provide personalized learning content!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
