import React, { useState, useRef } from 'react'
import { X, Send, Loader, Copy, Download, Save, AlertCircle } from 'lucide-react'
import { generateSummary, saveSummary, getSummaryHistory } from '../lib/summaryService'
import logger from '../lib/logger'

export default function SummaryModal({ isOpen, onClose, user }) {
  const [textInput, setTextInput] = useState('')
  const [summaryLength, setSummaryLength] = useState('medium')
  const [generatedSummary, setGeneratedSummary] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)
  const [summaryTitle, setSummaryTitle] = useState('')
  const [showSaveForm, setShowSaveForm] = useState(false)
  const [successMessage, setSuccessMessage] = useState(null)
  const textInputRef = useRef(null)

  const handleGenerateSummary = async () => {
    try {
      setError(null)
      setLoading(true)
      logger.info('📝 [SUMMARY_MODAL] Generating summary...', { length: summaryLength })

      const result = await generateSummary(textInput, summaryLength, user?.id)
      setGeneratedSummary(result)
      setShowSaveForm(true)
      logger.info('✅ [SUMMARY_MODAL] Summary generated successfully')
    } catch (err) {
      logger.error('❌ [SUMMARY_MODAL] Error generating summary:', err)
      setError(err.message || 'Failed to generate summary')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveSummary = async () => {
    try {
      if (!user) {
        setError('Please log in to save summaries')
        return
      }

      if (!summaryTitle.trim()) {
        setError('Please enter a title for this summary')
        return
      }

      setSaving(true)
      setError(null)
      logger.info('📝 [SUMMARY_MODAL] Saving summary...', summaryTitle)

      const summaryData = {
        user_id: user.id,
        title: summaryTitle,
        original_text: textInput,
        summary_text: generatedSummary.summary,
        summary_length: summaryLength,
        word_count_original: textInput.split(/\s+/).length,
        word_count_summary: generatedSummary.summary.split(/\s+/).length,
        compression_ratio: generatedSummary.compression_ratio,
        metadata: {
          generated_at: new Date().toISOString()
        }
      }

      await saveSummary(summaryData)
      setSuccessMessage('Summary saved successfully!')
      setTimeout(() => setSuccessMessage(null), 3000)
      logger.info('✅ [SUMMARY_MODAL] Summary saved successfully')
    } catch (err) {
      logger.error('❌ [SUMMARY_MODAL] Error saving summary:', err)
      setError(err.message || 'Failed to save summary')
    } finally {
      setSaving(false)
    }
  }

  const handleCopySummary = () => {
    if (generatedSummary?.summary) {
      navigator.clipboard.writeText(generatedSummary.summary)
      setSuccessMessage('Summary copied to clipboard!')
      setTimeout(() => setSuccessMessage(null), 2000)
      logger.info('✅ [SUMMARY_MODAL] Summary copied to clipboard')
    }
  }

  const handleDownloadSummary = () => {
    if (generatedSummary?.summary) {
      const element = document.createElement('a')
      const file = new Blob([generatedSummary.summary], { type: 'text/plain' })
      element.href = URL.createObjectURL(file)
      element.download = `summary-${Date.now()}.txt`
      document.body.appendChild(element)
      element.click()
      document.body.removeChild(element)
      logger.info('✅ [SUMMARY_MODAL] Summary downloaded')
    }
  }

  const handleClearAll = () => {
    setTextInput('')
    setGeneratedSummary(null)
    setSummaryTitle('')
    setShowSaveForm(false)
    setError(null)
    setSuccessMessage(null)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-border">
        {/* Header */}
        <div className="sticky top-0 bg-card border-b border-border p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">📄 Summary Tool</h2>
            <p className="text-sm text-muted-foreground mt-1">Summarize text with AI</p>
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
              Text to Summarize
            </label>
            <textarea
              ref={textInputRef}
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Paste your text here... (minimum 50 characters)"
              className="w-full h-32 p-4 bg-muted border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
            />
            <p className="text-xs text-muted-foreground">
              {textInput.length} characters
            </p>
          </div>

          {/* Summary Length Selection */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-foreground">
              Summary Length
            </label>
            <div className="grid grid-cols-3 gap-3">
              {['short', 'medium', 'long'].map(length => (
                <button
                  key={length}
                  onClick={() => setSummaryLength(length)}
                  className={`p-3 rounded-lg border transition-colors capitalize font-medium text-sm ${
                    summaryLength === length
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-muted border-border hover:border-primary/50 text-foreground'
                  }`}
                >
                  {length === 'short' && '2-3 Sentences'}
                  {length === 'medium' && '4-5 Sentences'}
                  {length === 'long' && '8-10 Sentences'}
                </button>
              ))}
            </div>
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerateSummary}
            disabled={loading || textInput.trim().length < 50}
            className="w-full bg-primary hover:bg-primary/90 disabled:bg-muted disabled:cursor-not-allowed text-primary-foreground font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Generate Summary
              </>
            )}
          </button>

          {/* Generated Summary */}
          {generatedSummary && (
            <div className="space-y-4 bg-muted/50 border border-border rounded-lg p-4">
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-2">Generated Summary</h3>
                <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                  {generatedSummary.summary}
                </p>
              </div>

              {/* Summary Stats */}
              <div className="grid grid-cols-3 gap-3 text-xs">
                <div className="bg-card border border-border rounded p-2">
                  <p className="text-muted-foreground">Original</p>
                  <p className="font-semibold text-foreground">{generatedSummary.original_length} chars</p>
                </div>
                <div className="bg-card border border-border rounded p-2">
                  <p className="text-muted-foreground">Summary</p>
                  <p className="font-semibold text-foreground">{generatedSummary.summary_length} chars</p>
                </div>
                <div className="bg-card border border-border rounded p-2">
                  <p className="text-muted-foreground">Compression</p>
                  <p className="font-semibold text-foreground">{generatedSummary.compression_ratio}</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={handleCopySummary}
                  className="p-2 bg-card hover:bg-card/80 border border-border rounded-lg transition-colors flex items-center justify-center gap-2 text-sm text-foreground"
                >
                  <Copy className="w-4 h-4" />
                  Copy
                </button>
                <button
                  onClick={handleDownloadSummary}
                  className="p-2 bg-card hover:bg-card/80 border border-border rounded-lg transition-colors flex items-center justify-center gap-2 text-sm text-foreground"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
                {user && (
                  <button
                    onClick={() => setShowSaveForm(!showSaveForm)}
                    className="p-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                  >
                    <Save className="w-4 h-4" />
                    Save
                  </button>
                )}
              </div>

              {/* Save Form */}
              {showSaveForm && user && (
                <div className="space-y-3 pt-3 border-t border-border">
                  <input
                    type="text"
                    value={summaryTitle}
                    onChange={(e) => setSummaryTitle(e.target.value)}
                    placeholder="Enter a title for this summary..."
                    className="w-full p-2 bg-card border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                  />
                  <button
                    onClick={handleSaveSummary}
                    disabled={saving || !summaryTitle.trim()}
                    className="w-full bg-primary hover:bg-primary/90 disabled:bg-muted disabled:cursor-not-allowed text-primary-foreground font-medium py-2 rounded-lg transition-colors text-sm flex items-center justify-center gap-2"
                  >
                    {saving ? (
                      <>
                        <Loader className="w-4 h-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save Summary'
                    )}
                  </button>
                </div>
              )}

              {/* Clear Button */}
              <button
                onClick={handleClearAll}
                className="w-full p-2 bg-card hover:bg-card/80 border border-border rounded-lg transition-colors text-sm text-foreground font-medium"
              >
                Clear All
              </button>
            </div>
          )}

          {/* Info Box */}
          {!generatedSummary && (
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
              <p className="text-sm text-foreground">
                <strong>💡 Tip:</strong> Paste any text you want to summarize. The AI will create a concise version based on your preferred length.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
