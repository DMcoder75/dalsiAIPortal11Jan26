/**
 * Smart Text Formatter - Improved Version
 * Intelligently detects content type and applies appropriate formatting
 * without forcing artificial structure on the content
 */

const BOLD_KEYWORDS = [
  'WordPress', 'WooCommerce', 'portfolio website', 'personal portfolio',
  'ecommerce', 'e-commerce', 'website', 'web', 'mobile app',
  'theme', 'plugin', 'design', 'layout', 'strategy',
  'content', 'page', 'post', 'product', 'marketing',
  'integration', 'platform', 'system', 'campaign',
  'SEO', 'responsive', 'mobile', 'social media',
  'user experience', 'UX', 'UI', 'target audience',
  'key features', 'key milestone', 'key event',
  'success', 'challenge', 'important', 'significant',
  'crucial', 'essential', 'fundamental', 'critical',
  'step', 'phase', 'stage', 'milestone', 'timeline',
  'goal', 'objective', 'target', 'leadership', 'partnership',
  'Python', 'JavaScript', 'React', 'data structures', 'algorithms',
  'interactive', 'expert', 'industry', 'partnership', 'curriculum'
]

/**
 * Detect content type based on text characteristics
 */
function detectContentType(text) {
  const lowerText = text.toLowerCase()
  
  // Marketing/Sales content indicators
  const marketingIndicators = [
    /don't wait|enroll now|sign up|limited time|exclusive|special offer/i,
    /join us|unlock your|elevate your|transform your|revolutionize/i,
    /cutting-edge|innovative|premium|world-class|industry-leading/i,
    /call to action|cta|[[]link[]]|click here/i
  ]
  
  // Educational content indicators
  const educationalIndicators = [
    /explain|understand|learn|teach|concept|theory|principle/i,
    /step by step|how to|tutorial|guide|introduction/i,
    /research|study|evidence|data|analysis|findings/i
  ]
  
  // Narrative/Story content indicators
  const narrativeIndicators = [
    /once upon|story|tale|journey|adventure|experience/i,
    /character|plot|scene|dialogue|narrative/i
  ]
  
  // Instructional content indicators
  const instructionalIndicators = [
    /first|second|third|step \d+|procedure|process|method/i,
    /ingredients|materials|tools|requirements/i,
    /instructions|directions|follow these|do this/i
  ]
  
  let scores = {
    marketing: 0,
    educational: 0,
    narrative: 0,
    instructional: 0,
    general: 0
  }
  
  marketingIndicators.forEach(indicator => {
    if (indicator.test(text)) scores.marketing += 2
  })
  
  educationalIndicators.forEach(indicator => {
    if (indicator.test(text)) scores.educational += 2
  })
  
  narrativeIndicators.forEach(indicator => {
    if (indicator.test(text)) scores.narrative += 2
  })
  
  instructionalIndicators.forEach(indicator => {
    if (indicator.test(text)) scores.instructional += 2
  })
  
  // Find the highest score
  const type = Object.keys(scores).reduce((a, b) => 
    scores[a] > scores[b] ? a : b
  )
  
  // If no clear type detected, default to general
  return type === 'general' || scores[type] === 0 ? 'general' : type
}

/**
 * Check if text naturally contains section breaks
 */
function hasNaturalSections(text) {
  // Look for natural section indicators
  const sectionPatterns = [
    /\n\n[A-Z][^.!?]*[.!?]\n\n/,  // Paragraph followed by blank lines
    /^[A-Z][^.!?]*:$/m,            // Text ending with colon (section header)
    /^(introduction|background|overview|conclusion|summary):/im
  ]
  
  return sectionPatterns.some(pattern => pattern.test(text))
}

/**
 * Split text into natural paragraphs
 */
