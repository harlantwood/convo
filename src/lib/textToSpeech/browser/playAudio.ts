type PlayAudioOptions = {
	response: Response
	onAudioEnded: () => void
}

export async function playAudio({ response, onAudioEnded }: PlayAudioOptions) {
	const blob = await response.blob()
	const url = URL.createObjectURL(blob)
	const audio = new Audio(url)
	audio.onended = onAudioEnded

	try {
		await audio.play()
	} catch (e) {
		console.error('Error playing audio:', e)
	}
}
