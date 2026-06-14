import { Router } from 'express';
import { MembershipController } from '../controllers/memberships.controller';
import { validateRequest } from '../../../middleware/validate.middleware';
import { authenticateJWT } from '../../../middleware/auth.middleware';
import { addMemberSchema } from '../validators/memberships.validator';

const router = Router({ mergeParams: true }); // mergeParams to access groupId
const membershipController = new MembershipController();

router.post('/', authenticateJWT, validateRequest(addMemberSchema), membershipController.addMember);
router.get('/', authenticateJWT, membershipController.getGroupMembers);
router.patch('/:memberId/leave', authenticateJWT, membershipController.removeMember);

export default router;
