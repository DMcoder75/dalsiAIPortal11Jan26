import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import logger from '../lib/logger'
import { getAuthStatus, getApiKeyForRequest } from '../lib/authService'
import AuthModal from '../components/AuthModal'
import { smartGenerate, generateAIResponse } from '../lib/aiGenerationService'
import { checkRateLimit, recordRequest, getUsageStats, updateTrackerTier } from '../lib/rateLimitService'
import {
  Send, Plus, Menu, Settings, Bell, LogOut, Search, Trash2, Heart, Share2,
  Paperclip, Mic, Globe, Play, Image as ImageIcon, Download, Copy, ThumbsUp,
  ThumbsDown, MessageCircle, Zap, BookOpen, Code, Stethoscope, TrendingUp,
  Clock, AlertCircle, CheckCircle, Loader, X, ChevronDown, Sparkles, Crown,
  Archive, MoreVertical, Edit3, StopCircle, Upload, DollarSign, ChevronLeft
} from 'lucide-react'
import logo from '../assets/DalSiAILogo2.png'
import { AIModeResponseFormatter } from '../components/AIModeResponseFormatter'
import ConversationHistory from '../components/ConversationHistory'
import { checkFriction, logFrictionAction } from '../services/frictionAPI'
import { trackFunnelStep } from '../services/analyticsAPI'
import { logChatApiCall, logGuestApiCall, getClientIp } from '../services/apiLogging'
import {
  getUsageStatus,
  incrementGuestMessageCount,
  canGuestSendMessage,
  canUserSendMessage,
  getGuestMessageCount,
  fetchGuestLimit,
  fetchPlanLimits,
  getGuestLimit,
  clearGuestMessageCount
} from '../lib/usageTracking'
import * as dalsiAPI from '../lib/dalsiAPI'
import { cleanTextForDB } from '../lib/textCleaner'
import { getUserApiKey } from '../lib/apiKeyManager'
import { getGuestUserId } from '../lib/guestUser'
import {
  getUserConversations,
  getConversationMessages,
  createConversation,
  deleteConversation,
  saveMessage,
  generateConversationTitle
} from '../lib/conversationService'
import ImplementationSummaryResponse from '../components/ImplementationSummaryResponse'
import { callAIWithIntelligentContinuation, getChatIdForConversation, clearConversationChatId } from '../lib/intelligentApiCaller'
import { saveMessageWithMetadata } from '../lib/chatManagementService'
import { detectContinuation, referencesContext } from '../lib/continuationDetector'
import FrequentQueries from '../components/FrequentQueries'
import EmailWriterModal from '../components/EmailWriterModal'
import SummaryModal from '../components/SummaryModal'
import TranslatorModal from '../components/TranslatorModal'
import TutorModal from '../components/TutorModal'
import EditConversationModal from '../components/EditConversationModal'
import { updateConversationTitle, generateConversationTitle as generateTitle } from '../lib/conversationServiceEnhanced'
import { generateTitleFromMessage } from '../lib/guestConversationService'
import { deleteConversationWithCascade } from '../lib/deleteConversationService'
import { fetchConversations, fetchConversationMessages, deleteConversationAPI, invalidateConversationsCache, invalidateMessagesCache } from '../lib/chatAPI'

