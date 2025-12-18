import { useState, useEffect } from 'react'
import { Trash2, Copy, ChevronDown, Plus } from 'lucide-react'
import { Button } from './ui/button'

/**
 * ConversationHistory Component
 * Displays user's conversation history in left sidebar
 */
export default function ConversationHistory({
  conversations = [],
  currentChatId = null,
  onSelectConversation,
  onDeleteConversation,
  onNewConversation,
  isLoading = false
}) {
  const [expandedId, setExpandedId] = useState(null)
  const [hoveredId, setHoveredId] = useState(null)

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return ''
    
    const date = new Date(dateString)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return 'Today'
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday'
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }
  }

  // Group conversations by date
  const groupedConversations = conversations.reduce((acc, conv) => {
    const date = formatDate(conv.created_at)
    if (!acc[date]) acc[date] = []
    acc[date].push(conv)
    return acc
  }, {})

  const dateOrder = ['Today', 'Yesterday']
  const sortedDates = Object.keys(groupedConversations).sort((a, b) => {
    const aIndex = dateOrder.indexOf(a)
    const bIndex = dateOrder.indexOf(b)
    if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex
    if (aIndex !== -1) return -1
    if (bIndex !== -1) return 1
    return b.localeCompare(a)
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4 text-muted-foreground text-sm">
        Loading conversations...
      </div>
    )
  }

  if (conversations.length === 0) {
    return (
      <div className="text-center py-4 text-muted-foreground text-sm">
        <p>No conversations yet</p>
        <p className="text-xs mt-1">Start a new conversation to get started</p>
      </div>
    )
  }

  return (
    <div className="space-y-4 mb-4">
      {sortedDates.map((date) => (
        <div key={date}>
          {/* Date Header */}
          <div className="text-xs font-semibold text-muted-foreground px-2 py-2 uppercase tracking-wider">
            {date}
          </div>

          {/* Conversations for this date */}
          <div className="space-y-1">
            {groupedConversations[date].map((conv) => (
              <div
                key={conv.id}
                onMouseEnter={() => setHoveredId(conv.id)}
                onMouseLeave={() => setHoveredId(null)}
                className={`group relative px-2 py-2 rounded-lg cursor-pointer transition-colors ${
                  currentChatId === conv.id
                    ? 'bg-primary/10 text-primary'
                    : 'hover:bg-muted text-foreground'
                }`}
                onClick={() => onSelectConversation(conv.id)}
              >
                {/* Conversation Title */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{conv.title}</p>
                    {conv.message_count > 0 && (
                      <p className="text-xs text-muted-foreground">
                        {conv.message_count} message{conv.message_count !== 1 ? 's' : ''}
                      </p>
                    )}
                  </div>

                  {/* Action Buttons (visible on hover) */}
                  {hoveredId === conv.id && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          navigator.clipboard.writeText(conv.title)
                        }}
                        className="p-1 hover:bg-muted rounded opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Copy title"
                      >
                        <Copy className="h-3 w-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          if (confirm('Delete this conversation?')) {
                            onDeleteConversation(conv.id)
                          }
                        }}
                        className="p-1 hover:bg-red-500/10 hover:text-red-600 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Delete conversation"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
