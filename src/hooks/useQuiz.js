import { useEffect, useState } from 'react'
import useAuth from './useAuth'
import { supabase } from '../lib/supabase'

export default function useQuiz(quizId) {
  const { session } = useAuth()
  const teacherId = session?.user?.id
  const [quiz, setQuiz] = useState(null)
  const [classes, setClasses] = useState([])
  const [questions, setQuestions] = useState([])

  useEffect(() => {
    if (!quizId || !teacherId) {
      setQuiz(null)
      setClasses([])
      setQuestions([])
      return
    }
    ;(async () => {
      const { data: q } = await supabase
        .from('quizzes')
        .select('*')
        .eq('id', quizId)
        .eq('teacher_id', teacherId)
        .maybeSingle()
      if (!q) {
        setQuiz(null)
        setClasses([])
        setQuestions([])
        return
      }
      const { data: c } = await supabase.from('quiz_classes').select('*').eq('quiz_id', quizId)
      const { data: qu } = await supabase.from('questions').select('*, options(*)').eq('quiz_id', quizId).order('order_index')
      setQuiz(q)
      setClasses(c ?? [])
      setQuestions(qu ?? [])
    })()
  }, [quizId, teacherId])

  return { quiz, classes, questions }
}
