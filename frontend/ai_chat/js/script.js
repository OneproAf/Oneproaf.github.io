document.addEventListener('DOMContentLoaded', () => {
    const chatContainer = document.getElementById('chat-container');
    const userInput = document.getElementById('userInput');
    const sendMessageBtn = document.getElementById('sendMessageBtn');

    // Function to add a message to the chat container
    function addMessage(text, sender) {
        const messageP = document.createElement('p');
        if (sender === 'ai') {
            messageP.innerHTML = `<i>${text}</i>`;
        } else {
            messageP.textContent = text;
        }
        chatContainer.appendChild(messageP);

        // Scroll to the bottom to show the latest message
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    // Event listener for the send button
    sendMessageBtn.addEventListener('click', () => {
        sendMessage();
    });

    // Event listener for pressing Enter in the input field
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });

    async function sendMessage() {
        const messageText = userInput.value.trim();

        if (messageText) {
            addMessage(messageText, 'user');
            userInput.value = ''; // Clear the input field

            // Show loading indicator
            const loadingP = document.createElement('p');
            loadingP.innerHTML = '<i>Thinking...</i>';
            chatContainer.appendChild(loadingP);
            chatContainer.scrollTop = chatContainer.scrollHeight;

            try {
                // Send message to backend API
                const response = await fetch('/api/chat', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ message: messageText })
                });

                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }

                const data = await response.json();
                
                // Remove loading message
                chatContainer.removeChild(loadingP);
                
                // Add AI response
                addMessage(data.response, 'ai');
            } catch (error) {
                console.error('Error:', error);
                // Remove loading message
                chatContainer.removeChild(loadingP);
                // Add error message
                addMessage('Sorry, I encountered an error. Please try again.', 'ai');
            }
        }
    }

    // Function to go back to main app
    window.goBack = function() {
        // Check if we have a referrer (came from another page)
        if (document.referrer && document.referrer.includes(window.location.origin)) {
            window.history.back();
        } else {
            // Fallback to main page
            window.location.href = '/';
        }
    };

    // Add initial welcome message
    addMessage("Hello! I'm your AI psychologist. How are you feeling today?", 'ai');
});
