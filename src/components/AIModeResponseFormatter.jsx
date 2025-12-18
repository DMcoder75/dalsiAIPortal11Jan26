/**
 * AI Mode Response Formatter
 * Displays responses in different formats based on mode (Chat, Debate, Project)
 * Non-intrusive component that integrates with existing message display
 */

import React from 'react'
import { ChevronDown, ChevronUp, CheckCircle2, Circle, Copy, ExternalLink } from 'lucide-react'

/**
 * Format and display chat mode response
 */
export const ChatModeResponse = ({ response, references, followups, onFollowupClick }) => {
  const [copied, setCopied] = React.useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(response)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-3">
      {/* Copy Button */}
      <div className="flex justify-end mb-2">
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 px-2 py-1 text-xs bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground rounded transition-colors"
        >
          <Copy className="w-3 h-3" />
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>

      {/* Main Response */}
      <div className="prose prose-sm max-w-none dark:prose-invert">
        {typeof response === 'string' && response.includes('<') && response.includes('>') ? (
          <div dangerouslySetInnerHTML={{ __html: response }} className="text-sm leading-relaxed" />
        ) : (
          <p className="whitespace-pre-wrap text-foreground text-sm leading-relaxed">{response}</p>
        )}
      </div>

      {/* References Section */}
      {references && references.length > 0 && (
        <div className="mt-4 pt-4 border-t border-border">
          <p className="text-xs font-semibold text-muted-foreground mb-3 flex items-center gap-1">
            <span>📚</span> References & Sources
          </p>
          <div className="space-y-2">
            {references.map((ref, idx) => (
              <a
                key={idx}
                href={ref.url || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-2 p-2 bg-blue-50/50 dark:bg-blue-950/20 rounded hover:bg-blue-100/50 dark:hover:bg-blue-950/40 transition-colors group"
              >
                <ExternalLink className="w-3 h-3 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-blue-900 dark:text-blue-100 group-hover:text-blue-700 dark:group-hover:text-blue-200 truncate">
                    {ref.title || ref}
                  </p>
                  {ref.url && <p className="text-xs text-blue-600 dark:text-blue-400 truncate">{ref.url}</p>}
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Follow-up Questions Section */}
      {followups && followups.length > 0 && (
        <div className="mt-4 pt-4 border-t border-border">
          <p className="text-xs font-semibold text-muted-foreground mb-3 flex items-center gap-1">
            <span>💡</span> Follow-up Questions
          </p>
          <div className="space-y-2">
            {followups.map((followup, idx) => (
              <button
                key={idx}
                onClick={() => onFollowupClick && onFollowupClick(followup)}
                className="w-full text-left px-3 py-2 text-xs bg-amber-50/50 dark:bg-amber-950/20 rounded hover:bg-amber-100/50 dark:hover:bg-amber-950/40 transition-colors text-amber-900 dark:text-amber-100 hover:text-amber-700 dark:hover:text-amber-200 border border-transparent hover:border-amber-200 dark:hover:border-amber-800 cursor-pointer"
                title={followup}
              >
                {followup}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Format and display debate mode response
 */
export const DebateModeResponse = ({ debate, references }) => {
  const [expandedPersona, setExpandedPersona] = React.useState(null)

  const personaColors = {
    'Optimist': 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800',
    'Pessimist': 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800',
    'Data Analyst': 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800',
  }

  const personaIcons = {
    'Optimist': '😊',
    'Pessimist': '😟',
    'Data Analyst': '📊',
  }

  return (
    <div className="space-y-3">
      <div className="mb-4 p-3 bg-muted rounded-lg">
        <p className="text-sm font-medium text-foreground">
          🎭 <strong>Debate:</strong> {debate.question}
        </p>
      </div>

      <div className="space-y-2">
        {debate.debate_responses && debate.debate_responses.map((response, idx) => (
          <div
            key={idx}
            className={`border rounded-lg overflow-hidden transition-all ${personaColors[response.persona] || 'bg-muted'}`}
          >
            <button
              onClick={() => setExpandedPersona(expandedPersona === idx ? null : idx)}
              className="w-full px-4 py-3 flex items-center justify-between hover:opacity-80 transition-opacity"
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">{personaIcons[response.persona] || '🤔'}</span>
                <span className="font-semibold text-sm">{response.persona}</span>
              </div>
              {expandedPersona === idx ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>

            {expandedPersona === idx && (
              <div className="px-4 py-3 border-t border-current border-opacity-20">
                <p className="text-sm whitespace-pre-wrap text-foreground">
                  {response.response}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {references && references.length > 0 && (
        <div className="mt-4 pt-4 border-t border-border">
          <p className="text-xs font-semibold text-muted-foreground mb-2">📚 References</p>
          <div className="space-y-1">
            {references.map((ref, idx) => (
              <a
                key={idx}
                href={ref.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-500 hover:underline block truncate"
                title={ref.title}
              >
                {ref.title}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Format and display project mode response
 */
export const ProjectModeResponse = ({ goal, structured_data, formatted_output, references }) => {
  const [completedTasks, setCompletedTasks] = React.useState({})

  const toggleTaskCompletion = (phaseIdx, taskIdx) => {
    const key = `${phaseIdx}-${taskIdx}`
    setCompletedTasks(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  return (
    <div className="space-y-4">
      <div className="p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
        <p className="text-sm font-semibold text-foreground mb-1">🎯 Goal</p>
        <p className="text-sm text-foreground">{goal}</p>
      </div>

      {structured_data && structured_data.phases && (
        <div className="space-y-3">
          {structured_data.phases.map((phase, phaseIdx) => (
            <div key={phaseIdx} className="border border-border rounded-lg overflow-hidden">
              <div className="px-4 py-3 bg-muted">
                <p className="font-semibold text-sm text-foreground">
                  📍 {phase.phase_name}
                </p>
              </div>

              <div className="px-4 py-3 space-y-2">
                {phase.tasks && phase.tasks.map((task, taskIdx) => (
                  <button
                    key={taskIdx}
                    onClick={() => toggleTaskCompletion(phaseIdx, taskIdx)}
                    className="w-full flex items-start gap-3 p-2 hover:bg-muted rounded transition-colors text-left"
                  >
                    {completedTasks[`${phaseIdx}-${taskIdx}`] ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    ) : (
                      <Circle className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                    )}
                    <span className={`text-sm ${completedTasks[`${phaseIdx}-${taskIdx}`] ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                      {task.task_name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {formatted_output && (
        <div className="mt-4 p-4 bg-muted rounded-lg border border-border">
          <p className="text-xs font-semibold text-muted-foreground mb-2">📋 Full Plan</p>
          <div className="prose prose-sm max-w-none dark:prose-invert text-xs">
            <pre className="whitespace-pre-wrap text-foreground overflow-auto max-h-96">
              {formatted_output}
            </pre>
          </div>
        </div>
      )}

      {references && references.length > 0 && (
        <div className="mt-4 pt-4 border-t border-border">
          <p className="text-xs font-semibold text-muted-foreground mb-2">📚 References</p>
          <div className="space-y-1">
            {references.map((ref, idx) => (
              <a
                key={idx}
                href={ref.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-500 hover:underline block truncate"
                title={ref.title}
              >
                {ref.title}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Main formatter component that routes to appropriate display
 */
export const AIModeResponseFormatter = ({ mode = 'chat', response, references, followups, onFollowupClick }) => {
  if (!response) return null

  // Handle different response structures based on mode
  if (mode === 'debate' && response.debate) {
    return <DebateModeResponse debate={response.debate} references={references} />
  }

  if (mode === 'project' && response.structured_data) {
    return (
      <ProjectModeResponse
        goal={response.goal}
        structured_data={response.structured_data}
        formatted_output={response.formatted_output}
        references={references}
      />
    )
  }

  // Default to chat mode
  return <ChatModeResponse response={response.response || response} references={references} followups={followups} onFollowupClick={onFollowupClick} />
}

export default AIModeResponseFormatter
