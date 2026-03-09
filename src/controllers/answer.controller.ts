import { Request, Response } from 'express'
import { prisma } from '../lib/prisma'

export const getMyAnswer = async (req: Request, res: Response): Promise<void> => {
  try {
    const answer = await prisma.answer.findUnique({
      where: { questionId_studentId: { questionId: req.params.questionId, studentId: req.user!.userId } },
      include: {
        annotations: { include: { teacher: { select: { id: true, name: true } } } },
        grade: { include: { teacher: { select: { id: true, name: true } } } }
      }
    })
    res.json(answer || null)
  } catch { res.status(500).json({ error: 'Internal server error' }) }
}

export const saveAnswer = async (req: Request, res: Response): Promise<void> => {
  try {
    const { questionId } = req.params
    const { content, submit } = req.body
    const existing = await prisma.answer.findUnique({
      where: { questionId_studentId: { questionId, studentId: req.user!.userId } }
    })
    const data: any = { content: content || '' }
    if (submit) { data.status = 'SUBMITTED'; data.submittedAt = new Date() }
    const answer = existing
      ? await prisma.answer.update({
          where: { questionId_studentId: { questionId, studentId: req.user!.userId } },
          data,
          include: { annotations: true, grade: true }
        })
      : await prisma.answer.create({
          data: { questionId, studentId: req.user!.userId, ...data },
          include: { annotations: true, grade: true }
        })
    res.status(existing ? 200 : 201).json(answer)
  } catch { res.status(500).json({ error: 'Internal server error' }) }
}

export const getAnswer = async (req: Request, res: Response): Promise<void> => {
  try {
    const answer = await prisma.answer.findUnique({
      where: { id: req.params.id },
      include: {
        student: { select: { id: true, name: true, email: true } },
        question: { select: { id: true, text: true, maxScore: true } },
        annotations: { include: { teacher: { select: { id: true, name: true } } } },
        grade: {
          include: {
            teacher: { select: { id: true, name: true } },
            director: { select: { id: true, name: true } }
          }
        }
      }
    })
    if (!answer) { res.status(404).json({ error: 'Answer not found' }); return }
    res.json(answer)
  } catch { res.status(500).json({ error: 'Internal server error' }) }
}

export const getAnswersByWorksheet = async (req: Request, res: Response): Promise<void> => {
  try {
    const questions = await prisma.question.findMany({
      where: { worksheetId: req.params.worksheetId },
      include: {
        answers: {
          include: {
            student: { select: { id: true, name: true, email: true } },
            annotations: { include: { teacher: { select: { id: true, name: true } } } },
            grade: { include: { teacher: { select: { id: true, name: true } }, director: { select: { id: true, name: true } } } }
          }
        }
      }
    })
    res.json(questions)
  } catch { res.status(500).json({ error: 'Internal server error' }) }
}

export const addAnnotation = async (req: Request, res: Response): Promise<void> => {
  try {
    const { originalText, suggestedText, comment, startOffset, endOffset } = req.body
    if (!originalText || !suggestedText || startOffset === undefined || endOffset === undefined) {
      res.status(400).json({ error: 'Missing required annotation fields' }); return
    }
    const annotation = await prisma.answerAnnotation.create({
      data: { answerId: req.params.id, teacherId: req.user!.userId, originalText, suggestedText, comment, startOffset, endOffset },
      include: { teacher: { select: { id: true, name: true } } }
    })
    res.status(201).json(annotation)
  } catch { res.status(500).json({ error: 'Internal server error' }) }
}

export const updateAnnotation = async (req: Request, res: Response): Promise<void> => {
  try {
    const annotation = await prisma.answerAnnotation.findUnique({ where: { id: req.params.annotationId } })
    if (!annotation || annotation.teacherId !== req.user!.userId) {
      res.status(403).json({ error: 'Cannot edit this annotation' }); return
    }
    const updated = await prisma.answerAnnotation.update({
      where: { id: req.params.annotationId },
      data: { suggestedText: req.body.suggestedText, comment: req.body.comment },
      include: { teacher: { select: { id: true, name: true } } }
    })
    res.json(updated)
  } catch { res.status(500).json({ error: 'Internal server error' }) }
}

export const deleteAnnotation = async (req: Request, res: Response): Promise<void> => {
  try {
    const annotation = await prisma.answerAnnotation.findUnique({ where: { id: req.params.annotationId } })
    if (!annotation || annotation.teacherId !== req.user!.userId) {
      res.status(403).json({ error: 'Cannot delete this annotation' }); return
    }
    await prisma.answerAnnotation.delete({ where: { id: req.params.annotationId } })
    res.json({ message: 'Annotation deleted' })
  } catch { res.status(500).json({ error: 'Internal server error' }) }
}

export const submitGrade = async (req: Request, res: Response): Promise<void> => {
  try {
    const { score, feedback } = req.body
    if (score === undefined) { res.status(400).json({ error: 'Score is required' }); return }
    const answer = await prisma.answer.findUnique({ where: { id: req.params.id } })
    if (!answer) { res.status(404).json({ error: 'Answer not found' }); return }
    const grade = await prisma.grade.upsert({
      where: { answerId: req.params.id },
      create: { answerId: req.params.id, teacherId: req.user!.userId, score, feedback, status: 'PENDING' },
      update: { score, feedback, status: 'PENDING', teacherId: req.user!.userId, directorId: null, directorComment: null, reviewedAt: null },
      include: { teacher: { select: { id: true, name: true } } }
    })
    await prisma.answer.update({ where: { id: req.params.id }, data: { status: 'GRADED' } })
    res.json(grade)
  } catch { res.status(500).json({ error: 'Internal server error' }) }
}

export const reviewGrade = async (req: Request, res: Response): Promise<void> => {
  try {
    const { action, directorComment } = req.body
    if (!['approve', 'reject'].includes(action)) {
      res.status(400).json({ error: "Action must be 'approve' or 'reject'" }); return
    }
    const grade = await prisma.grade.update({
      where: { id: req.params.gradeId },
      data: {
        status: action === 'approve' ? 'APPROVED' : 'REJECTED',
        directorId: req.user!.userId,
        directorComment,
        reviewedAt: new Date()
      },
      include: {
        teacher: { select: { id: true, name: true } },
        director: { select: { id: true, name: true } },
        answer: { include: { student: { select: { id: true, name: true } } } }
      }
    })
    res.json(grade)
  } catch { res.status(500).json({ error: 'Internal server error' }) }
}

export const getPendingGrades = async (req: Request, res: Response): Promise<void> => {
  try {
    const grades = await prisma.grade.findMany({
      where: { status: 'PENDING' },
      include: {
        teacher: { select: { id: true, name: true } },
        answer: {
          include: {
            student: { select: { id: true, name: true } },
            question: { select: { id: true, text: true, maxScore: true, worksheetId: true } }
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    })
    res.json(grades)
  } catch { res.status(500).json({ error: 'Internal server error' }) }
}