// Dalsi AI API Integration Layer

// API endpoints for DalSi AI models
// New unified API endpoint
const NEW_API_URL = 'https://api.neodalsi.com'

// Legacy endpoints (for backward compatibility)
const DALSIAI_URL = 'https://dalsiai-106681824395.asia-south2.run.app'
const DALSIAIVI_URL = 'https://dalsiaivi-service-594985777520.asia-south2.run.app'

// API key for authentication (will be set from user's API key)
let currentApiKey = null

/**
 * Set the API key for authenticated requests
 */
export const setApiKey = (apiKey) => {
  currentApiKey = apiKey
}

/**
 * Get current API key
 */
export const getApiKey = () => {
  return currentApiKey
}

/**
 * Get available models based on subscription
 */
export const getAvailableModels = (subscription) => {
  const baseModels = [
    {
      id: 'dalsi-ai',
      name: 'DalSi AI',
      description: 'Text-based AI model for healthcare, education, and general AI assistance',
      free: true,
      url: DALSIAI_URL
    },
    {
      id: 'dalsi-ai-health',
      name: 'DalSi AI - Healthcare',
      description: 'Specialized AI model for clinical, medical, and healthcare-related queries.',
      free: true,
      url: DALSIAI_URL // Assuming the same base URL but with a different prompt/persona
    },
    {
      id: 'dalsi-ai-edu',
      name: 'DalSi AI - Education',
      description: 'Specialized AI model for academic, curriculum, and educational queries.',
      free: true,
      url: DALSIAI_URL // Assuming the same base URL but with a different prompt/persona
    }
  ]

  if (subscription && subscription.status === 'active') {
    baseModels.push({
      id: 'dalsi-aivi',
      name: 'DalSi AI-Vi',
      description: 'Multimodal Phi-3 Vision model for text and image analysis',
      free: false,
      url: DALSIAIVI_URL
    })
  }

  return baseModels
}

/**
 * Check if user has access to a model
 */
export const checkModelAccess = async (modelId, usageCount, subscription) => {
  if (modelId === 'dalsi-ai' || modelId === 'dalsi-ai-health' || modelId === 'dalsi-ai-edu') {
    return { hasAccess: true }
  }

  if (modelId === 'dalsi-aivi') {
    if (!subscription || subscription.status !== 'active') {
      return {
        hasAccess: false,
        reason: 'DalSi AI-Vi requires a subscription. Upgrade to access vision capabilities!',
        upgradeRequired: true
      }
    }
  }

  return { hasAccess: true }
}

/**
 * Get API URL for a model
 */
const getModelUrl = (modelId) => {
  // All text-based models currently use the same base URL, but we can differentiate the prompt later
  if (modelId === 'dalsi-aivi') return DALSIAIVI_URL
  return DALSIAI_URL
}

/**
 * Health check for API
 */
export const checkAPIHealth = async (modelId) => {
  try {
    // Try new API first if API key is available
    if (currentApiKey) {
      try {
        const response = await fetch(`${NEW_API_URL}/dalsiai/health`, {
          method: 'GET',
          headers: {
            'X-API-Key': currentApiKey
          }
        })
        
        if (response.ok) {
          const data = await response.json()
          return {
            status: 'healthy',
            model_loaded: data.model_loaded || true,
            ...data
          }
        }
      } catch (error) {
        console.warn('New API health check failed, falling back to legacy API:', error)
      }
    }
    
    // Fallback to legacy API
    const baseUrl = getModelUrl(modelId)
    const response = await fetch(`${baseUrl}/health`, {
      method: 'GET'
    })
    
    if (response.ok) {
      const data = await response.json()
      return {
        status: 'healthy',
        model_loaded: data.model_loaded || true,
        ...data
      }
    }
  } catch (error) {
    console.error(`Health check failed for ${modelId}:`, error)
  }
  
  return {
    status: 'unhealthy',
    model_loaded: false
  }
}

/**
 * Preprocess message before sending to AI
 * Builds conversation context from message history
 */
export const preprocessMessage = (message, messageHistory, modelId) => {
  if (!messageHistory || messageHistory.length === 0) {
    return message
  }

  // Determine system prompt based on modelId
  let systemPrompt = "You are a helpful and professional AI assistant. Your responses should be clear, concise, and accurate."
  if (modelId === 'dalsi-ai-health') {
    systemPrompt = "You are a specialized AI assistant for healthcare. Provide information based on clinical and medical knowledge. Always advise the user to consult a professional for medical advice."
  } else if (modelId === 'dalsi-ai-edu') {
    systemPrompt = "You are a specialized AI assistant for education. Provide information based on academic and curriculum knowledge. Structure your responses for clarity and learning."
  }

  // Build conversation context from recent messages
  // Format: "User: message\nAI: response\nUser: message\n..."
  const contextLines = [`System: ${systemPrompt}`]
  
  for (const msg of messageHistory) {
    if (msg.sender === 'user') {
      contextLines.push(`User: ${msg.content}`)
    } else if (msg.sender === 'ai') {
      contextLines.push(`AI: ${msg.content}`)
    }
  }

  // Add the new user message
  contextLines.push(`User: ${message}`)
  
  // Add instruction for AI to continue the conversation
  contextLines.push('AI:')

  return contextLines.join('\n')
}

