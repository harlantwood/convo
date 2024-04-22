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
	onWarn: (message: string) => void
}

type TranscribeOptions = CommonTranscriptionOptions & {
	apiKey: string
}

type OpenTranscriptionOptions = CommonTranscriptionOptions

let mediaRecorder: MediaRecorder | null = null
let liveClient: LiveClient | null = null

export async function transcribe({
	apiKey,
	onConnect,
	onChunk,
	onEnd,
	onWarn,
	onError,
}: TranscribeOptions) {
	if (mediaRecorder == null) {
		const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

		if (!MediaRecorder.isTypeSupported('audio/webm')) {
			throw new Error('Browser MediaRecorder does not support audio/webm format')
		}
		mediaRecorder = new MediaRecorder(stream, {
			mimeType: 'audio/webm',
		})
	}

	if (liveClient == null) {
		const deepgramClient = createClient(apiKey)

		liveClient = deepgramClient.listen.live({
			model: 'nova-2',
			language: 'en-US',
			smart_format: true,
		})
	}

	liveClient.on(LiveTranscriptionEvents.Open, () => {
		openTranscription({
			onConnect,
			onChunk,
			onEnd,
			onWarn,
			onError,
		})
	})
}

function openTranscription({
	onConnect,
	onChunk,
	onEnd,
	onWarn,
	onError,
}: OpenTranscriptionOptions) {
	onConnect()

	mediaRecorder!.addEventListener('dataavailable', sendAudioToDeepgram)
	mediaRecorder!.start(500) // slice size in milliseconds

	liveClient!.on(LiveTranscriptionEvents.Close, () => {
		onEnd()
	})

	liveClient!.on(LiveTranscriptionEvents.Transcript, (data: LiveTranscriptionEvent) => {
		const alternative = data.channel.alternatives[0]
		const { transcript, confidence } = alternative
		if (transcript != null && transcript.length > 0 && data.speech_final) {
			const metadata = { confidence, start: data.start, duration: data.duration }
			onChunk(transcript, metadata)
		}
	})

	liveClient!.on(LiveTranscriptionEvents.Metadata, (data: LiveMetadataEvent) => {
		console.log('[metadata]', data)
	})

	liveClient!.on(LiveTranscriptionEvents.Warning, (message: string) => {
		onWarn(message)
	})

	liveClient!.on(LiveTranscriptionEvents.Error, (errorEvent: unknown) => {
		onError(errorEvent)
	})
}

export function stop() {
	mediaRecorder?.stop()
	mediaRecorder?.removeEventListener('dataavailable', sendAudioToDeepgram)
	liveClient?.finish()
}

function sendAudioToDeepgram(event: BlobEvent) {
	if (event.data.size > 0) {
		liveClient!.send(event.data)
	}
}
