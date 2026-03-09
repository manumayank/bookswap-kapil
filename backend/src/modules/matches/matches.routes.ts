import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { createDealDto } from './matches.dto';
import * as matchesController from './matches.controller';

const router = Router();

router.use(authenticate);

router.post('/', validate(createDealDto), matchesController.handleCreateDeal);
router.get('/', matchesController.handleGetDeals);
router.post('/:id/accept', matchesController.handleAccept);
router.post('/:id/reject', matchesController.handleReject);
router.post('/:id/complete', matchesController.handleComplete);
router.post('/:id/cancel', matchesController.handleCancel);

export default router;