/**
 * Convert image file to data URL
 */
export const imageToDataUrl = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

/**
 * Validate image file
 */
export const validateImageFile = (file) => {
  const maxSize = 5 * 1024 * 1024 // 5MB
  const allowedTypes = ['image/png', 'image/jpeg', 'image/gif', 'image/webp']

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Invalid file type. Please upload PNG, JPEG, GIF, or WebP'
    }
  }

  if (file.size > maxSize) {
    return {
      valid: false,
      error: 'File too large. Maximum size is 5MB'
    }
  }

  return { valid: true }
}

/**
 * Stream text generation from AI using Server-Sent Events
 */
export const streamGenerateText = async (
  message,
  imageDataUrl,
  onToken,
  onComplete,
  onError,
  modelId = 'dalsi-ai',
  maxLength = 500,
  abortSignal = null
) => {
  let reader = null
  
  try {
    // Use new API if API key is available, otherwise fall back to legacy API
    const useNewApi = !!currentApiKey
    let endpoint = useNewApi ? `${NEW_API_URL}/dalsiai/generate` : `${getModelUrl(modelId)}/stream`
    
    // Prepare request payload
    const payload = useNewApi ? {
      prompt: message,
      use_history: true,
      response_length: 'medium',
      max_tokens: maxLength || 2048
    } : {
      message: message,
      max_length: maxLength
    }

    // Add image data for vision model (legacy API only)
    if (imageDataUrl && modelId === 'dalsi-aivi' && !useNewApi) {
      payload.image_data_url = imageDataUrl
    }

    // Prepare headers
    const headers = {
      'Content-Type': 'application/json',
    }
    
    if (useNewApi && currentApiKey) {
      headers['X-API-Key'] = currentApiKey
    }

    // Make streaming request with abort signal
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(payload),
      signal: abortSignal
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`API error: ${response.status} - ${errorText}`)
    }

    // Process Server-Sent Events stream
    reader = response.body.getReader()
    const decoder = new TextDecoder('utf-8', { fatal: false, ignoreBOM: true })
    let fullResponse = ''
    let buffer = ''
    let hasCalledComplete = false

    while (true) {
      // Check if aborted
      if (abortSignal?.aborted) {
        console.log('🛑 Stream aborted by user')
        reader.cancel()
        return
      }

      const { done, value } = await reader.read()
      
      if (done) {
        // Final decode to handle any remaining bytes
        const finalChunk = decoder.decode(new Uint8Array(), { stream: false })
        if (finalChunk) {
          buffer += finalChunk
        }
        break
      }

      // Decode the chunk with stream: true to handle multi-byte UTF-8 characters
      const chunk = decoder.decode(value, { stream: true })
      buffer += chunk
      
      // Split by double newlines to process complete SSE messages
      const messages = buffer.split('\n\n')
      
      // Keep the last incomplete message in the buffer
      buffer = messages.pop() || ''

      for (const message of messages) {
        if (!message.trim()) continue
        
        // SSE format: "data: {json}"
        if (message.startsWith('data: ')) {
          const jsonData = message.slice(6).trim() // Remove "data: " prefix
          
          // Production-grade JSON parsing with fallback
          try {
            const data = JSON.parse(jsonData)
            
            // Handle "response" format (full response in one message)
            if (data.response) {
              console.log('📦 Received full response format')
              fullResponse = data.response
              // Clean UTF-8 replacement characters before displaying
              const cleanResponse = fullResponse.replace(/\uFFFD/g, '').trim()
              onToken(cleanResponse)
	              if (!hasCalledComplete) {
	                hasCalledComplete = true
	                if (cleanResponse !== fullResponse) {
	                  console.log('🧹 Removed UTF-8 replacement character from response')
	                }
	                // Assuming the full response format might contain a 'sources' field
	                const sources = data.sources || []
	                onComplete(cleanResponse, sources)
	              }
	              return
            }
            
            // Handle "token" format (streaming tokens)
            if (data.token) {
              // Clean token before adding to response
              const cleanToken = data.token.replace(/\uFFFD/g, '')
              fullResponse += cleanToken
              onToken(cleanToken)
            }
            
            // Handle completion
            if (data.done) {
	              if (!hasCalledComplete) {
	                hasCalledComplete = true
	                // Final cleanup
	                const cleanResponse = fullResponse.replace(/\uFFFD/g, '').trim()
	                if (cleanResponse !== fullResponse) {
	                  console.log('🧹 Removed UTF-8 replacement character from final response')
	                }
	                // Assuming the final 'done' message might contain a 'sources' field
	                const sources = data.sources || []
	                onComplete(cleanResponse, sources)
	              }
	              return
            }
            
            // Handle error
            if (data.error) {
              throw new Error(data.error)
            }
          } catch (parseError) {
            console.warn('⚠️ JSON parse error, attempting to extract meaningful data:', parseError)
            
            // Production-grade fallback: Try to extract meaningful content from malformed JSON
            try {
              // Try to extract response field (full response format)
              const responseMatch = jsonData.match(/"response"\s*:\s*"([^"]*)"/)
              if (responseMatch && responseMatch[1]) {
                const response = responseMatch[1].replace(/\uFFFD/g, '').trim()
                fullResponse = response
                onToken(response)
                if (!hasCalledComplete) {
                  hasCalledComplete = true
                  onComplete(fullResponse)
                }
                console.log('✅ Extracted response from malformed JSON')
                return
              }
              
              // Try to extract token field using regex
              const tokenMatch = jsonData.match(/"token"\s*:\s*"([^"]*)"/)
              if (tokenMatch && tokenMatch[1]) {
                const token = tokenMatch[1].replace(/\uFFFD/g, '')
                fullResponse += token
                onToken(token)
                console.log('✅ Extracted token from malformed JSON:', token)
                continue
              }
              
              // Try to extract done field
              const doneMatch = jsonData.match(/"done"\s*:\s*(true|false)/)
              if (doneMatch && doneMatch[1] === 'true') {
	                if (!hasCalledComplete) {
	                  hasCalledComplete = true
	                  const cleanResponse = fullResponse.replace(/\uFFFD/g, '').trim()
	                  // Assuming the final 'done' message might contain a 'sources' field
	                  const sources = doneMatch.sources || []
	                  onComplete(cleanResponse, sources)
	                }
	                return
              }
              
              // Try to extract error field
              const errorMatch = jsonData.match(/"error"\s*:\s*"([^"]*)"/)
              if (errorMatch && errorMatch[1]) {
                throw new Error(errorMatch[1])
              }
              
              // If it's just text without JSON structure, treat it as a token
              if (jsonData && !jsonData.includes('{') && !jsonData.includes('}')) {
                fullResponse += jsonData
                onToken(jsonData)
                console.log('✅ Treated plain text as token:', jsonData)
                continue
              }
              
              console.error('❌ Could not extract meaningful data from:', jsonData)
            } catch (extractError) {
              console.error('❌ Extraction failed:', extractError)
            }
          }
        } else if (message.trim()) {
          // Handle non-SSE formatted messages (plain text)
          console.log('📝 Received plain text message:', message)
          fullResponse += message
          onToken(message)
        }
      }
    }

    // If we exit the loop without getting a "done" signal, complete anyway
    if (fullResponse && !hasCalledComplete) {
      hasCalledComplete = true
	      // Clean up any UTF-8 replacement characters () that might have been added
	      const cleanResponse = fullResponse.replace(/\uFFFD/g, '').trim()
	      console.log('🧹 Cleaned response, removed', fullResponse.length - cleanResponse.length, 'replacement characters')
	      // No sources available in this fallback path
	      onComplete(cleanResponse, [])
	    } else if (!fullResponse) {   throw new Error('Stream ended without response')
    }

  } catch (error) {
    // Check if it's an abort error
    if (error.name === 'AbortError' || abortSignal?.aborted) {
      console.log('🛑 Request aborted by user')
      if (reader) {
        try {
          await reader.cancel()
        } catch (e) {
          // Ignore cancel errors
        }
      }
      return
    }
    
    console.error('❌ Stream generation error:', error)
    onError(error)
  }
}

/**
 * Generate text without streaming (single response)
 */
export const generateText = async (
  message,
  imageDataUrl = null,
  modelId = 'dalsi-ai',
  maxLength = 500
) => {
  try {
    const baseUrl = getModelUrl(modelId)
    
    // Prepare request payload
    const payload = {
      message: message,
      max_length: maxLength
    }

    // Add image data for vision model
    if (imageDataUrl && modelId === 'dalsi-aivi') {
      payload.image_data_url = imageDataUrl
    }

    const response = await fetch(`${baseUrl}/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    return data.response || data.text || ''

  } catch (error) {
    console.error('Text generation error:', error)
    throw error
  }
}
