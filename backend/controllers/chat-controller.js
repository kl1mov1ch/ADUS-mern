const { OpenAI } = require("openai");

const openai = new OpenAI({
    apiKey: process.env.CHAT_SECRET_KEY,
});

const chatController = {
    async chatWithGPT(req, res) {
        const { message } = req.body;

        if (!message) {
            return res.status(400).json({ error: "Сообщение не может быть пустым." });
        }

        try {
            const completion = await openai.chat.completions.create({
                model: 'gpt-3.5-turbo',
                messages: [
                    { role: 'system', content: 'You are a helpful assistant.' },
                    { role: 'user', content: message },
                ],
                temperature: 0.7,
                max_tokens: 2048,
            });

            const gptMessage = completion.choices[0].message.content;
            return res.json({ reply: gptMessage });
        } catch (error) {
            console.error('Ошибка при общении с GPT:', error);
            return res.status(500).json({ error: 'Ошибка при получении ответа от GPT' });
        }
    },
};

module.exports = chatController;
