import { Router } from 'express';
import { ExpenseController } from '../controllers/expenses.controller';
import { validateRequest } from '../../../middleware/validate.middleware';
import { authenticateJWT } from '../../../middleware/auth.middleware';
import { createExpenseSchema } from '../validators/expenses.validator';

const router = Router({ mergeParams: true });
const expenseController = new ExpenseController();

// These routes will be mounted under /groups/:groupId/expenses
router.post('/', authenticateJWT, validateRequest(createExpenseSchema), expenseController.createExpense);
router.get('/', authenticateJWT, expenseController.listGroupExpenses);

// These routes can be mounted under /expenses/:expenseId
router.get('/:expenseId', authenticateJWT, expenseController.getExpense);
router.delete('/:expenseId', authenticateJWT, expenseController.deleteExpense);
// PATCH logic omitted for brevity as per instructions, but route placeholder exists
// router.patch('/:expenseId', authenticateJWT, validateRequest(updateExpenseSchema), expenseController.updateExpense);

export default router;
