export const runtime = 'nodejs'

import Anthropic from '@anthropic-ai/sdk'
import { NextRequest } from 'next/server'
import { DIMENSIONS } from '@/lib/constants'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  const { question, context, sector = 'default' } = await req.json()

  if (!question || typeof question !== 'string') {
    return new Response(JSON.stringify({ error: 'question is required' }), { status: 400 })
  }

  const states = Array.isArray(context) ? context : [context]
  const stateDesc = states.map((s: Record<string, unknown>) => {
    const subscores = s.subscores as Record<string, number>
    return `
State: ${s.state} | Score: ${s.score}/100 | Rank: ${s.rank}/36 | Band: ${s.band} | Confidence: ${s.confidence}%
Subscores: ${DIMENSIONS.map(d => `${d.label}: ${subscores?.[d.key]?.toFixed(1) ?? 'N/A'}`).join(', ')}`
  }).join('\n')

  const systemPrompt = `You are an expert supply chain analyst specialising in Indian retail logistics and distribution networks.

Active sector preset: ${sector}
${stateDesc}

Rules:
- Reference specific subscores (0 = low risk, 100 = high risk) when explaining risks
- If data was estimated/imputed, acknowledge uncertainty briefly
- Keep answers under 130 words unless the user asks for detail
- Be direct — this is a decision support tool for business and policy professionals
- Do not hedge excessively; give clear recommendations when asked`

  const stream = await client.messages.stream({
    model: 'claude-sonnet-4-6',
    max_tokens: 512,
    system: systemPrompt,
    messages: [{ role: 'user', content: question }],
  })

  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
          controller.enqueue(new TextEncoder().encode(chunk.delta.text))
        }
      }
      controller.close()
    },
  })

  return new Response(readable, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
