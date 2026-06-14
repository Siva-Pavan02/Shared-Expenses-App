import { Router } from 'express';
import { SettlementController } from '../controllers/settlements.controller';
import { validateRequest } from '../../../middleware/validate.middleware';
import { authenticateJWT } from '../../../middleware/auth.middleware';
import { createSettlementSchema } from '../validators/settlements.validator';

const router = Router({ mergeParams: true });
const settlementController = new SettlementController();

// Typically mounted under /groups/:groupId/settlements
router.post('/', authenticateJWT, validateRequest(createSettlementSchema), settlementController.createSettlement);
router.get('/', authenticateJWT, settlementController.listGroupSettlements);

// Typically mounted under /settlements/:id
router.get('/:id', authenticateJWT, settlementController.getSettlement);
router.delete('/:id', authenticateJWT, settlementController.deleteSettlement);

export default router;
