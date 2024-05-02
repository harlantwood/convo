type PlayAudioOptions = {
	response: Response
	onAudioEnded: () => void
}

const audioInstances: HTMLAudioElement[] = []

export async function playAudio({ response, onAudioEnded }: PlayAudioOptions) {
	const blob = await response.blob()
	const url = URL.createObjectURL(blob)
	const audio = new Audio(url)
	audioInstances.push(audio)
	audio.onended = onAudioEnded

	try {
		await audio.play()
	} catch (e) {
		console.error('Error playing audio:', e)
	}
}

export function stopAllAudio() {
	for (const audioInstance of audioInstances) {
		if (audioInstance != null) {
			audioInstance.pause() // Stop the audio
			audioInstance.currentTime = 0 // Reset the audio position to the start
		}
	}
}
