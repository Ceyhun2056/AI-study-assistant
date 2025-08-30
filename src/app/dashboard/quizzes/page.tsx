'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter, useSearchParams } from 'next/navigation'
import DashboardLayout from '@/components/DashboardLayout'
import { 
  Target, 
  Play, 
  CheckCircle, 
  XCircle, 
  ArrowRight,
  Clock,
  BarChart3,
  BookOpen
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Quiz, Document } from '@/lib/supabase'
import { formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'

interface QuizWithDocument extends Quiz {
  document: Document
}

interface QuizSession {
  quizId: string
  currentQuestion: number
  answers: string[]
  score: number
  startTime: number
}

export default function QuizzesPage() {
  const { user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const documentId = searchParams.get('document')
  
  const [quizzes, setQuizzes] = useState<QuizWithDocument[]>([])
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDocument, setSelectedDocument] = useState<string>('')
  const [activeQuiz, setActiveQuiz] = useState<QuizSession | null>(null)
  const [currentQuestion, setCurrentQuestion] = useState<QuizWithDocument | null>(null)

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

      // Fetch quizzes with document info
      const { data: quizzesData } = await supabase
        .from('quizzes')
        .select(`
          *,
          document:documents(*)
        `)
        .eq('documents.user_id', user?.id)

      setDocuments(documentsData || [])
      setQuizzes(quizzesData || [])
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Failed to fetch quizzes')
    } finally {
      setLoading(false)
    }
  }

  const startQuiz = (documentId: string) => {
    const documentQuizzes = quizzes.filter(q => q.document_id === documentId)
    if (documentQuizzes.length === 0) {
      toast.error('No quizzes available for this document')
      return
    }

    const quizSession: QuizSession = {
      quizId: documentId,
      currentQuestion: 0,
      answers: new Array(documentQuizzes.length).fill(''),
      score: 0,
      startTime: Date.now()
    }

    setActiveQuiz(quizSession)
    setCurrentQuestion(documentQuizzes[0])
  }

  const answerQuestion = (answer: string) => {
    if (!activeQuiz || !currentQuestion) return

    const updatedAnswers = [...activeQuiz.answers]
    updatedAnswers[activeQuiz.currentQuestion] = answer

    const isCorrect = answer === currentQuestion.correct_answer
    const newScore = isCorrect ? activeQuiz.score + 1 : activeQuiz.score

    const updatedQuiz = {
      ...activeQuiz,
      answers: updatedAnswers,
      score: newScore
    }

    setActiveQuiz(updatedQuiz)

    // Move to next question or finish quiz
    if (activeQuiz.currentQuestion < quizzes.filter(q => q.document_id === activeQuiz.quizId).length - 1) {
      const nextQuestionIndex = activeQuiz.currentQuestion + 1
      const nextQuestion = quizzes.filter(q => q.document_id === activeQuiz.quizId)[nextQuestionIndex]
      setCurrentQuestion(nextQuestion)
      setActiveQuiz({ ...updatedQuiz, currentQuestion: nextQuestionIndex })
    } else {
      finishQuiz(updatedQuiz)
    }
  }

  const finishQuiz = async (quizSession: QuizSession) => {
    try {
      const totalQuestions = quizzes.filter(q => q.document_id === quizSession.quizId).length
      const percentage = Math.round((quizSession.score / totalQuestions) * 100)
      const timeSpent = Math.round((Date.now() - quizSession.startTime) / 1000)

      // Save progress to database
      const { error } = await supabase
        .from('progress')
        .upsert([
          {
            user_id: user?.id,
            document_id: quizSession.quizId,
            quiz_score: percentage,
            time_spent: timeSpent,
            last_accessed: new Date().toISOString()
          }
        ])

      if (error) throw error

      toast.success(`Quiz completed! Score: ${percentage}%`)
      setActiveQuiz(null)
      setCurrentQuestion(null)
      
      // Refresh data
      fetchData()
    } catch (error) {
      console.error('Error saving quiz results:', error)
      toast.error('Failed to save quiz results')
    }
  }

  const getFilteredQuizzes = () => {
    if (selectedDocument) {
      return quizzes.filter(q => q.document_id === selectedDocument)
    }
    return quizzes
  }

  const getDocumentStats = (docId: string) => {
    const docQuizzes = quizzes.filter(q => q.document_id === docId)
    const completedQuizzes = docQuizzes.length > 0 ? 1 : 0 // For now, just count if quizzes exist
    
    return {
      totalQuizzes: docQuizzes.length,
      completedQuizzes
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-300">Loading quizzes...</p>
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
            Quizzes
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Test your knowledge with AI-generated quizzes from your study materials
          </p>
        </div>

        {/* Document Filter */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Select Document
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <button
              onClick={() => setSelectedDocument('')}
              className={`p-4 rounded-lg border-2 text-left transition-colors ${
                selectedDocument === ''
                  ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">All Documents</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {quizzes.length} total quizzes
                  </p>
                </div>
                <Target className="h-5 w-5 text-purple-600" />
              </div>
            </button>

            {documents.map((doc) => {
              const stats = getDocumentStats(doc.id)
              return (
                <button
                  key={doc.id}
                  onClick={() => setSelectedDocument(doc.id)}
                  className={`p-4 rounded-lg border-2 text-left transition-colors ${
                    selectedDocument === doc.id
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {doc.title.length > 20 ? doc.title.substring(0, 20) + '...' : doc.title}
                      </h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {stats.totalQuizzes} quizzes
                      </p>
                    </div>
                    <BookOpen className="h-5 w-5 text-purple-600" />
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Quiz Interface */}
        {activeQuiz && currentQuestion ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8">
            <div className="max-w-2xl mx-auto">
              {/* Quiz Header */}
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Quiz: {currentQuestion.document?.title}
                </h2>
                <div className="flex items-center justify-center space-x-4 text-sm text-gray-600 dark:text-gray-300">
                  <span>Question {activeQuiz.currentQuestion + 1} of {activeQuiz.answers.length}</span>
                  <span>Score: {activeQuiz.score}</span>
                  <span className="flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    {Math.round((Date.now() - activeQuiz.startTime) / 1000)}s
                  </span>
                </div>
              </div>

              {/* Question */}
              <div className="mb-8">
                <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-6">
                  {currentQuestion.question}
                </h3>
                
                <div className="space-y-3">
                  {currentQuestion.options.map((option, index) => (
                    <button
                      key={index}
                      onClick={() => answerQuestion(option)}
                      className="w-full p-4 text-left border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-purple-500 dark:hover:border-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
                    >
                      <span className="font-medium text-gray-900 dark:text-white">
                        {String.fromCharCode(65 + index)}. {option}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-4">
                <div 
                  className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${((activeQuiz.currentQuestion + 1) / activeQuiz.answers.length) * 100}%` }}
                />
              </div>
            </div>
          </div>
        ) : (
          /* Quiz List */
          <div className="space-y-6">
            {getFilteredQuizzes().length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {documents
                  .filter(doc => !selectedDocument || doc.id === selectedDocument)
                  .map((doc) => {
                    const docQuizzes = quizzes.filter(q => q.document_id === doc.id)
                    if (docQuizzes.length === 0) return null

                    return (
                      <div
                        key={doc.id}
                        className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                              {doc.title}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                              {docQuizzes.length} quiz questions
                            </p>
                            <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-300">
                              <span className="flex items-center">
                                <BarChart3 className="h-4 w-4 mr-1" />
                                {docQuizzes.length} questions
                              </span>
                            </div>
                          </div>
                          <Target className="h-8 w-8 text-purple-600" />
                        </div>

                        <button
                          onClick={() => startQuiz(doc.id)}
                          className="w-full btn-primary flex items-center justify-center"
                        >
                          <Play className="h-4 w-4 mr-2" />
                          Start Quiz
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </button>
                      </div>
                    )
                  })}
              </div>
            ) : (
              <div className="text-center py-12">
                <Target className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  {selectedDocument ? 'No quizzes for this document' : 'No quizzes available'}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  {selectedDocument 
                    ? 'This document doesn\'t have any quizzes yet'
                    : 'Upload documents to generate AI-powered quizzes'
                  }
                </p>
                {!selectedDocument && (
                  <button
                    onClick={() => router.push('/dashboard/upload')}
                    className="btn-primary"
                  >
                    Upload Document
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}


