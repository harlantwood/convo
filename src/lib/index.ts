import { zodSchema, objectToHtml } from './llm/structured'
import { playAudio as browserPlayAudio } from './textToSpeech/browser/audio'
import { stopAllAudio as browserStopAllAudio } from './textToSpeech/browser/audio'
import { response as serverOpenAiResponse } from './textToSpeech/server/openai'
import {
	transcribe as browserDeepgramTranscribe,
	stop as browserDeepgramStop,
} from './speechToText/browser/deepgram'

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
		objectToHtml,
	},
}
