export function speechToText(transcriptChunks: string[],
  options: Record<string, any>
) {
  console.log({transcriptChunks, options})
  navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
    if (!MediaRecorder.isTypeSupported('audio/webm')) {
      throw new Error('Browser MediaRecorder does not support audio/webm format')
    }
    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: 'audio/webm',
    })
    const socket = new WebSocket('wss://api.deepgram.com/v1/listen', [
      'token',
      options.apiKey,
    ])
    socket.onopen = () => {
      options.onConnect()
      mediaRecorder.addEventListener('dataavailable', async (event) => {
        if (event.data.size > 0 && socket.readyState == 1) {
          socket.send(event.data)
        }
      })
      mediaRecorder.start(1000)
    }

    socket.onmessage = (message) => {
      const received = JSON.parse(message.data)
      const transcript = received.channel.alternatives[0].transcript
      if (transcript && received.is_final) {
        console.log('chunk: '+ transcript)
        transcriptChunks.push(transcript)
      }
    }

    socket.onclose = options.onEnd
    socket.onerror = options.onError
  })
}