export default function Experience() {
  const { user, logout } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [rightSidebarOpen, setRightSidebarOpen] = useState(true)
  const [currentChat, setCurrentChat] = useState(null)
  const [messages, setMessages] = useState([])
  const [inputValue, setInputValue] = useState('')
  const [loading, setLoading] = useState(false)
  const [selectedModel, setSelectedModel] = useState('general')
  const [chatHistory, setChatHistory] = useState([])
  const [guestMessageCount, setGuestMessageCount] = useState(0)
  const [guestLimit, setGuestLimit] = useState(5)
  const [tokenCount, setTokenCount] = useState(0)
  const [suggestedPrompts, setSuggestedPrompts] = useState([])
  const [loadingPrompts, setLoadingPrompts] = useState(true)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [loadingConversations, setLoadingConversations] = useState(false)
  const [conversationEndpoint, setConversationEndpoint] = useState(null) // Track locked endpoint
  const [currentSessionId, setCurrentSessionId] = useState(null) // Persistent session ID for conversation
  const conversationChatIdsRef = useRef({}) // Track chat_id per conversation (using ref for immediate access)
  const messagesEndRef = useRef(null)
  const [showEmailWriterModal, setShowEmailWriterModal] = useState(false)
  const [showSummaryModal, setShowSummaryModal] = useState(false)
  const [showTranslatorModal, setShowTranslatorModal] = useState(false)
  const [showTutorModal, setShowTutorModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingConversation, setEditingConversation] = useState(null)
  const [isUpdatingTitle, setIsUpdatingTitle] = useState(false)

  const models = [
    { id: 'general', name: 'DalSiAI Chat', description: 'General AI Assistant' },
    { id: 'healthcare', name: 'Healthcare AI', description: 'Medical & Health' },
    { id: 'education', name: 'Education AI', description: 'Learning & Tutoring' },
    { id: 'code', name: 'Code Generation', description: 'Programming Help' },
    { id: 'weather', name: 'Weather Sense', description: 'Weather & Climate' }
  ]

  const templates = [
    { id: 'email', name: 'Email Writer', description: 'Professional emails', icon: '✉️' },
    { id: 'summary', name: 'Summary', description: 'Summarize text', icon: '📄' },
    { id: 'translator', name: 'Translator', description: 'Multi-language', icon: '🌐' },
    { id: 'tutor', name: 'Tutor', description: 'Learn anything', icon: '🎓' }
  ]

  const integrations = [
    { id: 'google-drive', name: 'Google Drive', connected: true, icon: '📁' },
    { id: 'slack', name: 'Slack', connected: false, icon: '💬' }
  ]

  // Load chat history, setup authentication, and initialize rate limits on mount
  useEffect(() => {
    const initializeApp = async () => {
      try {
        logger.info('🚀 [EXPERIENCE] Initializing application...')
        
        // Get current auth status
        const authStatus = await getAuthStatus()
        logger.info('🔐 [EXPERIENCE] Auth status:', authStatus.authType)
        
        // CRITICAL: Get API key and set it in dalsiAPI
        try {
          const authKey = await getApiKeyForRequest()
          if (authKey && authKey.value) {
            // authKey is { type: 'api-key'|'bearer', value: string }
            dalsiAPI.setApiKey(authKey.value)
            logger.info('✅ [EXPERIENCE] API key set for requests:', authKey.type)
          } else {
            logger.warn('⚠️ [EXPERIENCE] No API key available')
          }
        } catch (keyError) {
          logger.error('❌ [EXPERIENCE] Error getting API key:', keyError)
        }
        
        // Update rate limit tracker based on user tier
        if (authStatus.isAuthenticated && authStatus.user) {
          const tier = authStatus.user.subscription_tier || 'free'
          updateTrackerTier(tier)
          logger.info('📊 [EXPERIENCE] Rate limit tier updated to:', tier)
        } else {
          updateTrackerTier('free')
          logger.info('📊 [EXPERIENCE] Rate limit tier set to: free (guest)')
        }
        
        logger.info('✅ [EXPERIENCE] App initialization complete')
      } catch (error) {
        logger.error('❌ [EXPERIENCE] Error initializing app:', error)
      }
    }
    
    loadChatHistory()
    initializeApp()
    
    if (!user) {
      // Fetch guest limit from database
      fetchGuestLimit().then(() => {
        setGuestLimit(getGuestLimit())
        setGuestMessageCount(getGuestMessageCount())
      })
    } else {
      // Clear guest message count when user logs in
      clearGuestMessageCount()
    }
  }, [user])

  // Fetch suggested prompts from database using RPC
  useEffect(() => {
    const fetchSuggestedPrompts = async () => {
      try {
        setLoadingPrompts(true)
        const { data, error } = await supabase
          .rpc('get_text_based_prompts', { p_limit: 4 })

        if (error) throw error
        setSuggestedPrompts(data || [])
      } catch (error) {
        logger.error('Error fetching suggested prompts:', error)
        setSuggestedPrompts([])
      } finally {
        setLoadingPrompts(false)
      }
    }

    fetchSuggestedPrompts()
  }, [])

  const loadChatHistory = async () => {
    try {
      if (user) {
        setLoadingConversations(true)
        // Get JWT token from localStorage (user is authenticated via JWT, not Supabase)
        const jwtToken = localStorage.getItem('jwt_token')
        if (!jwtToken) {
          logger.warn('No JWT token found for loading conversations')
          return
        }
        // Use new API endpoint with caching
        const conversations = await fetchConversations(jwtToken)
        logger.info('✅ [EXPERIENCE] Loaded conversations:', conversations.length)
        setChatHistory(conversations || [])
      }
    } catch (error) {
      logger.error('❌ [EXPERIENCE] Error loading chat history:', error)
      setChatHistory([])
    } finally {
      setLoadingConversations(false)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleNewChat = async () => {
    try {
      if (user) {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) return
        const newConversation = await createConversation(user.id, session.access_token, 'New Conversation')
        if (newConversation) {
          setCurrentChat(newConversation)
          setMessages([])
          await loadChatHistory()
        }
      } else {
        setCurrentChat({ id: `guest-${Date.now()}`, title: 'New Conversation' })
        setMessages([])
      }
      trackFunnelStep('new_chat_created', { model: selectedModel })
    } catch (error) {
      logger.error('Error creating new chat:', error)
    }
  }

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return

    // TEST: Show formatted response on special command
    if (inputValue.toLowerCase() === '/test-formatted') {
      const userMessage = {
        id: `msg-${Date.now()}`,
        role: 'user',
        content: inputValue,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, userMessage])
      setInputValue('')
      const formattedResponse = {
        id: `msg-${Date.now()}-formatted`,
        role: 'assistant',
        content: <ImplementationSummaryResponse />,
        isComponent: true,
        timestamp: new Date()
      }
      setTimeout(() => {
        setMessages(prev => [...prev, formattedResponse])
      }, 500)
      return
    }

    // Check rate limits
    const rateLimitCheck = checkRateLimit()
    if (!rateLimitCheck.allowed) {
      logger.warn('⚠️ [EXPERIENCE] Rate limit exceeded:', rateLimitCheck.reason)
      const errorMessage = {
        id: `msg-${Date.now()}-error`,
        role: 'assistant',
        content: `⚠️ Rate limit: ${rateLimitCheck.reason}`,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
      return
    }

    // Check guest limit (legacy)
    if (!user) {
      if (!canGuestSendMessage(guestMessageCount, guestLimit)) {
        logFrictionAction('paywall_shown', 'guest_message_limit')
        alert(`You've reached your message limit (${guestLimit} messages). Please sign in to continue.`)
        return
      }
      incrementGuestMessageCount()
      setGuestMessageCount(prev => prev + 1)
    }

    const userMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: inputValue,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setLoading(true)

    try {
      // Track funnel step
      trackFunnelStep('message_sent', { model: selectedModel })

      logger.info('🚀 [EXPERIENCE] Sending message with model:', selectedModel)

      // Auto-create conversation with title from first message if needed
      let activeChat = currentChat
      if (!activeChat) {
        const generatedTitle = generateTitle(inputValue)
        if (user) {
          const { data: { session } } = await supabase.auth.getSession()
          if (session) {
            activeChat = await createConversation(user.id, session.access_token, generatedTitle)
            if (activeChat) {
              setCurrentChat(activeChat)
              await loadChatHistory()
            }
          }
        } else {
          activeChat = { id: `guest-${Date.now()}`, title: generatedTitle }
          setCurrentChat(activeChat)
        }
      }

      // Ensure we have a persistent session ID for this conversation
      let sessionId = currentSessionId || activeChat?.id
      if (!sessionId) {
        sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        setCurrentSessionId(sessionId)
        logger.info('🆔 [EXPERIENCE] Created new session ID:', sessionId)
      }

      // Smart continuation detection
      const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null
      const lastContent = lastMessage?.role === 'assistant' ? lastMessage.content : ''
      
      const continuationAnalysis = detectContinuation(inputValue, lastContent)
      const isContinuation = continuationAnalysis.isContinuation
      
      // DEBUG: Log the ref state before retrieval
      logger.debug('🔍 [EXPERIENCE] DEBUG - Ref state:', {
        refContent: conversationChatIdsRef.current,
        sessionId,
        lookupResult: conversationChatIdsRef.current[sessionId]
      })
      
      const storedChatId = isContinuation ? conversationChatIdsRef.current[sessionId] : null
      
      logger.debug('🔍 [EXPERIENCE] Continuation analysis:', {
        isContinuation,
        confidence: continuationAnalysis.confidence,
        reason: continuationAnalysis.reason,
        hasChatId: !!storedChatId,
        storedChatId: storedChatId || 'NOT FOUND'
      })
      
      // Use new AI generation service with auto-detection
      let response
      try {
        const shouldAutoDetect = !conversationEndpoint
        
        response = await smartGenerate(inputValue, {
          mode: 'chat',
          use_history: true,
          session_id: sessionId,
          autoDetect: shouldAutoDetect,
          forceEndpoint: conversationEndpoint,
          chat_id: storedChatId
        })
      } catch (apiError) {
        logger.error('❌ [EXPERIENCE] API error:', apiError)
        throw apiError
      }

      // Record successful request for rate limiting
      recordRequest()
      logger.info('✅ [EXPERIENCE] Request recorded for rate limiting')

      // Extract response data based on response structure
      let responseContent = ''
      let responseReferences = []
      let responseFollowups = []
      let responseMode = 'chat'

      logger.info('📊 [EXPERIENCE] Full API response:', response)
      
      // Store chat_id for this conversation if provided
      if (response.data?.chat_id) {
        conversationChatIdsRef.current[sessionId] = response.data.chat_id
        logger.info('💾 [EXPERIENCE] Stored chat_id for conversation:', response.data.chat_id)
        logger.debug('📊 [EXPERIENCE] Chat ID storage:', conversationChatIdsRef.current)
      }

      // Lock the endpoint for this conversation on first message
      if (!conversationEndpoint && response.category) {
        setConversationEndpoint(response.category)
        logger.info(`🔐 [EXPERIENCE] Locked conversation endpoint to: ${response.category}`)
      }

      if (response.data) {
        // Extract references from multiple possible locations
        responseReferences = response.data.references || response.data.sources || response.data.links || []
        
        // Extract followup questions from multiple possible locations
        responseFollowups = response.data.followup_questions || response.data.follow_up_questions || response.data.followups || []
        
        logger.info('📚 [EXPERIENCE] Extracted references:', responseReferences)
        logger.info('💡 [EXPERIENCE] Extracted followups:', responseFollowups)

        if (response.data.debate) {
          responseMode = 'debate'
          responseContent = response.data.debate
        } else if (response.data.structured_data) {
          responseMode = 'project'
          responseContent = response.data
        } else {
          responseContent = response.data.response || response.data
        }
      } else {
        responseContent = response
      }

      const assistantMessage = {
        id: `msg-${Date.now()}-response`,
        role: 'assistant',
        content: responseContent,
        mode: responseMode,
        references: responseReferences,
        followups: responseFollowups,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, assistantMessage])
      setTokenCount((response.tokens || 0))

      // Log API call
      if (user) {
        logChatApiCall(user.id, selectedModel, inputValue, JSON.stringify(responseContent))
      } else {
        logGuestApiCall('guest', selectedModel, inputValue, JSON.stringify(responseContent))
      }

      // Save to database if user is logged in
      if (user && activeChat) {
        await supabase.from('messages').insert([
          {
            chat_id: activeChat.id,
            role: 'user',
            content: cleanTextForDB(inputValue)
          },
          {
            chat_id: activeChat.id,
            role: 'assistant',
            content: cleanTextForDB(JSON.stringify(responseContent))
          }
        ])
      }
    } catch (error) {
      logger.error('❌ [EXPERIENCE] Error sending message:', error)
      const errorMessage = {
        id: `msg-${Date.now()}-error`,
        role: 'assistant',
        content: error.message || 'Sorry, there was an error processing your message. Please try again.',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteChat = async (chatId) => {
    if (!user) return
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      // Use new API endpoint for deletion
      const result = await deleteConversationAPI(chatId, session.access_token)
      if (result.success) {
        // Invalidate cache
        invalidateConversationsCache()
        invalidateMessagesCache(chatId)
        await loadChatHistory()
        if (currentChat?.id === chatId) {
          setCurrentChat(null)
          setMessages([])
        }
        logger.info('✅ [EXPERIENCE] Conversation deleted:', chatId)
      }
    } catch (error) {
      logger.error('❌ [EXPERIENCE] Error deleting chat:', error)
    }
  }

  const handleEditConversation = (conversation) => {
    setEditingConversation(conversation)
    setShowEditModal(true)
  }

  const handleSaveConversationTitle = async (conversationId, newTitle) => {
    if (!user) return
    try {
      setIsUpdatingTitle(true)
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      await updateConversationTitle(conversationId, session.access_token, newTitle)
      await loadChatHistory()
      if (currentChat?.id === conversationId) {
        setCurrentChat(prev => ({ ...prev, title: newTitle }))
      }
      setShowEditModal(false)
      setEditingConversation(null)
    } catch (error) {
      logger.error('Error updating conversation title:', error)
    } finally {
      setIsUpdatingTitle(false)
    }
  }

  const handleSelectConversation = async (id) => {
    const conversation = chatHistory.find(c => c.id === id)
    if (conversation) {
      setCurrentChat(conversation)
      setMessages([])
      setLoading(true)
      try {
        if (user) {
          // Get JWT token from localStorage
          const jwtToken = localStorage.getItem('jwt_token')
          if (jwtToken) {
            // Use new API endpoint with caching
            const conversationMessages = await fetchConversationMessages(id, jwtToken)
            const formattedMessages = conversationMessages.map(msg => ({
              id: msg.id,
              role: msg.role,
              content: msg.content,
              timestamp: new Date(msg.created_at)
            }))
            setMessages(formattedMessages)
            logger.info('✅ [EXPERIENCE] Loaded conversation messages:', formattedMessages.length)
          }
        }
      } catch (error) {
        logger.error('❌ [EXPERIENCE] Error loading conversation messages:', error)
      } finally {
        setLoading(false)
      }
    }
  }

  const selectedModelObj = models.find(m => m.id === selectedModel)

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      {/* Left Sidebar */}
      <div className={`${sidebarOpen ? 'w-56' : 'w-0'} bg-card border-r border-border flex flex-col transition-all duration-300 overflow-hidden`}>
        {/* Logo & Branding */}
        <div className="p-6 border-b border-border">
          <a href="/" className="flex items-center gap-3 mb-6 hover:opacity-80 transition-opacity cursor-pointer">
            <img src={logo} alt="DalSiAI" className="h-10 w-10" />
            <div>
              <span className="text-lg font-bold text-foreground">DalSiAI</span>
              <p className="text-xs text-muted-foreground">AI & Automations</p>
            </div>
          </a>

          {/* New Conversation Button */}
          <button
            onClick={handleNewChat}
            className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 px-4 rounded-lg transition-all duration-200 shadow-lg hover:shadow-lg"
          >
            <Plus className="w-5 h-5" />
            New Conversation
          </button>
        </div>

        {/* Chat History */}
        <div className="flex-1 overflow-y-auto p-4">
          <ConversationHistory
            conversations={chatHistory}
            currentChatId={currentChat?.id}
            onSelectConversation={handleSelectConversation}
            onDeleteConversation={handleDeleteChat}
            onEditConversation={handleEditConversation}
            isLoading={loadingConversations}
          />
        </div>
        
        {/* Frequent Queries Section - Outside scroll container */}
        <FrequentQueries 
          onQuerySelect={(query) => {
            setInputValue(query)
            setTimeout(() => {
              const inputElement = document.querySelector('textarea[placeholder*="Ask"]')
              if (inputElement) inputElement.focus()
            }, 100)
          }}
        />

        {/* User Profile / Auth Section */}
        <div className="p-4 border-t border-border">
          {user ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                  {user.user_metadata?.first_name?.[0]?.toUpperCase() || user.email?.[0].toUpperCase() || 'U'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate text-foreground">{user.user_metadata?.first_name || user.email || 'User'}</p>
                  <p className="text-xs text-muted-foreground">Pro Plan</p>
                </div>
              </div>
              <button
                onClick={logout}
                className="w-full flex items-center justify-center gap-2 bg-muted hover:bg-muted/80 text-foreground text-sm font-medium transition-colors py-2 rounded-lg"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="text-center">
                <p className="text-sm font-medium text-foreground mb-3">Guest User</p>
                <p className="text-xs text-muted-foreground mb-4">Sign in to save your conversations</p>
              </div>
              <button 
                onClick={() => setShowAuthModal(true)}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-2 px-4 rounded-lg transition-all duration-200 text-sm"
              >
                Sign In
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="h-16 border-b border-border flex items-center justify-between px-6 bg-background/50 backdrop-blur">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 hover:bg-muted rounded-lg transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <button className="px-4 py-2 bg-card hover:bg-card/80 rounded-lg text-sm font-medium transition-colors border border-border">
                {selectedModelObj?.name || 'Select Model'}
              </button>
              <button className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Change Model
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="relative p-2 hover:bg-muted rounded-lg transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full"></span>
            </button>
            <button className="p-2 hover:bg-muted rounded-lg transition-colors">
              <Settings className="w-5 h-5" />
            </button>
            {!user && (
              <button 
                onClick={() => setShowAuthModal(true)}
                className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-sm font-medium transition-all"
              >
                Sign In
              </button>
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto flex flex-col items-center p-8">
          {/* Small Logo - Always Visible */}
          <div className="w-12 h-12 mx-auto mb-6">
            <img src={logo} alt="DalSiAI" className="w-full h-full object-contain" />
          </div>
          
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center flex-1 text-center max-w-2xl">
              <h2 className="text-4xl font-bold mb-4 text-foreground">How can I help you today?</h2>
              <p className="text-muted-foreground text-lg mb-8">Choose a model or start typing your question</p>

              {/* Suggested Prompts Section */}
              {!loadingPrompts && suggestedPrompts.length > 0 && (
                <div className="w-full mb-6 max-w-3xl">
                  <h3 className="text-left text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Suggested Prompts</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {suggestedPrompts.map(prompt => (
                      <button
                        key={prompt.id}
                        onClick={() => setInputValue(prompt.prompt_text)}
                        className="p-2 bg-card hover:bg-card/80 rounded-lg text-left transition-all border border-border hover:border-primary/50 hover:shadow-lg group"
                      >
                        <div className="flex items-start gap-2">
                          <span className="text-xl flex-shrink-0 group-hover:scale-110 transition-transform">
                            {prompt.icon_name || '✨'}
                          </span>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-foreground text-sm group-hover:text-primary transition-colors">{prompt.title}</h4>
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{prompt.description}</p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Action Buttons */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <button className="p-4 bg-card hover:bg-card/80 rounded-lg flex flex-col items-center gap-2 transition-colors border border-border hover:border-primary/50">
                  <Paperclip className="w-6 h-6 text-primary" />
                  <span className="text-sm text-foreground">Attach</span>
                </button>
                <button className="p-4 bg-card hover:bg-card/80 rounded-lg flex flex-col items-center gap-2 transition-colors border border-border hover:border-primary/50">
                  <Mic className="w-6 h-6 text-primary" />
                  <span className="text-sm text-foreground">Voice</span>
                </button>
                <button className="p-4 bg-card hover:bg-card/80 rounded-lg flex flex-col items-center gap-2 transition-colors border border-border hover:border-primary/50">
                  <Globe className="w-6 h-6 text-primary" />
                  <span className="text-sm text-foreground">Web Search</span>
                </button>
                <button className="p-4 bg-card hover:bg-card/80 rounded-lg flex flex-col items-center gap-2 transition-colors border border-border hover:border-primary/50">
                  <ImageIcon className="w-6 h-6 text-primary" />
                  <span className="text-sm text-foreground">Image</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="w-full max-w-4xl space-y-4">
              {messages.map(msg => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-2xl px-6 py-4 rounded-lg ${
                      msg.role === 'user'
                        ? 'bg-primary text-primary-foreground shadow-lg'
                        : 'bg-card border border-border'
                    }`}
                  >
                    {msg.role === 'user' ? (
                      <p className="text-sm leading-relaxed">{msg.content}</p>
                    ) : (
                      <AIModeResponseFormatter
                        mode={msg.mode || 'chat'}
                        response={msg.content}
                        references={msg.references}
                        followups={msg.followups}
                        onFollowupClick={(followupQuestion) => {
                          logger.info('🔗 [EXPERIENCE] Followup clicked:', followupQuestion)
                          
                          // Use smart continuation detection for followup
                          const lastMsg = messages.length > 0 ? messages[messages.length - 1] : null
                          const lastAIContent = lastMsg?.role === 'assistant' ? lastMsg.content : ''
                          const followupAnalysis = detectContinuation(followupQuestion, lastAIContent)
                          
                          logger.info('📊 [EXPERIENCE] Followup analysis:', {
                            question: followupQuestion,
                            isContinuation: followupAnalysis.isContinuation,
                            confidence: followupAnalysis.confidence
                          })
                          
                          // Set input and send
                          setInputValue(followupQuestion)
                          setTimeout(() => {
                            // Simulate sending by calling handleSendMessage
                            const sendBtn = document.querySelector('[data-send-followup="true"]')
                            if (sendBtn) {
                              sendBtn.click()
                            }
                          }, 50)
                        }}
                      />
                    )}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-card border border-border px-6 py-4 rounded-lg">
                    <div className="flex gap-2">
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="border-t border-border bg-background/50 backdrop-blur p-6">
          <div className="max-w-4xl mx-auto">
            {!user && (
              <div className="mb-4 p-4 bg-primary/10 border border-primary/30 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-foreground">Guest: {guestMessageCount}/{guestLimit} messages</p>
                  <p className="text-xs text-muted-foreground">Sign in to get unlimited messages</p>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={inputValue}
                  onChange={e => setInputValue(e.target.value)}
                  onKeyPress={e => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                  placeholder="Ask anything... (Shift + Enter for new line)"
                  className="w-full bg-card border border-border rounded-lg px-4 py-3 text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-colors"
                />
                <button className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                  😊
                </button>
              </div>
              <button
                onClick={handleSendMessage}
                disabled={loading || !inputValue.trim()}
                data-send-followup="true"
                className="bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-primary-foreground font-semibold p-3 rounded-lg transition-all duration-200 shadow-lg hover:shadow-lg"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
              <span>Token: {tokenCount} / 128K</span>
              <span>DalSiAI can make mistakes. Consider checking important information.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Sidebar */}
      <div className={`${rightSidebarOpen ? 'w-64' : 'w-0'} bg-card border-l border-border flex flex-col transition-all duration-300 overflow-hidden`}>
        <div className="p-6 border-b border-border flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">Quick Actions</h3>
          <button
            onClick={() => setRightSidebarOpen(false)}
            className="lg:hidden p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* Templates */}
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-4">Templates</p>
            <div className="space-y-3">
              {templates.map(template => (
                <button
                  key={template.id}
                  onClick={() => {
                    if (template.id === 'email') setShowEmailWriterModal(true)
                    if (template.id === 'summary') setShowSummaryModal(true)
                    if (template.id === 'translator') setShowTranslatorModal(true)
                    if (template.id === 'tutor') setShowTutorModal(true)
                  }}
                  className="w-full p-4 bg-card hover:bg-card/80 rounded-lg text-left transition-colors group border border-border hover:border-primary/50"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl flex-shrink-0">{template.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">{template.name}</p>
                      <p className="text-xs text-muted-foreground">{template.description}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Integrations */}
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-4">Integrations</p>
            <div className="space-y-3">
              {integrations.map(integration => (
                <button
                  key={integration.id}
                  className="w-full p-4 bg-card hover:bg-card/80 rounded-lg text-left transition-colors group border border-border hover:border-primary/50"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{integration.icon}</span>
                      <div>
                        <p className="text-sm font-medium text-foreground">{integration.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {integration.connected ? (
                            <span className="text-green-500">Connected</span>
                          ) : (
                            <span>Not connected</span>
                          )}
                        </p>
                      </div>
                    </div>
                    {integration.connected && (
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Auth Modal */}
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)}
      />

      {/* Email Writer Modal */}
      <EmailWriterModal
        isOpen={showEmailWriterModal}
        onClose={() => setShowEmailWriterModal(false)}
        user={user}
      />

      {/* Summary Modal */}
      <SummaryModal
        isOpen={showSummaryModal}
        onClose={() => setShowSummaryModal(false)}
        user={user}
      />

      {/* Translator Modal */}
      <TranslatorModal
        isOpen={showTranslatorModal}
        onClose={() => setShowTranslatorModal(false)}
        user={user}
      />

      {/* Tutor Modal */}
      <TutorModal
        isOpen={showTutorModal}
        onClose={() => setShowTutorModal(false)}
        user={user}
      />

      {/* Edit Conversation Modal */}
      <EditConversationModal
        isOpen={showEditModal}
        conversation={editingConversation}
        onClose={() => {
          setShowEditModal(false)
          setEditingConversation(null)
        }}
        onSave={handleSaveConversationTitle}
        isLoading={isUpdatingTitle}
      />
    </div>
  )
}
