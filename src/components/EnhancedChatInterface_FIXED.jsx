// FIXED CODE SNIPPET - Replace the chat creation and message saving section

 // Auto-create chat if none exists (for logged-in users)
 let activeChatId = currentChatId // Use current chat ID if it exists
 if (user && !currentChatId) {
  try {
  console.log('🔄 Auto-creating chat for first message...')
  
  // Create chat with first few words of message as title
  const messageWords = inputMessage.trim().split(' ').slice(0, 5).join(' ')
  const chatTitle = messageWords.length > 40 ? messageWords.substring(0, 40) + '...' : messageWords
  
  const { data, error } = await supabase
   .from('chats')
   .insert([{ 
   user_id: user.id, 
   title: chatTitle || 'New Chat',
   model_type: selectedModel
   }])
   .select()
   .single()

  if (error) {
   console.error('❌ Error creating chat:', error)
   throw error
  }
  
  console.log('✅ Chat created successfully:', data.id, 'Title:', chatTitle)
  
  // Store the new chat ID for immediate use (avoids race condition)
  activeChatId = data.id
  
  // Set current chat ID in state (for UI updates)
  setCurrentChatId(data.id)
  
  // Reload chat list to show new chat in sidebar
  await loadChats()
  
  console.log('✅ Chat list refreshed')
  } catch (error) {
  console.error('❌ Error auto-creating chat:', error)
  alert('Failed to create chat. Please try again.')
  return // Don't proceed if chat creation fails
  }
 }

 // ... rest of code ...

 // Save user message if authenticated
 if (user && activeChatId) {
  await saveMessage(activeChatId, 'user', userMessage.content, {
  has_image: !!currentImage,
  image_name: currentImage?.name
  })
  // Track funnel step: first_message (if it's the first message)
  if (messages.length === 1) {
    trackFunnelStep(user.id, 'first_message', { model: selectedModel })
  }
 } else if (!user) {
  // Track funnel step: first_message (if it's the first message)
  if (messages.length === 1) {
    trackFunnelStep(guestUserId, 'first_message', { model: selectedModel })
  }
  // Save guest message to localStorage AND database
  const guestMessages = JSON.parse(localStorage.getItem('guest_messages') || '[]')
  guestMessages.push(userMessage)
  localStorage.setItem('guest_messages', JSON.stringify(guestMessages))
  
  // Also save to database temp table
  await saveGuestMessageToDB(userMessage)
 }

 // ... later in the AI response handler ...

 // Save AI response if authenticated
 if (user && activeChatId) {
  console.log('💾 Saving AI response to database...')
  await saveMessage(activeChatId, 'assistant', aiResponse.content, {
  model_used: selectedModel,
  content_type: 'text',
  has_code: aiResponse.content.includes('```'),
  processing_time: Date.now() - userMessage.id,
  sources: aiResponse.sources
  })
 } else if (!user) {
  // Save guest AI response to localStorage AND database
  const guestMessages = JSON.parse(localStorage.getItem('guest_messages') || '[]')
  guestMessages.push(aiResponse)
  localStorage.setItem('guest_messages', JSON.stringify(guestMessages))
  
  // Also save to database temp table
  await saveGuestMessageToDB(aiResponse)
 }
