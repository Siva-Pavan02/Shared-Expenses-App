import { Router } from 'express';
import { BalanceController } from '../controllers/balances.controller';
import { authenticateJWT } from '../../../middleware/auth.middleware';

const router = Router({ mergeParams: true });
const balanceController = new BalanceController();

// GET /groups/:groupId/balances
router.get('/', authenticateJWT, balanceController.getGroupBalances);

// GET /groups/:groupId/simplified-balances
// This is typically mounted on the group, let's map it via the controller here, but we will register it differently in groups.routes.ts
// We'll actually map GET /simplified-balances directly in the router since it's nested
router.get('/simplified', authenticateJWT, balanceController.getSimplifiedBalances);

// GET /groups/:groupId/balances/:userId/breakdown
router.get('/:userId/breakdown', authenticateJWT, balanceController.getUserBreakdown);

export default router;
