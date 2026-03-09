import { Request, Response } from 'express'
import { prisma } from '../lib/prisma'
import { io } from '../server' 

export const getWorkbooks = async (req: Request, res: Response): Promise<void> => {
  try {
    const workbooks = await prisma.workbook.findMany({
      include: { worksheets: { orderBy: { orderIndex: 'asc' }, select: { id: true, title: true, orderIndex: true } } },
      orderBy: { createdAt: 'desc' }
    })
    res.json(workbooks)
  } catch { res.status(500).json({ error: 'Internal server error' }) }
}

export const createWorkbook = async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, description } = req.body
    if (!title) { res.status(400).json({ error: 'Title is required' }); return }
    const workbook = await prisma.workbook.create({ data: { title, description } })
    io.emit('workbook:created', { workbookId: workbook.id })  
    res.status(201).json(workbook)
  } catch { res.status(500).json({ error: 'Internal server error' }) }
}

export const getWorksheets = async (req: Request, res: Response): Promise<void> => {
  try {
    const { workbookId } = req.params
    const worksheets = await prisma.worksheet.findMany({
      where: { workbookId },
      include: {
        createdBy: { select: { id: true, name: true, role: true } },
        questions: {
          orderBy: { orderIndex: 'asc' },
          include: { createdBy: { select: { id: true, name: true } } }
        }
      },
      orderBy: { orderIndex: 'asc' }
    })
    res.json(worksheets)
  } catch { res.status(500).json({ error: 'Internal server error' }) }
}

export const createWorksheet = async (req: Request, res: Response): Promise<void> => {
  try {
    const { workbookId } = req.params
    const { title, body } = req.body
    if (!title) { res.status(400).json({ error: 'Title is required' }); return }
    const count = await prisma.worksheet.count({ where: { workbookId } })
    const worksheet = await prisma.worksheet.create({
      data: { workbookId, title, body: body || '', orderIndex: count, createdById: req.user!.userId },
      include: { createdBy: { select: { id: true, name: true, role: true } }, questions: true }
    })
    io.emit('worksheet:created', { workbookId, worksheetId: worksheet.id })  
    res.status(201).json(worksheet)
  } catch { res.status(500).json({ error: 'Internal server error' }) }
}

export const updateWorksheet = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const { title, body } = req.body
    const worksheet = await prisma.worksheet.update({
      where: { id },
      data: { ...(title && { title }), ...(body !== undefined && { body }) },
      include: { createdBy: { select: { id: true, name: true, role: true } }, questions: true }
    })
    res.json(worksheet)
  } catch { res.status(500).json({ error: 'Internal server error' }) }
}

export const deleteWorksheet = async (req: Request, res: Response): Promise<void> => {
  try {
    await prisma.worksheet.delete({ where: { id: req.params.id } })
    res.json({ message: 'Worksheet deleted' })
  } catch { res.status(500).json({ error: 'Internal server error' }) }
}