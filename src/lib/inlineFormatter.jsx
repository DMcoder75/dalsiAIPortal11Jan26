/**
 * Inline Formatter Utility
 * Parses inline Markdown elements: bold, italic, links, code, strikethrough
 */

/**
 * Parse inline Markdown and return React elements
 */
export function parseInlineMarkdown(text) {
  if (!text) return null

  const parts = []
  let lastIndex = 0

  // Combined regex to match all inline elements
  // Order matters: links, bold, italic, strikethrough, inline code
  const patterns = [
    { regex: /\[([^\]]+)\]\(([^)]+)\)/g, type: 'link' },      // [text](url)
    { regex: /\*\*([^*]+?)\*\*/g, type: 'bold' },              // **bold** (non-greedy)
    { regex: /(?<!\*)\*(?!\*)([^*]+?)(?<!\*)\*(?!\*)/g, type: 'italic' },  // *italic* (not preceded/followed by *)
    { regex: /~~([^~]+?)~~/g, type: 'strikethrough' },         // ~~strikethrough~~ (non-greedy)
    { regex: /`([^`]+?)`/g, type: 'code' }                     // `code` (non-greedy)
  ]

  // Find all matches with their positions
  const matches = []
  patterns.forEach(({ regex, type }) => {
    let match
    while ((match = regex.exec(text)) !== null) {
      matches.push({
        start: match.index,
        end: match.index + match[0].length,
        type,
        fullMatch: match[0],
        content: match[1],
        url: match[2] // For links
      })
    }
  })

  // Sort matches by position
  matches.sort((a, b) => a.start - b.start)

  // Remove overlapping matches (keep the first one)
  const filteredMatches = []
  matches.forEach(match => {
    const overlaps = filteredMatches.some(
      existing => 
        (match.start >= existing.start && match.start < existing.end) ||
        (match.end > existing.start && match.end <= existing.end)
    )
    if (!overlaps) {
      filteredMatches.push(match)
    }
  })

  // Build parts array
  lastIndex = 0
  filteredMatches.forEach(match => {
    // Add text before this match
    if (match.start > lastIndex) {
      parts.push({
        type: 'text',
        content: text.substring(lastIndex, match.start)
      })
    }

    // Add the matched element
    parts.push({
      type: match.type,
      content: match.content,
      url: match.url
    })

    lastIndex = match.end
  })

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push({
      type: 'text',
      content: text.substring(lastIndex)
    })
  }

  return parts
}

/**
 * Render inline Markdown parts as React elements
 */
export function renderInlineMarkdown(parts) {
  if (!parts) return null

  return parts.map((part, idx) => {
    switch (part.type) {
      case 'text':
        return <span key={idx}>{part.content}</span>

      case 'bold':
        return (
          <strong key={idx} className="font-bold text-white">
            {part.content}
          </strong>
        )

      case 'italic':
        return (
          <em key={idx} className="italic text-gray-200">
            {part.content}
          </em>
        )

      case 'code':
        return (
          <code
            key={idx}
            className="bg-slate-900 px-1.5 py-0.5 rounded text-gray-200 font-mono text-xs"
          >
            {part.content}
          </code>
        )

      case 'strikethrough':
        return (
          <span key={idx} className="line-through text-gray-400">
            {part.content}
          </span>
        )

      case 'link':
        return (
          <a
            key={idx}
            href={part.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-purple-400 hover:text-purple-300 underline transition-colors"
          >
            {part.content}
          </a>
        )

      default:
        return <span key={idx}>{part.content}</span>
    }
  })
}

export default { parseInlineMarkdown, renderInlineMarkdown }
