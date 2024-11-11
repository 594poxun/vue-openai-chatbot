const { createApp } = Vue

createApp({
    data() {
        return {
            messages: [
                { role: 'assistant', content: '你好！我是AI助手。有什麼我可以幫助你的嗎？' }
            ],
            userInput: '',
            isWaitingForResponse: false,
            isChatVisible: true,
            currentTime: new Date().toLocaleString('zh-TW', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit'
            }).replace(/\//g, '/').replace(',', '')
        }
    },
    mounted() {
      setInterval(() => {
          this.updateCurrentTime();
      }, 1000);
    },
    methods: {
        updateCurrentTime() {
            this.currentTime = new Date().toLocaleString('zh-TW', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            }).replace(/\//g, '/').replace(',', '')
        },
        toggleChat() {
            this.isChatVisible = !this.isChatVisible; // 切換顯示狀態
        },
        async sendMessage() {
            if (this.userInput.trim() === '') return; // 確保不發送空訊息

            this.isWaitingForResponse = true; // 設置等待狀態
            this.messages.push({ role: 'user', content: this.userInput }); // 添加用戶消息

            try {
                const response = await fetch('/api/chat', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ message: this.userInput })
                });

                if (!response.ok) {
                    throw new Error('系統忙碌中，請與客服聯絡...'); // 自定義錯誤訊息
                }

                const data = await response.json();
                this.messages.push({ role: 'assistant', content: data.choices[0].message.content });
            } catch (error) {
                console.error('Error sending message:', error);
                this.messages.push({ role: 'assistant', content: '系統忙碌中，請與客服聯絡...' }); // 顯示友好提示
            } finally {
                this.isWaitingForResponse = false; // 重置等待狀態
                this.userInput = ''; // 清空輸入框
            }
        }
    }
}).mount('#app')
