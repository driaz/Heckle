import Anthropic from '@anthropic-ai/sdk'
import { GoogleGenAI } from '@google/genai'

let provider = 'claude'

const anthropic = new Anthropic({
  apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY,
  dangerouslyAllowBrowser: true,
})

const google = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY })

function setProvider(p) {
  provider = p
  console.log('[LLM] Provider:', p)
}

async function* generate(prompt, systemPrompt) {
  console.log('[LLM] Generating with', provider)
  if (provider === 'claude') {
    yield* generateClaude(prompt, systemPrompt)
  } else {
    yield* generateGemini(prompt, systemPrompt)
  }
}

async function* generateClaude(prompt, systemPrompt) {
  const stream = await anthropic.messages.create({
    model: 'claude-sonnet-4-6-20250218',
    max_tokens: 150,
    temperature: 1.0,
    system: systemPrompt,
    messages: [{ role: 'user', content: prompt }],
    stream: true,
  })

  for await (const event of stream) {
    if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
      yield event.delta.text
    }
  }
}

async function* generateGemini(prompt, systemPrompt) {
  const stream = await google.models.generateContentStream({
    model: 'gemini-3.1-pro-preview',
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    config: {
      systemInstruction: systemPrompt,
      temperature: 1.0,
      maxOutputTokens: 150,
    },
  })

  for await (const chunk of stream) {
    if (chunk.text) {
      yield chunk.text
    }
  }
}

export default { generate, setProvider }
