/**
 * Text Cleaning Utility
 * Removes special characters, control characters, and encoding artifacts
 */

/**
 * Clean text by removing UTF-8 replacement characters and other problematic characters
 * @param {string} text - The text to clean
 * @returns {string} - Cleaned text
 */
export function cleanText(text) {
  if (!text || typeof text !== 'string') {
    return text
  }

  let cleaned = text

  // Remove UTF-8 replacement character (�) - Unicode U+FFFD
  cleaned = cleaned.replace(/\uFFFD/g, '')
  
  // Remove zero-width characters
  cleaned = cleaned.replace(/[\u200B-\u200D\uFEFF]/g, '')
  
  // Remove other common problematic characters
  cleaned = cleaned.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
  
  // Remove byte order marks (BOM)
  cleaned = cleaned.replace(/^\uFEFF/, '')
  
  // Remove any remaining control characters except newlines and tabs
  cleaned = cleaned.replace(/[\x00-\x09\x0B-\x1F\x7F-\x9F]/g, '')
  
  // Trim whitespace
  cleaned = cleaned.trim()

  return cleaned
}

/**
 * Clean text for display in UI
 * More aggressive cleaning for display purposes
 * @param {string} text - The text to clean
 * @returns {string} - Cleaned text
 */
export function cleanTextForDisplay(text) {
  let cleaned = cleanText(text)
  
  // Replace multiple spaces with single space
  cleaned = cleaned.replace(/\s+/g, ' ')
  
  // Remove trailing dots or special chars that might be artifacts
  cleaned = cleaned.replace(/[�\uFFFD]+$/g, '')
  
  return cleaned
}

/**
 * Clean text for database storage
 * Ensures clean data is stored
 * @param {string} text - The text to clean
 * @returns {string} - Cleaned text
 */
export function cleanTextForDB(text) {
  let cleaned = cleanText(text)
  
  // Additional cleaning for database
  // Remove any trailing replacement characters
  cleaned = cleaned.replace(/[�\uFFFD]+$/g, '')
  
  // Normalize unicode
  cleaned = cleaned.normalize('NFC')
  
  return cleaned
}

/**
 * Clean an entire message object
 * @param {Object} message - Message object with content
 * @returns {Object} - Message with cleaned content
 */
export function cleanMessage(message) {
  if (!message || typeof message !== 'object') {
    return message
  }

  return {
    ...message,
    content: cleanTextForDB(message.content || '')
  }
}

/**
 * Clean an array of messages
 * @param {Array} messages - Array of message objects
 * @returns {Array} - Array of messages with cleaned content
 */
export function cleanMessages(messages) {
  if (!Array.isArray(messages)) {
    return messages
  }

  return messages.map(cleanMessage)
}

/**
 * Detect if text contains problematic characters
 * @param {string} text - The text to check
 * @returns {boolean} - True if problematic characters found
 */
export function hasProblematicCharacters(text) {
  if (!text || typeof text !== 'string') {
    return false
  }

  // Check for UTF-8 replacement character
  if (/\uFFFD/.test(text)) {
    return true
  }

  // Check for zero-width characters
  if (/[\u200B-\u200D\uFEFF]/.test(text)) {
    return true
  }

  // Check for control characters
  if (/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/.test(text)) {
    return true
  }

  return false
}
