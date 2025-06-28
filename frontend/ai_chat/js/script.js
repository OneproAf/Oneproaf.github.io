// AI Psychologist Chat JavaScript

class AIPsychologistChat {
    constructor() {
        this.chatHistory = document.getElementById('chat-history');
        this.messageInput = document.getElementById('message-input');
        this.sendButton = document.getElementById('send-button');
        this.backButton = document.querySelector('.back-button');
        
        this.conversationHistory = [];
        this.isTyping = false;
        
        this.initializeEventListeners();
        this.addWelcomeMessage();
    }
    
    initializeEventListeners() {
        // Send message on button click
        this.sendButton.addEventListener('click', () => this.sendMessage());
        
        // Send message on Enter key
        this.messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
        
        // Back button navigation
        this.backButton.addEventListener('click', () => {
            window.history.back();
        });
        
        // Focus input on load
        this.messageInput.focus();
    }
    
    addWelcomeMessage() {
        const welcomeMessage = `Hello! I'm your AI Psychologist. I'm here to provide a supportive space for you to talk about your thoughts, feelings, and experiences. 

I can help you with:
• Understanding your emotions
• Coping strategies for stress and anxiety
• Self-reflection and personal growth
• General mental wellness guidance

Please remember that I'm here for support and guidance, but I'm not a replacement for professional mental health care. If you're experiencing a crisis or need immediate help, please contact a mental health professional or crisis hotline.

What would you like to talk about today?`;
        
        this.addMessage(welcomeMessage, 'ai');
    }
    
    async sendMessage() {
        const message = this.messageInput.value.trim();
        if (!message || this.isTyping) return;
        
        // Add user message to chat
        this.addMessage(message, 'user');
        this.messageInput.value = '';
        
        // Show typing indicator
        this.showTypingIndicator();
        
        try {
            // Get AI response
            const aiResponse = await this.getAIResponse(message);
            
            // Remove typing indicator and add AI response
            this.hideTypingIndicator();
            this.addMessage(aiResponse, 'ai');
            
        } catch (error) {
            console.error('Error getting AI response:', error);
            this.hideTypingIndicator();
            this.addMessage('I apologize, but I\'m having trouble responding right now. Please try again in a moment.', 'ai');
        }
    }
    
    async getAIResponse(userMessage) {
        // Add to conversation history
        this.conversationHistory.push({
            role: 'user',
            content: userMessage
        });
        
        // Prepare the conversation context
        const conversationContext = this.conversationHistory
            .slice(-10) // Keep last 10 messages for context
            .map(msg => `${msg.role === 'user' ? 'User' : 'AI'}: ${msg.content}`)
            .join('\n');
        
        const prompt = `You are a supportive AI psychologist. Provide helpful, empathetic responses to the user's message. Keep responses conversational and supportive, but remember you're not a replacement for professional mental health care.

Previous conversation:
${conversationContext}

User: ${userMessage}

AI Psychologist:`;
        
        try {
            const response = await fetch('http://localhost:8000/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: userMessage,
                    conversationHistory: this.conversationHistory.slice(-5) // Send last 5 messages for context
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            const aiResponse = data.response || this.getFallbackResponse(userMessage);
            
            // Add AI response to conversation history
            this.conversationHistory.push({
                role: 'assistant',
                content: aiResponse
            });
            
            return aiResponse;
            
        } catch (error) {
            console.error('API call failed:', error);
            // Return a fallback response if API fails
            return this.getFallbackResponse(userMessage);
        }
    }
    
    getFallbackResponse(userMessage) {
        const lowerMessage = userMessage.toLowerCase();
        
        // Simple keyword-based responses as fallback
        if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
            return "Hello! How are you feeling today? I'm here to listen and support you.";
        }
        
        if (lowerMessage.includes('sad') || lowerMessage.includes('depressed') || lowerMessage.includes('down')) {
            return "I'm sorry you're feeling this way. It's completely normal to have difficult emotions. Would you like to talk more about what's been on your mind? Sometimes just expressing our feelings can help us process them better.";
        }
        
        if (lowerMessage.includes('anxious') || lowerMessage.includes('worried') || lowerMessage.includes('stress')) {
            return "Anxiety and stress can be really challenging to deal with. Have you tried any breathing exercises or mindfulness techniques? Sometimes taking a few deep breaths can help ground us in the present moment.";
        }
        
        if (lowerMessage.includes('angry') || lowerMessage.includes('frustrated') || lowerMessage.includes('mad')) {
            return "It sounds like you're dealing with some strong emotions. Anger is a natural response, but it can be helpful to understand what's really behind it. Would you like to explore what might be causing these feelings?";
        }
        
        if (lowerMessage.includes('happy') || lowerMessage.includes('good') || lowerMessage.includes('great')) {
            return "That's wonderful to hear! It's great that you're feeling positive. What do you think contributed to this good mood? Understanding what brings us joy can help us cultivate more of it in our lives.";
        }
        
        if (lowerMessage.includes('tired') || lowerMessage.includes('exhausted') || lowerMessage.includes('sleep')) {
            return "Fatigue can really impact our mental and emotional well-being. Are you getting enough rest? Sometimes our bodies and minds need extra care when we're feeling tired. What do you think might help you feel more rested?";
        }
        
        // Default response
        return "Thank you for sharing that with me. I'm here to listen and support you. Could you tell me more about how you're feeling or what's been on your mind?";
    }
    
    addMessage(content, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;
        messageDiv.textContent = content;
        
        this.chatHistory.appendChild(messageDiv);
        this.scrollToBottom();
    }
    
    showTypingIndicator() {
        this.isTyping = true;
        this.sendButton.disabled = true;
        
        const typingDiv = document.createElement('div');
        typingDiv.className = 'typing-indicator';
        typingDiv.id = 'typing-indicator';
        
        for (let i = 0; i < 3; i++) {
            const dot = document.createElement('div');
            dot.className = 'typing-dot';
            typingDiv.appendChild(dot);
        }
        
        this.chatHistory.appendChild(typingDiv);
        this.scrollToBottom();
    }
    
    hideTypingIndicator() {
        this.isTyping = false;
        this.sendButton.disabled = false;
        
        const typingIndicator = document.getElementById('typing-indicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }
    
    scrollToBottom() {
        setTimeout(() => {
            this.chatHistory.scrollTop = this.chatHistory.scrollHeight;
        }, 100);
    }
}

// Initialize the chat when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new AIPsychologistChat();
}); 