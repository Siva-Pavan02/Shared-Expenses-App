import { Router } from 'express';
import { GroupController } from '../controllers/groups.controller';
import { validateRequest } from '../../../middleware/validate.middleware';
import { authenticateJWT } from '../../../middleware/auth.middleware';
import { createGroupSchema, updateGroupSchema } from '../validators/groups.validator';
import membershipRoutes from '../../memberships/routes/memberships.routes';
import expensesRoutes from '../../expenses/routes/expenses.routes';
import settlementsRoutes from '../../settlements/routes/settlements.routes';
import importsRoutes from '../../imports/routes/imports.routes';
import balancesRoutes from '../../balances/routes/balances.routes';
import { BalanceController } from '../../balances/controllers/balances.controller';

const router = Router();
const groupController = new GroupController();
const balanceController = new BalanceController();

router.post('/', authenticateJWT, validateRequest(createGroupSchema), groupController.createGroup);
router.get('/', authenticateJWT, groupController.listUserGroups);
router.get('/:id', authenticateJWT, groupController.getGroupDetails);
router.patch('/:id', authenticateJWT, validateRequest(updateGroupSchema), groupController.updateGroup);
router.delete('/:id', authenticateJWT, groupController.deleteGroup);

// Nested routes for memberships, expenses, settlements, and imports
router.use('/:groupId/members', membershipRoutes);
router.use('/:groupId/expenses', expensesRoutes);
router.use('/:groupId/settlements', settlementsRoutes);
router.use('/:groupId/imports', importsRoutes);
router.use('/:groupId/balances', balancesRoutes);

// Explicit route requested in assignment
router.get('/:groupId/simplified-balances', authenticateJWT, balanceController.getSimplifiedBalances);

export default router;
