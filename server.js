import { config } from 'dotenv';
import express from 'express';
import cors from 'cors';
import path from 'path';

config({ path: './api.env' });

async function startServer() {
    const fetch = (await import('node-fetch')).default;
    const app = express();

    app.use(cors());
    app.use(express.json());
    app.use(express.static('.'));

    // 處理 favicon.ico 請求
    app.get('/favicon.ico', (req, res) => {
        res.status(204).end(); // 返回204 No Content
    });

    // 延遲函數，用於實現退避機制
    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    // 呼叫 OpenAI API，並實現重試機制
    async function callOpenAiApi(message) {
        const apiKey = process.env.OPENAI_API_KEY;
        const url = 'https://api.openai.com/v1/chat/completions';

        if (!apiKey) {
            console.error('API key not set on server');
            throw new Error('API key not set on server');
        }

        for (let attempt = 0; attempt < 3; attempt++) { // 設定最多重試3次
            try {
                const response = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${apiKey}`
                    },
                    body: JSON.stringify({
                        model: "gpt-3.5-turbo",
                        messages: [{ role: "user", content: message }],
                        temperature: 0.7
                    })
                });

                console.log('Response received from OpenAI API');

                if (!response.ok) {

                    const errorData = await response.json();
                    console.error('OpenAI API error:', errorData); 

                    if (errorData.error && errorData.error.code === 'insufficient_quota') {
                        throw new Error('配額已經用完，請檢查您的 OpenAI 帳戶。');
                    }
                    
                    throw new Error('系統忙碌中，請稍後再試或與客服聯繫。');
                    
                }

                return await response.json(); // 如果成功，返回 API 的回應
            } catch (error) {
                console.error(`Attempt ${attempt + 1} failed:`, error.message);
                if (attempt === 2) { // 第三次重試後拋出錯誤
                    throw error;
                }
            }
        }
    }

    app.post('/api/chat', async (req, res) => {
        const { message } = req.body;

        try {
            console.log('Processing message:', message);
            const data = await callOpenAiApi(message);
            console.log('Response from OpenAI:', data);
            res.json(data);
        } catch (error) {
            console.error('Error calling OpenAI API:', error);
            // 返回自定義錯誤訊息
            res.status(500).json({ error: '系統忙碌中，請與客服聯絡...' });
        }
    });

    const PORT = process.env.PORT || 8080;
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

startServer().catch(console.error);
