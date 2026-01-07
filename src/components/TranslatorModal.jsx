import React, { useState, useRef } from 'react'
import { X, Send, Loader, Copy, Download, Save, AlertCircle, Volume2 } from 'lucide-react'
import { translateText, saveTranslation, SUPPORTED_LANGUAGES } from '../lib/translatorService'
import logger from '../lib/logger'

export default function TranslatorModal({ isOpen, onClose, user }) {
  const [textInput, setTextInput] = useState('')
  const [targetLanguage, setTargetLanguage] = useState('es')
  const [translatedText, setTranslatedText] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)
  const [translationTitle, setTranslationTitle] = useState('')
  const [showSaveForm, setShowSaveForm] = useState(false)
  const [successMessage, setSuccessMessage] = useState(null)
  const textInputRef = useRef(null)

  const handleTranslate = async () => {
    try {
      setError(null)
      setLoading(true)
      logger.info('🌐 [TRANSLATOR_MODAL] Translating to:', targetLanguage)

      const result = await translateText(textInput, targetLanguage, user?.id)
      setTranslatedText(result)
      setShowSaveForm(true)
      logger.info('✅ [TRANSLATOR_MODAL] Translation completed successfully')
    } catch (err) {
      logger.error('❌ [TRANSLATOR_MODAL] Error translating:', err)
      setError(err.message || 'Failed to translate text')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveTranslation = async () => {
    try {
      if (!user) {
        setError('Please log in to save translations')
        return
      }

      if (!translationTitle.trim()) {
        setError('Please enter a title for this translation')
        return
      }

      setSaving(true)
      setError(null)
      logger.info('🌐 [TRANSLATOR_MODAL] Saving translation...', translationTitle)

      const translationData = {
        user_id: user.id,
        title: translationTitle,
        original_text: textInput,
        translated_text: translatedText.translated_text,
        source_language: translatedText.source_language,
        target_language: translatedText.target_language,
        target_language_name: translatedText.target_language_name,
        metadata: {
          translated_at: new Date().toISOString()
        }
      }

      await saveTranslation(translationData)
      setSuccessMessage('Translation saved successfully!')
      setTimeout(() => setSuccessMessage(null), 3000)
      logger.info('✅ [TRANSLATOR_MODAL] Translation saved successfully')
    } catch (err) {
      logger.error('❌ [TRANSLATOR_MODAL] Error saving translation:', err)
      setError(err.message || 'Failed to save translation')
    } finally {
      setSaving(false)
    }
  }

  const handleCopyTranslation = () => {
    if (translatedText?.translated_text) {
      navigator.clipboard.writeText(translatedText.translated_text)
      setSuccessMessage('Translation copied to clipboard!')
      setTimeout(() => setSuccessMessage(null), 2000)
      logger.info('✅ [TRANSLATOR_MODAL] Translation copied to clipboard')
    }
  }

  const handleDownloadTranslation = () => {
    if (translatedText?.translated_text) {
      const element = document.createElement('a')
      const file = new Blob([translatedText.translated_text], { type: 'text/plain' })
      element.href = URL.createObjectURL(file)
      element.download = `translation-${Date.now()}.txt`
      document.body.appendChild(element)
      element.click()
      document.body.removeChild(element)
      logger.info('✅ [TRANSLATOR_MODAL] Translation downloaded')
    }
  }

  const handleSpeakTranslation = () => {
    if (translatedText?.translated_text && 'speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(translatedText.translated_text)
      
      // Set language based on target language code
      const langMap = {
        'es': 'es-ES',
        'fr': 'fr-FR',
        'de': 'de-DE',
        'it': 'it-IT',
        'pt': 'pt-PT',
        'ru': 'ru-RU',
        'ja': 'ja-JP',
        'ko': 'ko-KR',
        'zh': 'zh-CN',
        'ar': 'ar-SA',
        'hi': 'hi-IN',
        'tr': 'tr-TR',
        'pl': 'pl-PL',
        'nl': 'nl-NL',
        'vi': 'vi-VN',
        'th': 'th-TH',
        'id': 'id-ID'
      }
      
      utterance.lang = langMap[targetLanguage] || 'en-US'
      window.speechSynthesis.speak(utterance)
      logger.info('✅ [TRANSLATOR_MODAL] Playing translation audio')
    }
  }

  const handleClearAll = () => {
    setTextInput('')
    setTranslatedText(null)
    setTranslationTitle('')
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
            <h2 className="text-2xl font-bold text-foreground">🌐 Translator</h2>
            <p className="text-sm text-muted-foreground mt-1">Translate text to multiple languages</p>
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
              Text to Translate
            </label>
            <textarea
              ref={textInputRef}
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Paste your text here..."
              className="w-full h-32 p-4 bg-muted border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
            />
            <p className="text-xs text-muted-foreground">
              {textInput.length} characters
            </p>
          </div>

          {/* Language Selection */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-foreground">
              Target Language
            </label>
            <select
              value={targetLanguage}
              onChange={(e) => setTargetLanguage(e.target.value)}
              className="w-full p-3 bg-muted border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              {SUPPORTED_LANGUAGES.map(lang => (
                <option key={lang.code} value={lang.code}>
                  {lang.name}
                </option>
              ))}
            </select>
          </div>

          {/* Translate Button */}
          <button
            onClick={handleTranslate}
            disabled={loading || textInput.trim().length === 0}
            className="w-full bg-primary hover:bg-primary/90 disabled:bg-muted disabled:cursor-not-allowed text-primary-foreground font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                Translating...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Translate
              </>
            )}
          </button>

          {/* Translated Text */}
          {translatedText && (
            <div className="space-y-4 bg-muted/50 border border-border rounded-lg p-4">
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-2">
                  Translation to {translatedText.target_language_name}
                </h3>
                <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                  {translatedText.translated_text}
                </p>
              </div>

              {/* Translation Stats */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-card border border-border rounded p-2">
                  <p className="text-muted-foreground">Original</p>
                  <p className="font-semibold text-foreground">{translatedText.original_length} chars</p>
                </div>
                <div className="bg-card border border-border rounded p-2">
                  <p className="text-muted-foreground">Translated</p>
                  <p className="font-semibold text-foreground">{translatedText.translated_length} chars</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-4 gap-2">
                <button
                  onClick={handleCopyTranslation}
                  className="p-2 bg-card hover:bg-card/80 border border-border rounded-lg transition-colors flex items-center justify-center gap-1 text-xs text-foreground"
                  title="Copy to clipboard"
                >
                  <Copy className="w-4 h-4" />
                  Copy
                </button>
                <button
                  onClick={handleDownloadTranslation}
                  className="p-2 bg-card hover:bg-card/80 border border-border rounded-lg transition-colors flex items-center justify-center gap-1 text-xs text-foreground"
                  title="Download as text file"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
                <button
                  onClick={handleSpeakTranslation}
                  className="p-2 bg-card hover:bg-card/80 border border-border rounded-lg transition-colors flex items-center justify-center gap-1 text-xs text-foreground"
                  title="Listen to translation"
                >
                  <Volume2 className="w-4 h-4" />
                  Speak
                </button>
                {user && (
                  <button
                    onClick={() => setShowSaveForm(!showSaveForm)}
                    className="p-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors flex items-center justify-center gap-1 text-xs font-medium"
                    title="Save translation"
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
                    value={translationTitle}
                    onChange={(e) => setTranslationTitle(e.target.value)}
                    placeholder="Enter a title for this translation..."
                    className="w-full p-2 bg-card border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                  />
                  <button
                    onClick={handleSaveTranslation}
                    disabled={saving || !translationTitle.trim()}
                    className="w-full bg-primary hover:bg-primary/90 disabled:bg-muted disabled:cursor-not-allowed text-primary-foreground font-medium py-2 rounded-lg transition-colors text-sm flex items-center justify-center gap-2"
                  >
                    {saving ? (
                      <>
                        <Loader className="w-4 h-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save Translation'
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
          {!translatedText && (
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
              <p className="text-sm text-foreground">
                <strong>💡 Tip:</strong> Paste text and select a target language. The AI will translate it accurately while preserving the meaning and context.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
