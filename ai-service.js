document.addEventListener('DOMContentLoaded', () => {
    const aiInput = document.getElementById('ai-input');
    const sendAiBtn = document.getElementById('send-ai-btn');
    const chatContainer = document.getElementById('chat-container');

    // Hardcoded API Key as per developer instruction
    const apiKey = "AIzaSyAYikLbuxYE_bVWv6xrUC4UcFwX4Pr2f2k";

    // Check for marked library (optional, if user adds it later)
    const hasMarked = typeof marked !== 'undefined';

    init();

    function init() {
        setupEventListeners();
    }

    function setupEventListeners() {
        sendAiBtn.addEventListener('click', handleSend);

        aiInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleSend();
        });

        aiInput.addEventListener('input', () => {
            sendAiBtn.disabled = !aiInput.value.trim();
        });
    }

    async function handleSend() {
        const text = aiInput.value.trim();
        if (!text) return;

        // Clear input
        aiInput.value = '';
        sendAiBtn.disabled = true;

        // Add User Message
        appendMessage('user', text);

        // Show typing indicator
        const loadingId = showTypingIndicator();

        try {
            const response = await callGeminiAPI(text);
            removeMessage(loadingId);
            appendMessage('ai', response);
        } catch (error) {
            removeMessage(loadingId);
            appendMessage('ai', 'عذراً، حدث خطأ أثناء الاتصال بالخادم. تأكد من اتصال الإنترنت.\nERROR: ' + error.message);
        }
    }

    async function callGeminiAPI(prompt) {
        // Using gemini-1.5-flash as requested
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: `أنت مساعد ذكي إسلامي في تطبيق للقرآن الكريم.
                            تعليماتك الصارمة هي:
                            1. أجب عن الأسئلة الدينية والإسلامية والقرآنية فقط. ارفض الإجابة بلطف على أي موضوع آخر (مثل الرياضة، التكنولوجيا، السياسة، الخ) وقل أنك متخصص في الدين فقط.
                            2. تحر الدقة المعلوماتية الكاملة. لا تذكر أي معلومة غير صحيحة أو غير مؤكدة. إذا لم تكن متأكداً، قل "لا أعلم" أو "الله أعلم".
                            3. أجب باللغة العربية فقط.
                            4. اجعل الرد نصياً بسيطاً وواضحاً (Text Only) دون تنسيقات معقدة.
                            
                            السؤال هو: ${prompt}`
                        }]
                    }]
                })
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error?.message || 'API Error');
            }

            const data = await response.json();
            const answer = data.candidates?.[0]?.content?.parts?.[0]?.text;

            return answer || 'لم أتلق إجابة مفهومة من الخادم.';
        } catch (error) {
            throw error;
        }
    }

    function appendMessage(role, text) {
        const div = document.createElement('div');
        div.className = `message ${role}-message`;

        // Avatar
        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.innerHTML = role === 'ai' ? '<i class="fas fa-robot"></i>' : '<i class="fas fa-user"></i>';

        // Content
        const content = document.createElement('div');
        content.className = 'message-content';
        content.innerHTML = formatText(text);

        if (role === 'ai') {
            div.appendChild(avatar);
            div.appendChild(content);
        } else {
            // User message order (avatar right) is handled by flex-direction: row-reverse in CSS
            div.appendChild(avatar);
            div.appendChild(content);
        }

        chatContainer.appendChild(div);
        scrollToBottom();
        return div.id = 'msg-' + Date.now();
    }

    function showTypingIndicator() {
        const div = document.createElement('div');
        div.className = 'message ai-message';
        div.id = 'typing-' + Date.now();

        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.innerHTML = '<i class="fas fa-robot"></i>';

        const content = document.createElement('div');
        content.className = 'message-content';
        content.innerHTML = `
            <div class="typing-indicator">
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
            </div>
        `;

        div.appendChild(avatar);
        div.appendChild(content);
        chatContainer.appendChild(div);
        scrollToBottom();
        return div.id;
    }

    function removeMessage(id) {
        const msg = document.getElementById(id);
        if (msg) msg.remove();
    }

    function scrollToBottom() {
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    function formatText(text) {
        // Basic formatting if 'marked' is not available
        if (typeof marked !== 'undefined') {
            return marked.parse(text);
        }

        // Simple manual formatter
        let formatted = text
            // Escape HTML
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            // Bold
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            // Code
            .replace(/`(.*?)`/g, '<code>$1</code>')
            // Newlines
            .replace(/\n/g, '<br>');

        return formatted;
    }
});
