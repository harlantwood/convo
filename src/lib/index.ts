import { playAudio as browserPlayAudio } from './textToSpeech/browser/playAudio'
import { response as serverOpenAiResponse } from './textToSpeech/server/openai'
import {
	transcribe as browserDeepgramTranscribe,
	stop as browserDeepgramStop,
} from './speechToText/browser/deepgram'

export const tts = {
	browser: { playAudio: browserPlayAudio },
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
