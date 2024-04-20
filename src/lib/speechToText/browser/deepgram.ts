import { createClient, LiveTranscriptionEvents } from '@deepgram/sdk'
import type { LiveClient, LiveMetadataEvent, LiveTranscriptionEvent } from '@deepgram/sdk'

type CommonTranscriptionOptions = {
	onConnect: () => void
	onChunk: (
		chunk: string,
		metadata: { confidence: number; start: number; duration: number }
	) => void
	onEnd: () => void
	onError: (error: Error) => void
}

type TranscribeOptions = CommonTranscriptionOptions & {
	apiKey: string
}

type OpenTranscriptionOptions = CommonTranscriptionOptions

export function transcribe({ apiKey, onConnect, onChunk, onEnd, onError }: TranscribeOptions) {
	navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
		if (!MediaRecorder.isTypeSupported('audio/webm')) {
			throw new Error('Browser MediaRecorder does not support audio/webm format')
		}
		const mediaRecorder = new MediaRecorder(stream, {
			mimeType: 'audio/webm',
		})

		const deepgramClient = createClient(apiKey)

		const liveClient: LiveClient = deepgramClient.listen.live({
			model: 'nova-2',
			language: 'en-US',
			smart_format: true,
		})

		liveClient.on(LiveTranscriptionEvents.Open, () =>
			openTranscription(liveClient, mediaRecorder, {
				onConnect,
				onChunk,
				onEnd,
				onError,
			})
		)
	})
}

function openTranscription(
	liveClient: LiveClient,
	mediaRecorder: MediaRecorder,
	{ onConnect, onChunk, onEnd, onError }: OpenTranscriptionOptions
) {
	onConnect()

	mediaRecorder.addEventListener('dataavailable', async (event) => {
		if (event.data.size > 0) {
			liveClient.send(event.data)
		}
	})
	mediaRecorder.start(500) // slice size in milliseconds

	liveClient.on(LiveTranscriptionEvents.Close, () => {
		onEnd()
	})

	liveClient.on(LiveTranscriptionEvents.Transcript, (data: LiveTranscriptionEvent) => {
		const alternative = data.channel.alternatives[0]
		const { transcript, confidence } = alternative
		if (transcript != null && transcript.length > 0 && data.speech_final) {
			const metadata = { confidence, start: data.start, duration: data.duration }
			onChunk(transcript, metadata)
		}
	})

	liveClient.on(LiveTranscriptionEvents.Metadata, (data: LiveMetadataEvent) => {
		console.log('[metadata]', data)
	})

	liveClient.on(LiveTranscriptionEvents.Error, (errorEvent: unknown) => {
		onError(errorEvent)
	})
}
