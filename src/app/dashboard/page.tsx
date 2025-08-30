'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/DashboardLayout'
import { 
  BookOpen, 
  Target, 
  Zap, 
  Clock, 
  TrendingUp,
  FileText,
  CheckCircle,
  Play,
  Upload
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Document, Quiz, Progress } from '@/lib/supabase'
import { formatDate } from '@/lib/utils'

export default function DashboardPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState({
    documents: 0,
    quizzes: 0,
    flashcards: 0,
    totalTime: 0
  })
  const [recentDocuments, setRecentDocuments] = useState<Document[]>([])
  const [recentProgress, setRecentProgress] = useState<Progress[]>([])

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/signin')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user) {
      fetchDashboardData()
    }
  }, [user])

  const fetchDashboardData = async () => {
    try {
      // Fetch documents count
      const { count: documentsCount } = await supabase
        .from('documents')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user?.id)

      // Fetch quizzes count
      const { count: quizzesCount } = await supabase
        .from('quizzes')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user?.id)

      // Fetch progress data
      const { data: progressData } = await supabase
        .from('progress')
        .select('*')
        .eq('user_id', user?.id)

      // Fetch recent documents
      const { data: documentsData } = await supabase
        .from('documents')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(5)

      // Fetch recent progress
      const { data: recentProgressData } = await supabase
        .from('progress')
        .select('*')
        .eq('user_id', user?.id)
        .order('last_accessed', { ascending: false })
        .limit(5)

      const totalTime = progressData?.reduce((sum, p) => sum + (p.time_spent || 0), 0) || 0

      setStats({
        documents: documentsCount || 0,
        quizzes: quizzesCount || 0,
        flashcards: 0, // TODO: Implement flashcards table
        totalTime
      })

      setRecentDocuments(documentsData || [])
      setRecentProgress(recentProgressData || [])
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
          <h1 className="text-2xl font-bold mb-2">
            Welcome back, {user.email?.split('@')[0]}!
          </h1>
          <p className="text-blue-100">
            Ready to continue your learning journey? Let's make today productive.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <BookOpen className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Documents</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.documents}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <Target className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Quizzes</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.quizzes}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <Zap className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Flashcards</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.flashcards}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                <Clock className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Study Time</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {Math.round(stats.totalTime / 60)}m
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Documents */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                <FileText className="h-5 w-5 mr-2 text-blue-600" />
                Recent Documents
              </h3>
            </div>
            <div className="p-6">
              {recentDocuments.length > 0 ? (
                <div className="space-y-4">
                  {recentDocuments.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 dark:text-white">{doc.title}</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {formatDate(doc.created_at)}
                        </p>
                      </div>
                      <button className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg">
                        <Play className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                  No documents yet. Upload your first document to get started!
                </p>
              )}
            </div>
          </div>

          {/* Study Progress */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
                Study Progress
              </h3>
            </div>
            <div className="p-6">
              {recentProgress.length > 0 ? (
                <div className="space-y-4">
                  {recentProgress.map((progress) => (
                    <div key={progress.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          Document {progress.document_id.slice(0, 8)}...
                        </h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {progress.quiz_score !== null ? `Quiz: ${progress.quiz_score}%` : 'No quiz taken'}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {Math.round(progress.time_spent / 60)}m
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                  No study progress yet. Start studying to see your progress!
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Quick Actions
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => router.push('/dashboard/upload')}
              className="p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors text-center"
            >
              <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="font-medium text-gray-900 dark:text-white">Upload Document</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Add new study material</p>
            </button>

            <button
              onClick={() => router.push('/dashboard/quizzes')}
              className="p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-purple-500 dark:hover:border-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors text-center"
            >
              <Target className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="font-medium text-gray-900 dark:text-white">Take Quiz</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Test your knowledge</p>
            </button>

            <button
              onClick={() => router.push('/dashboard/flashcards')}
              className="p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-green-500 dark:hover:border-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors text-center"
            >
              <Zap className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="font-medium text-gray-900 dark:text-white">Study Flashcards</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Review key concepts</p>
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}


