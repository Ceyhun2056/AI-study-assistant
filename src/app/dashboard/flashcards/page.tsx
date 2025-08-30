'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter, useSearchParams } from 'next/navigation'
import DashboardLayout from '@/components/DashboardLayout'
import { 
  Zap, 
  ChevronLeft, 
  ChevronRight, 
  RotateCcw, 
  Shuffle,
  BookOpen,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Document } from '@/lib/supabase'
import { generateFlashcards } from '@/lib/ai'
import toast from 'react-hot-toast'

interface Flashcard {
  id: string
  front: string
  back: string
  document_id: string
}

interface FlashcardSession {
  documentId: string
  cards: Flashcard[]
  currentIndex: number
  isFlipped: boolean
  studyMode: 'normal' | 'shuffled'
  completedCards: Set<string>
}

export default function FlashcardsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const documentId = searchParams.get('document')
  
  const [documents, setDocuments] = useState<Document[]>([])
  const [flashcards, setFlashcards] = useState<Flashcard[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDocument, setSelectedDocument] = useState<string>('')
  const [activeSession, setActiveSession] = useState<FlashcardSession | null>(null)
  const [showAnswer, setShowAnswer] = useState(false)

  useEffect(() => {
    if (user) {
      fetchData()
    }
  }, [user])

  useEffect(() => {
    if (documentId) {
      setSelectedDocument(documentId)
    }
  }, [documentId])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Fetch documents
      const { data: documentsData } = await supabase
        .from('documents')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })

      setDocuments(documentsData || [])
      
      // For now, generate placeholder flashcards
      // In a real app, these would come from the database
      const placeholderFlashcards: Flashcard[] = []
      documentsData?.forEach(doc => {
        for (let i = 0; i < 5; i++) {
          placeholderFlashcards.push({
            id: `${doc.id}-${i}`,
            front: `Key concept ${i + 1} from ${doc.title}`,
            back: `This is the definition or explanation for key concept ${i + 1} from the document "${doc.title}". This would contain the actual AI-generated content.`,
            document_id: doc.id
          })
        }
      })
      
      setFlashcards(placeholderFlashcards)
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Failed to fetch flashcards')
    } finally {
      setLoading(false)
    }
  }

  const startFlashcardSession = (documentId: string, mode: 'normal' | 'shuffled' = 'normal') => {
    const documentCards = flashcards.filter(f => f.document_id === documentId)
    if (documentCards.length === 0) {
      toast.error('No flashcards available for this document')
      return
    }

    const sessionCards = mode === 'shuffled' 
      ? [...documentCards].sort(() => Math.random() - 0.5)
      : documentCards

    const session: FlashcardSession = {
      documentId,
      cards: sessionCards,
      currentIndex: 0,
      isFlipped: false,
      studyMode: mode,
      completedCards: new Set()
    }

    setActiveSession(session)
    setShowAnswer(false)
  }

  const nextCard = () => {
    if (!activeSession) return

    const nextIndex = activeSession.currentIndex + 1
    if (nextIndex < activeSession.cards.length) {
      setActiveSession({
        ...activeSession,
        currentIndex: nextIndex,
        isFlipped: false
      })
      setShowAnswer(false)
    } else {
      // Session completed
      toast.success('Flashcard session completed!')
      setActiveSession(null)
    }
  }

  const previousCard = () => {
    if (!activeSession || activeSession.currentIndex === 0) return

    setActiveSession({
      ...activeSession,
      currentIndex: activeSession.currentIndex - 1,
      isFlipped: false
    })
    setShowAnswer(false)
  }

  const flipCard = () => {
    if (!activeSession) return
    setActiveSession({
      ...activeSession,
      isFlipped: !activeSession.isFlipped
    })
    setShowAnswer(!showAnswer)
  }

  const markAsKnown = () => {
    if (!activeSession) return
    
    const currentCard = activeSession.cards[activeSession.currentIndex]
    const updatedCompletedCards = new Set(activeSession.completedCards)
    updatedCompletedCards.add(currentCard.id)

    setActiveSession({
      ...activeSession,
      completedCards: updatedCompletedCards
    })

    // Move to next card
    nextCard()
  }

  const markAsUnknown = () => {
    if (!activeSession) return
    
    // Move to next card without marking as completed
    nextCard()
  }

  const resetSession = () => {
    if (!activeSession) return
    
    setActiveSession({
      ...activeSession,
      currentIndex: 0,
      isFlipped: false,
      completedCards: new Set()
    })
    setShowAnswer(false)
  }

  const shuffleSession = () => {
    if (!activeSession) return
    
    const shuffledCards = [...activeSession.cards].sort(() => Math.random() - 0.5)
    setActiveSession({
      ...activeSession,
      cards: shuffledCards,
      currentIndex: 0,
      isFlipped: false,
      completedCards: new Set()
    })
    setShowAnswer(false)
  }

  const getDocumentStats = (docId: string) => {
    const docCards = flashcards.filter(f => f.document_id === docId)
    return {
      totalCards: docCards.length,
      completedCards: 0 // TODO: Implement progress tracking
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-300">Loading flashcards...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Flashcards
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Study key concepts with AI-generated flashcards from your documents
          </p>
        </div>

        {/* Document Selection */}
        {!activeSession && (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Select Document
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {documents.map((doc) => {
                const stats = getDocumentStats(doc.id)
                return (
                  <div
                    key={doc.id}
                    className="p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-green-400 dark:hover:border-green-500 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                          {doc.title.length > 25 ? doc.title.substring(0, 25) + '...' : doc.title}
                        </h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                          {stats.totalCards} flashcards
                        </p>
                        <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-300">
                          <span className="flex items-center">
                            <BookOpen className="h-4 w-4 mr-1" />
                            {stats.totalCards} cards
                          </span>
                        </div>
                      </div>
                      <Zap className="h-8 w-8 text-green-600" />
                    </div>

                    <div className="space-y-2">
                      <button
                        onClick={() => startFlashcardSession(doc.id, 'normal')}
                        className="w-full btn-primary flex items-center justify-center"
                      >
                        <BookOpen className="h-4 w-4 mr-2" />
                        Start Studying
                      </button>
                      <button
                        onClick={() => startFlashcardSession(doc.id, 'shuffled')}
                        className="w-full btn-secondary flex items-center justify-center"
                      >
                        <Shuffle className="h-4 w-4 mr-2" />
                        Shuffled Mode
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Flashcard Interface */}
        {activeSession && (
          <div className="max-w-4xl mx-auto">
            {/* Session Header */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {documents.find(d => d.id === activeSession.documentId)?.title}
                </h2>
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-600 dark:text-gray-300">
                    {activeSession.currentIndex + 1} of {activeSession.cards.length}
                  </span>
                  <span className="text-sm text-gray-600 dark:text-gray-300">
                    {activeSession.completedCards.size} completed
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-green-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${((activeSession.currentIndex + 1) / activeSession.cards.length) * 100}%` }}
                />
              </div>

              {/* Session Controls */}
              <div className="flex items-center justify-center space-x-4 mt-4">
                <button
                  onClick={resetSession}
                  className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"
                  title="Reset session"
                >
                  <RotateCcw className="h-5 w-5" />
                </button>
                <button
                  onClick={shuffleSession}
                  className="p-2 text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg"
                  title="Shuffle cards"
                >
                  <Shuffle className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Flashcard */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8">
              <div className="max-w-2xl mx-auto">
                {/* Card Navigation */}
                <div className="flex items-center justify-between mb-6">
                  <button
                    onClick={previousCard}
                    disabled={activeSession.currentIndex === 0}
                    className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </button>
                  
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {activeSession.currentIndex + 1} / {activeSession.cards.length}
                  </span>
                  
                  <button
                    onClick={nextCard}
                    disabled={activeSession.currentIndex === activeSession.cards.length - 1}
                    className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </button>
                </div>

                {/* Flashcard Content */}
                <div className="min-h-[300px] flex items-center justify-center">
                  <div
                    onClick={flipCard}
                    className="w-full max-w-lg cursor-pointer perspective-1000"
                  >
                    <div className={`
                      relative w-full h-64 transition-transform duration-500 transform-style-preserve-3d
                      ${activeSession.isFlipped ? 'rotate-y-180' : ''}
                    `}>
                      {/* Front of card */}
                      <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-2 border-blue-200 dark:border-blue-700 rounded-lg p-8 flex items-center justify-center backface-hidden">
                        <div className="text-center">
                          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                            {activeSession.cards[activeSession.currentIndex].front}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Click to reveal answer
                          </p>
                        </div>
                      </div>

                      {/* Back of card */}
                      <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 border-2 border-green-200 dark:border-green-700 rounded-lg p-8 flex items-center justify-center backface-hidden rotate-y-180">
                        <div className="text-center">
                          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                            {activeSession.cards[activeSession.currentIndex].back}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Click to hide answer
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="flex items-center justify-center space-x-4 mt-8">
                  <button
                    onClick={markAsUnknown}
                    className="px-6 py-3 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/40 transition-colors flex items-center space-x-2"
                  >
                    <XCircle className="h-5 w-5" />
                    <span>Need More Practice</span>
                  </button>
                  
                  <button
                    onClick={markAsKnown}
                    className="px-6 py-3 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/40 transition-colors flex items-center space-x-2"
                  >
                    <CheckCircle className="h-5 w-5" />
                    <span>Got It!</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!activeSession && documents.length === 0 && (
          <div className="text-center py-12">
            <Zap className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No flashcards available
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Upload documents to generate AI-powered flashcards
            </p>
            <button
              onClick={() => router.push('/dashboard/upload')}
              className="btn-primary"
            >
              Upload Document
            </button>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}