function splitIntoParagraphs(text) {
  // Split by double newlines or by sentence groups
  const paragraphs = text
    .split(/\n\n+/)
    .map(p => p.trim())
    .filter(p => p.length > 0)
  
  // If no double newlines, split by sentences
  if (paragraphs.length === 1) {
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text]
    const grouped = []
    let current = []
    
    sentences.forEach((sentence, idx) => {
      current.push(sentence.trim())
      
      // Group 2-3 sentences together
      if (current.length >= 2 || idx === sentences.length - 1) {
        grouped.push(current.join(' '))
        current = []
      }
    })
    
    return grouped.filter(p => p.length > 0)
  }
  
  return paragraphs
}

/**
 * Apply bold formatting to keywords
 */
function applyBoldFormatting(text) {
  let formatted = text
  
  BOLD_KEYWORDS.forEach(keyword => {
    // Avoid double-bolding
    if (!formatted.includes(`**${keyword}**`)) {
      const regex = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi')
      formatted = formatted.replace(regex, `**${keyword}**`)
    }
  })
  
  return formatted
}

/**
 * Format text based on content type
 */
export function smartFormatText(text) {
  if (!text || text.length === 0) return []
  
  const contentType = detectContentType(text)
  const hasNaturalSects = hasNaturalSections(text)
  const paragraphs = splitIntoParagraphs(text)
  
  const result = []
  
  // For marketing content: Keep it as-is with minimal formatting
  if (contentType === 'marketing') {
    paragraphs.forEach((para, idx) => {
      result.push({
        type: 'paragraph',
        content: applyBoldFormatting(para),
        preserveFlow: true  // Don't add headers
      })
    })
    return result
  }
  
  // For narrative content: Keep natural flow
  if (contentType === 'narrative') {
    paragraphs.forEach((para, idx) => {
      result.push({
        type: 'paragraph',
        content: applyBoldFormatting(para),
        preserveFlow: true
      })
    })
    return result
  }
  
  // For educational/instructional content: Add structure
  if ((contentType === 'educational' || contentType === 'instructional') && hasNaturalSects) {
    // Try to identify natural sections
    let currentSection = null
    let currentContent = []
    
    paragraphs.forEach((para) => {
      // Check if this paragraph looks like a section header
      if (para.length < 80 && para.match(/^[A-Z][^.!?]*$/)) {
        // Save previous section
        if (currentSection && currentContent.length > 0) {
          result.push({
            type: 'section',
            header: currentSection,
            content: currentContent.map(c => applyBoldFormatting(c))
          })
        }
        
        currentSection = para
        currentContent = []
      } else {
        currentContent.push(para)
      }
    })
    
    // Save last section
    if (currentSection && currentContent.length > 0) {
      result.push({
        type: 'section',
        header: currentSection,
        content: currentContent.map(c => applyBoldFormatting(c))
      })
    }
    
    // If no sections were created, return as paragraphs
    if (result.length === 0) {
      paragraphs.forEach((para) => {
        result.push({
          type: 'paragraph',
          content: applyBoldFormatting(para)
        })
      })
    }
    
    return result
  }
  
  // Default: Return as paragraphs with formatting
  paragraphs.forEach((para) => {
    result.push({
      type: 'paragraph',
      content: applyBoldFormatting(para)
    })
  })
  
  return result.filter(item => item && item.content && item.content.length > 0)
}

/**
 * Parse formatted text with bold and italic
 */
export function parseFormattedText(text) {
  if (!text) return null
  
  const parts = text.split(/(\*\*.*?\*\*|\*.*?\*)/g)
  
  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return {
        type: 'bold',
        content: part.slice(2, -2),
        key: idx
      }
    } else if (part.startsWith('*') && part.endsWith('*')) {
      return {
        type: 'italic',
        content: part.slice(1, -1),
        key: idx
      }
    } else {
      return {
        type: 'text',
        content: part,
        key: idx
      }
    }
  })
}

export default {
  smartFormatText,
  parseFormattedText,
  detectContentType
}
