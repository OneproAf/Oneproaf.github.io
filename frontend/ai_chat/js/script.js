document.addEventListener('DOMContentLoaded', () => {
    const chatHistory = document.getElementById('chat-history');
    const messageInput = document.getElementById('message-input');
    const sendButton = document.getElementById('send-button');
    const backButton = document.querySelector('.back-button');

    // Function to add a message to the chat history
    function addMessage(text, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', `${sender}-message`);
        messageDiv.innerHTML = `<p>${text}</p>`;
        chatHistory.appendChild(messageDiv);

        // Scroll to the bottom to show the latest message
        chatHistory.scrollTop = chatHistory.scrollHeight;
    }

    // Event listener for the send button
    sendButton.addEventListener('click', () => {
        sendMessage();
    });

    // Event listener for pressing Enter in the input field
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });

    function sendMessage() {
        const messageText = messageInput.value.trim();

        if (messageText) {
            addMessage(messageText, 'user');
            messageInput.value = ''; // Clear the input field

            // --- AI Response Simulation (REPLACE WITH ACTUAL AI INTEGRATION) ---
            // In a real application, you would send messageText to your AI backend here.
            // The AI would process it and send back a response.
            // For now, let's simulate a delayed AI response.
            setTimeout(() => {
                const aiResponse = generateSimpleAiResponse(messageText); // Simple placeholder
                addMessage(aiResponse, 'ai');
            }, 1000); // Simulate network delay
            // --- END AI Response Simulation ---
        }
    }

    // Simple placeholder for AI response logic
    function generateSimpleAiResponse(userMessage) {
        userMessage = userMessage.toLowerCase();
        if (userMessage.includes('hello') || userMessage.includes('hi')) {
            return "Hello there! How can I assist you today?";
        } else if (userMessage.includes('stress') || userMessage.includes('anxiety')) {
            return "I understand you're feeling stress/anxiety. Can you tell me more about what's causing it?";
        } else if (userMessage.includes('thank you') || userMessage.includes('thanks')) {
            return "You're welcome! I'm here to help.";
        } else if (userMessage.includes('help')) {
            return "I'm designed to provide support and guidance. What specific help are you looking for?";
        }
        return "I'm listening. Please tell me more about what's on your mind.";
    }

    // Event listener for the back button (for navigation)
    backButton.addEventListener('click', () => {
        alert('Navigating back... (In a real app, this would go to a previous screen)');
        // In a real application, you might use:
        // window.history.back();
        // Or navigate to a different route in a single-page application framework
    });

    // --- Initial / Session History Loading (Conceptual) ---
    // In a real application, you would load previous session messages here
    // from your backend database when the page loads.
    // Example:
    // fetch('/api/session-history')
    //     .then(response => response.json())
    //     .then(messages => {
    //         messages.forEach(msg => addMessage(msg.text, msg.sender));
    //     });
    // For demonstration, let's add some initial messages:
    addMessage("Hello! I'm your AI psychologist. How are you feeling today?", 'ai');
    addMessage("I'm feeling a bit overwhelmed with work.", 'user');
    addMessage("I understand. Let's explore that together. What aspects of work are contributing to this feeling?", 'ai');
    // --- End Initial Loading ---
});
