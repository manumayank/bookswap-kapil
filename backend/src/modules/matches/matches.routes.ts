import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { scheduleMatchDto } from './matches.dto';
import * as matchesController from './matches.controller';

const router = Router();

router.use(authenticate);

router.get('/', matchesController.handleGetMatches);
router.post('/:id/accept', matchesController.handleAccept);
router.post('/:id/reject', matchesController.handleReject);
router.post('/:id/schedule', validate(scheduleMatchDto), matchesController.handleSchedule);
router.post('/:id/complete', matchesController.handleComplete);

export default router;
