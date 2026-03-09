import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { ok, created, notFound, serverError, forbidden } from '../utils/response';



export const CreateWorksheetSchema = z.object({
  title:      z.string().min(1).max(200),
  body:       z.string().default(''),
  orderIndex: z.number().int().min(0).optional(),
});

export const UpdateWorksheetSchema = z.object({
  title:      z.string().min(1).max(200).optional(),
  body:       z.string().optional(),
  orderIndex: z.number().int().min(0).optional(),
});



const WORKSHEET_INCLUDE = {
  createdBy: { select: { id: true, name: true, role: true } },
  questions: {
    orderBy: { orderIndex: 'asc' as const },
    include: {
      createdBy: { select: { id: true, name: true, role: true } },
    },
  },
};


export async function listWorksheets(req: Request, res: Response): Promise<void> {
  try {
    const worksheets = await prisma.worksheet.findMany({
      where: { workbookId: req.params.workbookId },
      orderBy: { orderIndex: 'asc' },
      include: WORKSHEET_INCLUDE,
    });
    ok(res, { worksheets });
  } catch (err) {
    console.error('[listWorksheets]', err);
    serverError(res);
  }
}


export async function getWorksheet(req: Request, res: Response): Promise<void> {
  try {
    const worksheet = await prisma.worksheet.findUnique({
      where: { id: req.params.id },
      include: WORKSHEET_INCLUDE,
    });
    if (!worksheet) { notFound(res, 'Worksheet not found'); return; }
    ok(res, { worksheet });
  } catch (err) {
    console.error('[getWorksheet]', err);
    serverError(res);
  }
}


export async function createWorksheet(req: Request, res: Response): Promise<void> {
  try {
    const { title, body, orderIndex } = req.body as z.infer<typeof CreateWorksheetSchema>;

    // Determine next orderIndex if not provided
    let order = orderIndex;
    if (order === undefined) {
      const last = await prisma.worksheet.findFirst({
        where: { workbookId: req.params.workbookId },
        orderBy: { orderIndex: 'desc' },
        select: { orderIndex: true },
      });
      order = (last?.orderIndex ?? -1) + 1;
    }

    const worksheet = await prisma.worksheet.create({
      data: {
        workbookId:  req.params.workbookId,
        title,
        body,
        orderIndex:  order,
        createdById: req.user!.id,
      },
      include: WORKSHEET_INCLUDE,
    });

    created(res, { worksheet });
  } catch (err) {
    console.error('[createWorksheet]', err);
    serverError(res);
  }
}

export async function updateWorksheet(req: Request, res: Response): Promise<void> {
  try {
    const { title, body, orderIndex } = req.body as z.infer<typeof UpdateWorksheetSchema>;

    const worksheet = await prisma.worksheet.update({
      where: { id: req.params.id },
      data: {
        ...(title      !== undefined && { title }),
        ...(body       !== undefined && { body }),
        ...(orderIndex !== undefined && { orderIndex }),
      },
      include: WORKSHEET_INCLUDE,
    });

    ok(res, { worksheet });
  } catch (err) {
    console.error('[updateWorksheet]', err);
    serverError(res);
  }
}


export async function deleteWorksheet(req: Request, res: Response): Promise<void> {
  try {
    await prisma.worksheet.delete({ where: { id: req.params.id } });
    ok(res, { message: 'Worksheet deleted' });
  } catch (err) {
    console.error('[deleteWorksheet]', err);
    serverError(res);
  }
}