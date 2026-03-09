import { Router } from 'express'
import { register, login, refresh, logout } from '../controllers/auth.controller'
import { getWorkbooks, createWorkbook, getWorksheets, createWorksheet, updateWorksheet, deleteWorksheet } from '../controllers/workbook.controller'
import { getQuestions, createQuestion, updateQuestion, deleteQuestion } from '../controllers/question.controller'
import {
  getMyAnswer, saveAnswer, getAnswer, getAnswersByWorksheet,
  addAnnotation, updateAnnotation, deleteAnnotation,
  submitGrade, reviewGrade, getPendingGrades
} from '../controllers/answer.controller'
import { authenticate, requireRole } from '../middleware/auth'

const router = Router()

router.post('/auth/register', register)
router.post('/auth/login', login)
router.post('/auth/refresh', refresh)
router.post('/auth/logout', logout)

router.get('/workbooks', authenticate, getWorkbooks)
router.post('/workbooks', authenticate, requireRole('DIRECTOR'), createWorkbook)

router.get('/workbooks/:workbookId/worksheets', authenticate, getWorksheets)
router.post('/workbooks/:workbookId/worksheets', authenticate, requireRole('DIRECTOR'), createWorksheet)
router.put('/worksheets/:id', authenticate, requireRole('DIRECTOR'), updateWorksheet)
router.delete('/worksheets/:id', authenticate, requireRole('DIRECTOR'), deleteWorksheet)

router.get('/worksheets/:worksheetId/questions', authenticate, getQuestions)
router.post('/worksheets/:worksheetId/questions', authenticate, requireRole('TEACHER'), createQuestion)
router.put('/questions/:id', authenticate, requireRole('TEACHER'), updateQuestion)
router.delete('/questions/:id', authenticate, requireRole('TEACHER'), deleteQuestion)

router.get('/questions/:questionId/answers/mine', authenticate, requireRole('STUDENT'), getMyAnswer)
router.post('/questions/:questionId/answers', authenticate, requireRole('STUDENT'), saveAnswer)

router.get('/answers/:id', authenticate, requireRole('TEACHER', 'DIRECTOR'), getAnswer)
router.get('/worksheets/:worksheetId/answers', authenticate, requireRole('TEACHER', 'DIRECTOR'), getAnswersByWorksheet)

router.post('/answers/:id/annotations', authenticate, requireRole('TEACHER'), addAnnotation)
router.put('/answers/:id/annotations/:annotationId', authenticate, requireRole('TEACHER'), updateAnnotation)
router.delete('/answers/:id/annotations/:annotationId', authenticate, requireRole('TEACHER'), deleteAnnotation)

router.post('/answers/:id/grade', authenticate, requireRole('TEACHER'), submitGrade)
router.get('/grades/pending', authenticate, requireRole('DIRECTOR'), getPendingGrades)
router.put('/grades/:gradeId/review', authenticate, requireRole('DIRECTOR'), reviewGrade)

export default router