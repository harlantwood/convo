import OpenAI from 'openai'
import { Buffer } from 'buffer/'

export async function response(
	input: string,
	{ model, voice, apiKey }: { model: string; voice: string; apiKey: string }
) {
	const openai = new OpenAI({ apiKey })

	const mp3 = await openai.audio.speech.create({
		model,
		voice,
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
