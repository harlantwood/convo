import { zodSchema, toHtml } from './llm/structured.js'
import { playAudio as browserPlayAudio } from './textToSpeech/browser/audio.js'
import { stopAllAudio as browserStopAllAudio } from './textToSpeech/browser/audio.js'
import { response as serverOpenAiResponse } from './textToSpeech/server/openai.js'
import {
	transcribe as browserDeepgramTranscribe,
	stop as browserDeepgramStop,
} from './speechToText/browser/deepgram.js'

export const tts = {
	browser: {
		playAudio: browserPlayAudio,
		stopAllAudio: browserStopAllAudio,
	},
	server: {
		openai: {
			response: serverOpenAiResponse,
		},
	},
}

export const stt = {
	browser: {
		deepgram: {
			transcribe: browserDeepgramTranscribe,
			stop: browserDeepgramStop,
		},
	},
}

export const llm = {
	structure: {
		zodSchema,
		toHtml,
	},
}
