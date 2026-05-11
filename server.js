const express = require('express')
const path = require('path')

const app = express()
app.use(express.json())

const API_KEY = process.env.GPT_API_KEY
const API_URL = process.env.GPT_API_URL || 'https://api.openai.com/v1'
const MODEL = process.env.GPT_MODEL || 'gpt-3.5-turbo'

app.post('/api/chat', async (req, res) => {
  try {
    const { messages, maxTokens, temperature } = req.body

    const response = await fetch(`${API_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages,
        max_tokens: maxTokens || 300,
        temperature: temperature || 0.8,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      return res.status(response.status).json(data)
    }

    const reply = data.choices?.[0]?.message?.content?.trim()
    if (!reply) {
      return res.status(500).json({ error: 'API 未返回有效回复' })
    }

    res.json({ reply })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.use(express.static(__dirname))

const PORT = process.env.PORT || 3002
const HOST = process.env.HOST || '0.0.0.0'

app.listen(PORT, HOST, () => {
  console.log(`✨ 恋爱AI聊天模拟器已启动：http://localhost:${PORT}`)
})
