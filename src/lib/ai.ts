// AI Integration with OpenAI API
import OpenAI from 'openai'

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'sk-d7NpAvcYfMU4PhhpvZhaPeIAQUgmd7Stqbm6yOjRg1y88cTD',
  dangerouslyAllowBrowser: true // Only for client-side usage
})

export interface SummaryResult {
  summary: string
  keyPoints: string[]
}

export interface QuizQuestion {
  question: string
  options: string[]
  correctAnswer: string
  explanation: string
}

export interface FlashcardItem {
  front: string
  back: string
}

/**
 * Generate a summary from document content using OpenAI
 * @param content - The document text content
 * @returns Promise<SummaryResult>
 */
export async function generateSummary(content: string): Promise<SummaryResult> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are an expert study assistant. Create a comprehensive summary and extract key points from the given text. Return your response in JSON format with 'summary' (a concise 2-3 sentence summary) and 'keyPoints' (an array of 5-7 important points)."
        },
        {
          role: "user",
          content: `Please summarize this text and extract key points:\n\n${content.substring(0, 4000)}` // Limit content to avoid token limits
        }
      ],
      temperature: 0.3,
      max_tokens: 1000
    })

    const aiResponse = response.choices[0]?.message?.content
    if (aiResponse) {
      try {
        const parsed = JSON.parse(aiResponse)
        return {
          summary: parsed.summary || "Summary generated successfully",
          keyPoints: parsed.keyPoints || ["Key points extracted"]
        }
      } catch {
        // If JSON parsing fails, extract summary from text
        const lines = aiResponse.split('\n').filter(line => line.trim())
        return {
          summary: lines[0] || "AI-generated summary",
          keyPoints: lines.slice(1, 6).map(line => line.replace(/^[-•*]\s*/, '').trim())
        }
      }
    }
  } catch (error) {
    console.error('Error generating summary:', error)
  }

  // Fallback to simple extraction if AI fails
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 10)
  const summary = sentences.slice(0, 3).join('. ') + '.'
  
  const keyPoints = sentences
    .slice(3, 8)
    .map(s => s.trim())
    .filter(s => s.length > 20)
    .slice(0, 5)
  
  return {
    summary,
    keyPoints
  }
}

/**
 * Generate quiz questions from document content using OpenAI
 * @param content - The document text content
 * @param count - Number of questions to generate (default: 5)
 * @returns Promise<QuizQuestion[]>
 */
