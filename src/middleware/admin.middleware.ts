import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/prisma';

export const authorizeGroupAdmin = async (req: Request, res: Response, next: NextFunction) => {
  const userId = (req as any).user?.id || (req as any).user?.userId;
  const groupId = (req.params.groupId as string) || req.body?.groupId;

  if (!userId) {
    return res.status(401).json({ status: 'error', message: 'Unauthorized: User not found in request' });
  }

  if (!groupId) {
    // If we're on a route that doesn't pass groupId directly (e.g. /imports/:importJobId)
    // we need to look it up. Let's do that for known edge cases.
    let importJobId = req.params.importJobId as string;
    let anomalyId = req.params.id as string;

    // For routes like /imports/:id/finalize where :id is the importJobId
    if (!importJobId && req.originalUrl.includes('/imports') && anomalyId) {
      importJobId = anomalyId;
      anomalyId = undefined as any;
    }

    if (importJobId) {
      const job = await prisma.importJob.findUnique({ where: { id: importJobId } });
      if (!job) return res.status(404).json({ status: 'error', message: 'Import Job not found' });
      
      const membership = await prisma.groupMember.findUnique({
        where: { groupId_userId: { groupId: job.groupId, userId } }
      });

      if (!membership || !membership.isAdmin) {
        return res.status(403).json({ status: 'error', message: 'Forbidden: Admin access required for this group' });
      }
      return next();
    }

    if (anomalyId) {
      const anomaly = await prisma.importAnomaly.findUnique({
        where: { id: anomalyId },
        include: { importJob: true }
      });
      if (!anomaly) return res.status(404).json({ status: 'error', message: 'Anomaly not found' });
      
      const membership = await prisma.groupMember.findUnique({
        where: { groupId_userId: { groupId: anomaly.importJob.groupId, userId } }
      });

      if (!membership || !membership.isAdmin) {
        return res.status(403).json({ status: 'error', message: 'Forbidden: Admin access required for this group' });
      }
      return next();
    }

    return res.status(400).json({ status: 'error', message: 'Group ID not found in request context' });
  }

  try {
    const membership = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId } }
    });

    if (!membership || !membership.isAdmin) {
      return res.status(403).json({ status: 'error', message: 'Forbidden: Admin access required for this group' });
    }

    next();
  } catch (error) {
    console.error('Prisma error in admin.middleware:', error);
    return res.status(500).json({ status: 'error', message: 'Authorization error' });
  }
};
