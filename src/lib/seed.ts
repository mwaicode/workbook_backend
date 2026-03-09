/**
 * Seed script — run with: npm run db:seed
 * Creates one demo user for each role + a sample workbook
 */
import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';


const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database…');

  // ── Clean slate ────────────────────────────────────────
  await prisma.grade.deleteMany();
  await prisma.answerAnnotation.deleteMany();
  await prisma.answer.deleteMany();
  await prisma.question.deleteMany();
  await prisma.worksheet.deleteMany();
  await prisma.workbook.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();

  const hash = (pw: string) => bcrypt.hash(pw, 10);

  // ── Users ──────────────────────────────────────────────
  const director = await prisma.user.create({
    data: {
      name: 'Alice Director',
      email: 'director@school.com',
      passwordHash: await hash('Password123!'),
      role: Role.DIRECTOR,
    },
  });

  const teacher = await prisma.user.create({
    data: {
      name: 'Bob Teacher',
      email: 'teacher@school.com',
      passwordHash: await hash('Password123!'),
      role: Role.TEACHER,
    },
  });

  const student = await prisma.user.create({
    data: {
      name: 'Carol Student',
      email: 'student@school.com',
      passwordHash: await hash('Password123!'),
      role: Role.STUDENT,
    },
  });

  // ── Workbook ───────────────────────────────────────────
  const workbook = await prisma.workbook.create({
    data: {
      title: 'Introduction to Biology',
      description: 'A collaborative workbook for Biology 101',
    },
  });

  // ── Worksheets ─────────────────────────────────────────
  const ws1 = await prisma.worksheet.create({
    data: {
      workbookId: workbook.id,
      title: 'Chapter 1 — Cell Structure',
      body: `# Cell Structure\n\nCells are the basic unit of life. All living organisms are composed of cells. There are two primary types of cells:\n\n- **Prokaryotic cells** — no membrane-bound nucleus (e.g. bacteria)\n- **Eukaryotic cells** — contain a nucleus and membrane-bound organelles (e.g. animal, plant cells)\n\nKey organelles include the mitochondria, nucleus, endoplasmic reticulum, and Golgi apparatus.`,
      orderIndex: 0,
      createdById: director.id,
    },
  });

  const ws2 = await prisma.worksheet.create({
    data: {
      workbookId: workbook.id,
      title: 'Chapter 2 — Photosynthesis',
      body: `# Photosynthesis\n\nPhotosynthesis is the process by which plants convert light energy into chemical energy stored as glucose.\n\n**Equation:**\n6CO₂ + 6H₂O + light energy → C₆H₁₂O₆ + 6O₂\n\nThis process occurs in the chloroplasts, specifically in the thylakoid membranes and stroma.`,
      orderIndex: 1,
      createdById: director.id,
    },
  });

  // ── Questions ──────────────────────────────────────────
  const q1 = await prisma.question.create({
    data: {
      worksheetId: ws1.id,
      text: 'Describe the main differences between prokaryotic and eukaryotic cells. Include at least three structural differences.',
      orderIndex: 0,
      maxScore: 30,
      createdById: teacher.id,
    },
  });

  const q2 = await prisma.question.create({
    data: {
      worksheetId: ws1.id,
      text: 'What is the role of the mitochondria? Why is it often called the "powerhouse of the cell"?',
      orderIndex: 1,
      maxScore: 20,
      createdById: teacher.id,
    },
  });

  await prisma.question.create({
    data: {
      worksheetId: ws2.id,
      text: 'Explain the overall equation for photosynthesis and what each component represents.',
      orderIndex: 0,
      maxScore: 25,
      createdById: teacher.id,
    },
  });

  // ── Sample Answer (submitted) ──────────────────────────
  const answer1 = await prisma.answer.create({
    data: {
      questionId: q1.id,
      studentId: student.id,
      content:
        'Prokaryotic cells dont have a nucleus, but eukaryotic cells do. Prokaryotic cells are smaller. Eukaryotic cells have mitochondria and other organells.',
      status: 'SUBMITTED',
      submittedAt: new Date(),
    },
  });

  // ── Sample Annotation ──────────────────────────────────
  await prisma.answerAnnotation.create({
    data: {
      answerId: answer1.id,
      teacherId: teacher.id,
      originalText: 'organells',
      suggestedText: 'organelles',
      comment: 'Spelling correction',
      startOffset: 147,
      endOffset: 156,
    },
  });

  // ── Sample Grade (pending approval) ───────────────────
  await prisma.grade.create({
    data: {
      answerId: answer1.id,
      teacherId: teacher.id,
      score: 22,
      feedback:
        'Good start! You identified the nucleus and mitochondria differences, but could expand on membrane-bound organelles and cell size differences. Watch your spelling.',
      status: 'PENDING',
    },
  });

  console.log('✅ Seed complete!');
  console.log('');
  console.log('Demo accounts (password: Password123!):');
  console.log('  director@school.com  →  DIRECTOR');
  console.log('  teacher@school.com   →  TEACHER');
  console.log('  student@school.com   →  STUDENT');
  console.log('');
  console.log(`Workbook ID: ${workbook.id}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());