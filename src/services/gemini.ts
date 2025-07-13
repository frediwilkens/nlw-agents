import { GoogleGenAI } from '@google/genai'
import { env } from '../env.ts'

const gemini = new GoogleGenAI({
  apiKey: env.GEMINI_API_KEY,
})

const model = 'gemini-2.5-flash'

export async function transcribeAudio(audioAsBase64: string, mimeType: string) {
  const response = await gemini.models.generateContent({
    model,
    contents: [
      {
        text: 'Transcribe the audio to Brazilian Portuguese. Be precise and natural in your transcription. Keep punctuation and split the text in paragraphs when necessary.',
      },
      {
        inlineData: {
          mimeType,
          data: audioAsBase64,
        },
      },
    ],
  })

  if (!response.text) {
    throw new Error('Failed to transcribe audio')
  }

  return response.text
}

export async function generateEmbeddings(text: string) {
  const respone = await gemini.models.embedContent({
    model: 'text-embedding-004',
    contents: [{ text }],
    config: {
      taskType: 'RETRIEVAL_DOCUMENT',
    },
  })

  if (!respone.embeddings?.[0].values) {
    throw new Error('Failed to generate embeddings')
  }

  return respone.embeddings[0].values
}

export async function generateAnswer(
  question: string,
  transciptions: string[]
) {
  const context = transciptions.join('\n\n')

  const prompt = `
    based on the text provided below, answer the question in a concise and informative manner and in Brazilian Portuguese.
    
    
    Context:
    ${context}

    Question:
    ${question}

    Instructions:
    - use only the information provided in the context;
    - if the anser is not present in the context, answer with "Desculpe, não sei a resposta para essa pergunta.";
    - be objective;
    - answer in a polite and profissional manner;
    - Refer to relevant parts of the context when necessary.
    - if needed to use the context refer to it as "conteúdo fornecido"

  `.trim()

  const response = await gemini.models.generateContent({
    model,
    contents: [
      {
        text: prompt,
      },
    ],
  })

  if (!response.text) {
    throw new Error('Failed to generate answer')
  }

  return response.text
}
