import OpenAI from 'openai'
import { Buffer } from 'buffer/'

export async function response( input, {model, voice, apiKey}) {
  const openai = new OpenAI({ apiKey })

  const mp3 = await openai.audio.speech.create({
    model: 'tts-1',
    voice: 'alloy',
    input,
  })

  const buffer = Buffer.from(await mp3.arrayBuffer())

  return new Response(buffer, {
    status: 200,
    headers: {
      'Content-Type': 'audio/mpeg',
    },
  })
}
