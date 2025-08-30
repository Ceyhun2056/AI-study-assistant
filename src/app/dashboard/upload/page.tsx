'use client'

import { useState, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useDropzone } from 'react-dropzone'
import DashboardLayout from '@/components/DashboardLayout'
import { 
  Upload, 
  FileText, 
  File, 
  X, 
  CheckCircle,
  Loader2,
  Brain,
  Target,
  Zap
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { generateSummary, generateQuiz, generateFlashcards, extractTextFromFile } from '@/lib/ai'
import { formatFileSize } from '@/lib/utils'
import toast from 'react-hot-toast'

interface UploadedFile {
  id: string
  file: File
  status: 'uploading' | 'processing' | 'completed' | 'error'
  progress: number
  summary?: string
  quizzes?: any[]
  flashcards?: any[]
}

export default function UploadPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [isProcessing, setIsProcessing] = useState(false)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      status: 'uploading' as const,
      progress: 0
    }))
    
    setUploadedFiles(prev => [...prev, ...newFiles])
    
    // Process each file
    newFiles.forEach(fileObj => processFile(fileObj))
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    multiple: true
  })

  const processFile = async (fileObj: UploadedFile) => {
    try {
      // Update status to processing
      setUploadedFiles(prev => 
        prev.map(f => f.id === fileObj.id ? { ...f, status: 'processing' } : f)
      )

      // Extract text from file
      const textContent = await extractTextFromFile(fileObj.file)
      
      // Generate AI content (placeholders for now)
      const [summaryResult, quizResult, flashcardResult] = await Promise.all([
        generateSummary(textContent),
        generateQuiz(textContent, 5),
        generateFlashcards(textContent, 10)
      ])

      // Upload file to Supabase Storage
      const fileName = `${Date.now()}-${fileObj.file.name}`
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, fileObj.file)

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(fileName)

      // Save document metadata to database
      const { data: documentData, error: documentError } = await supabase
        .from('documents')
        .insert([
          {
            user_id: user?.id,
            file_url: publicUrl,
            title: fileObj.file.name,
            summary: summaryResult.summary
          }
        ])
        .select()
        .single()

      if (documentError) throw documentError

      // Save quizzes to database
      if (quizResult.length > 0) {
        const quizData = quizResult.map(quiz => ({
          document_id: documentData.id,
          question: quiz.question,
          options: quiz.options,
          correct_answer: quiz.correctAnswer
        }))

        const { error: quizError } = await supabase
          .from('quizzes')
          .insert(quizData)

        if (quizError) console.error('Error saving quizzes:', quizError)
      }

      // Update file status to completed
      setUploadedFiles(prev => 
        prev.map(f => f.id === fileObj.id ? { 
          ...f, 
          status: 'completed',
          summary: summaryResult.summary,
          quizzes: quizResult,
          flashcards: flashcardResult
        } : f)
      )

      toast.success(`${fileObj.file.name} processed successfully!`)
    } catch (error) {
      console.error('Error processing file:', error)
      setUploadedFiles(prev => 
        prev.map(f => f.id === fileObj.id ? { ...f, status: 'error' } : f)
      )
      toast.error(`Error processing ${fileObj.file.name}`)
    }
  }

  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId))
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'uploading':
        return <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
      case 'processing':
        return <Brain className="h-5 w-5 animate-pulse text-purple-600" />
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'error':
        return <X className="h-5 w-5 text-red-600" />
      default:
        return <File className="h-5 w-5 text-gray-600" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'uploading':
        return 'Uploading...'
      case 'processing':
        return 'AI Processing...'
      case 'completed':
        return 'Completed'
      case 'error':
        return 'Error'
      default:
        return 'Ready'
    }
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Upload Documents
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Upload your study materials and let AI generate summaries, quizzes, and flashcards.
          </p>
        </div>

        {/* Upload Area */}
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
            ${isDragActive 
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
              : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
            }
          `}
        >
          <input {...getInputProps()} />
          <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {isDragActive ? 'Drop files here' : 'Drag & drop files here'}
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            or click to select files
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Supports PDF, TXT, DOC, DOCX files
          </p>
        </div>

        {/* File List */}
        {uploadedFiles.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Uploaded Files
            </h3>
            
            {uploadedFiles.map((fileObj) => (
              <div
                key={fileObj.id}
                className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <FileText className="h-5 w-5 text-gray-400" />
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {fileObj.file.name}
                      </h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {formatFileSize(fileObj.file.size)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(fileObj.status)}
                      <span className="text-sm text-gray-600 dark:text-gray-300">
                        {getStatusText(fileObj.status)}
                      </span>
                    </div>
                    
                    <button
                      onClick={() => removeFile(fileObj.id)}
                      className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Progress Bar */}
                {fileObj.status === 'uploading' && (
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${fileObj.progress}%` }}
                    />
                  </div>
                )}

                {/* AI Generated Content Preview */}
                {fileObj.status === 'completed' && (
                  <div className="mt-4 space-y-3">
                    {fileObj.summary && (
                      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                        <h5 className="font-medium text-blue-900 dark:text-blue-100 mb-2 flex items-center">
                          <Brain className="h-4 w-4 mr-2" />
                          AI Summary
                        </h5>
                        <p className="text-sm text-blue-800 dark:text-blue-200">
                          {fileObj.summary}
                        </p>
                      </div>
                    )}
                    
                    {fileObj.quizzes && fileObj.quizzes.length > 0 && (
                      <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3">
                        <h5 className="font-medium text-purple-900 dark:text-purple-100 mb-2 flex items-center">
                          <Target className="h-4 w-4 mr-2" />
                          Generated Quizzes
                        </h5>
                        <p className="text-sm text-purple-800 dark:text-purple-200">
                          {fileObj.quizzes.length} quiz questions created
                        </p>
                      </div>
                    )}
                    
                    {fileObj.flashcards && fileObj.flashcards.length > 0 && (
                      <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
                        <h5 className="font-medium text-green-900 dark:text-green-100 mb-2 flex items-center">
                          <Zap className="h-4 w-4 mr-2" />
                          Generated Flashcards
                        </h5>
                        <p className="text-sm text-green-800 dark:text-green-200">
                          {fileObj.flashcards.length} flashcards created
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Error State */}
                {fileObj.status === 'error' && (
                  <div className="mt-4 bg-red-50 dark:bg-red-900/20 rounded-lg p-3">
                    <p className="text-sm text-red-800 dark:text-red-200">
                      There was an error processing this file. Please try again.
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Next Steps */}
        {uploadedFiles.some(f => f.status === 'completed') && (
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">
              What's Next?
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => router.push('/dashboard/quizzes')}
                className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-blue-200 dark:border-blue-700 hover:border-blue-300 dark:hover:border-blue-600 transition-colors text-center"
              >
                <Target className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                <p className="font-medium text-blue-900 dark:text-blue-100">Take Quizzes</p>
                <p className="text-sm text-blue-700 dark:text-blue-200">Test your knowledge</p>
              </button>
              
              <button
                onClick={() => router.push('/dashboard/flashcards')}
                className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-blue-200 dark:border-blue-700 hover:border-blue-300 dark:hover:border-blue-600 transition-colors text-center"
              >
                <Zap className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <p className="font-medium text-blue-900 dark:text-blue-100">Study Flashcards</p>
                <p className="text-sm text-blue-700 dark:text-blue-200">Review key concepts</p>
              </button>
              
              <button
                onClick={() => router.push('/dashboard/documents')}
                className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-blue-200 dark:border-blue-700 hover:border-blue-300 dark:hover:border-blue-600 transition-colors text-center"
              >
                <FileText className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <p className="font-medium text-blue-900 dark:text-blue-100">View Documents</p>
                <p className="text-sm text-blue-700 dark:text-blue-200">Browse your library</p>
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}


