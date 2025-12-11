// DalSi API Service - Updated for NeoDalsi API
class DalSiAPIService {
  constructor() {
    // New unified API endpoint
    this.apiEndpoint = 'https://api.neodalsi.com'
    this.defaultMaxLength = 800
    this.freeUsageLimit = 2 // Free interactions before subscription required
    
    this.models = {
      'dalsi-ai': {
        name: 'DalSiAI',
        type: 'text',
        requiresSubscription: false,
        freeUsageLimit: this.freeUsageLimit,
        capabilities: ['text_generation', 'code_generation'],
        description: 'Advanced text-based AI for conversations, coding, and analysis'
      },
      'dalsi-ai-health': {
        name: 'DalSiAI - Healthcare',
        type: 'text',
        requiresSubscription: false,
        freeUsageLimit: this.freeUsageLimit,
        capabilities: ['healthcare_queries', 'medical_information'],
        description: 'Specialized AI for healthcare and medical queries'
      },
      'dalsi-ai-weather': {
        name: 'DalSiAI - Weather',
        type: 'text',
        requiresSubscription: false,
        freeUsageLimit: this.freeUsageLimit,
        capabilities: ['weather_queries', 'climate_information'],
        description: 'Specialized AI for weather and meteorological queries'
      }
    }
  }

  // Health check for API
  async healthCheck(modelId = 'dalsi-ai') {
    try {
      const model = this.models[modelId]
      if (!model) throw new Error(`Unknown model: ${modelId}`)

      const response = await fetch(`${this.apiEndpoint}/v1/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      if (!response.ok) {
        throw new Error(`Health check failed: ${response.status}`)
      }

      const data = await response.json()
      return {
        model_loaded: data.model_loaded || data.status === 'healthy',
        status: data.status || (data.model_loaded ? 'healthy' : 'unhealthy'),
        model: modelId
      }
    } catch (error) {
      console.error(`Health check failed for ${modelId}:`, error)
      return {
        model_loaded: false,
        status: 'error',
        model: modelId,
        error: error.message
      }
    }
  }

  // Check if user has access to a specific model based on usage and subscription
  async checkModelAccess(modelId, userUsageCount = 0, userSubscription = null) {
    const model = this.models[modelId]
    if (!model) return { hasAccess: false, reason: 'Model not found' }

    // For all models: Allow free usage up to limit, then require subscription
    if (userUsageCount < model.freeUsageLimit) {
      return { 
        hasAccess: true, 
        remainingFreeUses: model.freeUsageLimit - userUsageCount,
        isFreeUsage: true
      }
    }
    
    // After free limit, check subscription
    if (!userSubscription || userSubscription.status !== 'active') {
      return { 
        hasAccess: false, 
        reason: 'Free usage limit exceeded. Subscription required.',
        upgradeRequired: true,
        usedFreeUses: userUsageCount
      }
    }
    
    return { hasAccess: true, isFreeUsage: false }
  }

  // Generate text using the API
  async generateText(modelId = 'dalsi-ai', prompt, options = {}) {
    try {
      const model = this.models[modelId]
      if (!model) throw new Error(`Unknown model: ${modelId}`)

      const payload = {
        prompt,
        model: modelId,
        max_tokens: options.maxLength || this.defaultMaxLength,
        use_history: options.useHistory !== false,
        response_length: options.responseLength || 'medium'
      }

      const response = await fetch(`${this.apiEndpoint}/v1/text/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(options.apiKey && { 'X-API-Key': options.apiKey }),
          ...(options.authToken && { 'Authorization': `Bearer ${options.authToken}` })
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()
      return {
        success: true,
        response: data.response || data.text || '',
        model: modelId,
        sources: data.sources || []
      }
    } catch (error) {
      console.error(`Text generation failed for ${modelId}:`, error)
      return {
        success: false,
        error: error.message,
        model: modelId
      }
    }
  }

  // Stream text generation using Server-Sent Events
  async streamText(modelId = 'dalsi-ai', prompt, onToken, onComplete, onError, options = {}) {
    try {
      const model = this.models[modelId]
      if (!model) throw new Error(`Unknown model: ${modelId}`)

      const payload = {
        prompt,
        model: modelId,
        max_tokens: options.maxLength || this.defaultMaxLength,
        use_history: options.useHistory !== false,
        response_length: options.responseLength || 'medium'
      }

      const response = await fetch(`${this.apiEndpoint}/v1/text/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(options.apiKey && { 'X-API-Key': options.apiKey }),
          ...(options.authToken && { 'Authorization': `Bearer ${options.authToken}` })
        },
        body: JSON.stringify(payload),
        signal: options.abortSignal
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      // Handle streaming response
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let fullResponse = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              if (data.token) {
                fullResponse += data.token
                if (onToken) onToken(data.token)
              }
            } catch (e) {
              // Ignore parsing errors
            }
          }
        }
      }

      if (onComplete) {
        onComplete(fullResponse)
      }

      return { success: true, response: fullResponse }
    } catch (error) {
      console.error(`Stream generation failed for ${modelId}:`, error)
      if (onError) onError(error)
      return { success: false, error: error.message }
    }
  }

  // Get available models
  getAvailableModels() {
    return Object.entries(this.models).map(([id, model]) => ({
      id,
      ...model
    }))
  }

  // Get model info
  getModelInfo(modelId) {
    return this.models[modelId] || null
  }
}

// Export singleton instance
export default new DalSiAPIService()
