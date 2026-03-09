import { Request, Response } from 'express'
import { prisma } from '../lib/prisma'
import { io } from '../server'

export const getQuestions = async (req: Request, res: Response): Promise<void> => {
  try {
    const questions = await prisma.question.findMany({
      where: { worksheetId: req.params.worksheetId },
      include: { createdBy: { select: { id: true, name: true } } },
      orderBy: { orderIndex: 'asc' }
    })
    res.json(questions)
  } catch { res.status(500).json({ error: 'Internal server error' }) }
}

export const createQuestion = async (req: Request, res: Response): Promise<void> => {
  try {
    const { worksheetId } = req.params
    const { text, maxScore } = req.body
    if (!text) { res.status(400).json({ error: 'Question text is required' }); return }
    const count = await prisma.question.count({ where: { worksheetId } })
    const question = await prisma.question.create({
      data: { worksheetId, text, maxScore: maxScore || 100, orderIndex: count, createdById: req.user!.userId },
      include: { createdBy: { select: { id: true, name: true } } }
    })


     // Emit to all connected clients
    io.emit('question:added', { worksheetId, question })

    
    res.status(201).json(question)
  } catch { res.status(500).json({ error: 'Internal server error' }) }
}

export const updateQuestion = async (req: Request, res: Response): Promise<void> => {
  try {
    const question = await prisma.question.findUnique({ where: { id: req.params.id } })
    if (!question) { res.status(404).json({ error: 'Question not found' }); return }
    if (question.createdById !== req.user!.userId) {
      res.status(403).json({ error: 'Can only edit your own questions' }); return
    }
    const updated = await prisma.question.update({
      where: { id: req.params.id },
      data: { text: req.body.text, maxScore: req.body.maxScore },
      include: { createdBy: { select: { id: true, name: true } } }
    })
    res.json(updated)
  } catch { res.status(500).json({ error: 'Internal server error' }) }
}

export const deleteQuestion = async (req: Request, res: Response): Promise<void> => {
  try {
    const question = await prisma.question.findUnique({ where: { id: req.params.id } })
    if (!question) { res.status(404).json({ error: 'Question not found' }); return }
    if (question.createdById !== req.user!.userId) {
      res.status(403).json({ error: 'Can only delete your own questions' }); return
    }
    await prisma.question.delete({ where: { id: req.params.id } })
    res.json({ message: 'Question deleted' })
  } catch { res.status(500).json({ error: 'Internal server error' }) }
}