export async function generateQuiz(content: string, count: number = 5): Promise<QuizQuestion[]> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are an expert educator creating quiz questions. Generate ${count} multiple-choice questions based on the given text. Each question should have 4 options (A, B, C, D) with only one correct answer. Return your response as a JSON array with objects containing: question, options (array of 4 strings), correctAnswer (the correct option text), and explanation.`
        },
        {
          role: "user",
          content: `Create ${count} quiz questions from this text:\n\n${content.substring(0, 4000)}`
        }
      ],
      temperature: 0.4,
      max_tokens: 2000
    })

    const aiResponse = response.choices[0]?.message?.content
    if (aiResponse) {
      try {
        const parsed = JSON.parse(aiResponse)
        if (Array.isArray(parsed)) {
          return parsed.map((q: any) => ({
            question: q.question || "Sample question",
            options: q.options || ["Option A", "Option B", "Option C", "Option D"],
            correctAnswer: q.correctAnswer || q.options?.[0] || "Option A",
            explanation: q.explanation || "Explanation not provided"
          }))
        }
      } catch {
        // If JSON parsing fails, create questions from text
        const lines = aiResponse.split('\n').filter(line => line.trim())
        const questions: QuizQuestion[] = []
        
        for (let i = 0; i < Math.min(count, Math.floor(lines.length / 6)); i++) {
          const startIdx = i * 6
          questions.push({
            question: lines[startIdx] || `Question ${i + 1}`,
            options: [
              lines[startIdx + 1] || "Option A",
              lines[startIdx + 2] || "Option B", 
              lines[startIdx + 3] || "Option C",
              lines[startIdx + 4] || "Option D"
            ],
            correctAnswer: lines[startIdx + 1] || "Option A",
            explanation: lines[startIdx + 5] || "Explanation not provided"
          })
        }
        return questions
      }
    }
  } catch (error) {
    console.error('Error generating quiz:', error)
  }

  // Fallback to placeholder questions
  const questions: QuizQuestion[] = []
  
  for (let i = 0; i < count; i++) {
    questions.push({
      question: `Sample question ${i + 1} about the document content?`,
      options: [
        `Option A for question ${i + 1}`,
        `Option B for question ${i + 1}`,
        `Option C for question ${i + 1}`,
        `Option D for question ${i + 1}`
      ],
      correctAnswer: `Option A for question ${i + 1}`,
      explanation: `This is a placeholder explanation for question ${i + 1}.`
    })
  }
  
  return questions
}

/**
 * Generate flashcards from document content using OpenAI
 * @param content - The document text content
 * @param count - Number of flashcards to generate (default: 10)
 * @returns Promise<FlashcardItem[]>
 */
export async function generateFlashcards(content: string, count: number = 10): Promise<FlashcardItem[]> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are an expert educator creating study flashcards. Generate ${count} flashcards based on the given text. Each flashcard should have a 'front' (term, concept, or question) and 'back' (definition, explanation, or answer). Return your response as a JSON array with objects containing 'front' and 'back' properties.`
        },
        {
          role: "user",
          content: `Create ${count} flashcards from this text:\n\n${content.substring(0, 4000)}`
        }
      ],
      temperature: 0.3,
      max_tokens: 2000
    })

    const aiResponse = response.choices[0]?.message?.content
    if (aiResponse) {
      try {
        const parsed = JSON.parse(aiResponse)
        if (Array.isArray(parsed)) {
          return parsed.map((card: any) => ({
            front: card.front || "Key concept",
            back: card.back || "Definition or explanation"
          }))
        }
      } catch {
        // If JSON parsing fails, create flashcards from text
        const lines = aiResponse.split('\n').filter(line => line.trim())
        const flashcards: FlashcardItem[] = []
        
        for (let i = 0; i < Math.min(count, Math.floor(lines.length / 2)); i++) {
          const frontIdx = i * 2
          const backIdx = frontIdx + 1
          flashcards.push({
            front: lines[frontIdx]?.replace(/^[-•*]\s*/, '').trim() || `Key concept ${i + 1}`,
            back: lines[backIdx]?.replace(/^[-•*]\s*/, '').trim() || `Definition for concept ${i + 1}`
          })
        }
        return flashcards
      }
    }
  } catch (error) {
    console.error('Error generating flashcards:', error)
  }

  // Fallback to placeholder flashcards
  const flashcards: FlashcardItem[] = []
  
  for (let i = 0; i < count; i++) {
    flashcards.push({
      front: `Key concept ${i + 1}`,
      back: `Definition or explanation for key concept ${i + 1}`
    })
  }
  
  return flashcards
}

/**
 * Extract text content from uploaded files
 * @param file - The uploaded file
 * @returns Promise<string>
 */
export async function extractTextFromFile(file: File): Promise<string> {
  try {
    if (file.type === 'text/plain') {
      return await file.text()
    }
    
    if (file.type === 'application/pdf') {
      // For PDF files, we'll use a simple approach
      // In a production app, you'd want to use a proper PDF parsing library
      const arrayBuffer = await file.arrayBuffer()
      const uint8Array = new Uint8Array(arrayBuffer)
      
      // Simple PDF text extraction (basic implementation)
      // This is a simplified version - for production, use pdf-parse or similar
      const text = new TextDecoder('utf-8', { ignoreBOM: true }).decode(uint8Array)
      
      // Extract text between BT and ET markers (PDF text objects)
      const textMatches = text.match(/BT[\s\S]*?ET/g)
      if (textMatches) {
        const extractedText = textMatches
          .map(match => {
            // Extract text between Tj and TJ markers
            const tjMatches = match.match(/\((.*?)\)\s*Tj/g)
            if (tjMatches) {
              return tjMatches.map(tj => tj.replace(/\((.*?)\)\s*Tj/, '$1')).join(' ')
            }
            return ''
          })
          .filter(t => t.trim().length > 0)
          .join(' ')
        
        if (extractedText.trim().length > 0) {
          return extractedText
        }
      }
      
      // Fallback: try to extract any readable text
      const readableText = text
        .replace(/[^\x20-\x7E\n\r]/g, ' ') // Remove non-printable characters
        .replace(/\s+/g, ' ') // Normalize whitespace
        .trim()
      
      if (readableText.length > 100) {
        return readableText
      }
      
      return `PDF content extracted from ${file.name}. The PDF may contain images or complex formatting that couldn't be fully extracted.`
    }
    
    if (file.type.includes('text/') || file.name.endsWith('.txt')) {
      return await file.text()
    }
    
    // For other file types, try to read as text
    try {
      return await file.text()
    } catch {
      return `Unable to extract text from ${file.name}. Please ensure the file contains readable text content.`
    }
    
  } catch (error) {
    console.error('Error extracting text from file:', error)
    return `Error extracting text from ${file.name}. Please try a different file format.`
  }
}

