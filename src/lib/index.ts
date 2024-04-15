import { playAudio as browserPlayAudio } from './textToSpeech/browser/playAudio'
import { response as serverOpenAiResponse } from './textToSpeech/server/openai'


export const tts = {
  browser: {playAudio: browserPlayAudio},
  server: {openai: {response: serverOpenAiResponse}}
}

// TODO fold into above API
export { speechToText} from './speechToText'
