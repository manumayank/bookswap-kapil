import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { createRequestDto, updateRequestDto } from './requests.dto';
import * as requestsController from './requests.controller';

const router = Router();

router.use(authenticate);

router.post('/', validate(createRequestDto), requestsController.handleCreate);
router.get('/', requestsController.handleGetMyRequests);
router.put('/:id', validate(updateRequestDto), requestsController.handleUpdate);
router.delete('/:id', requestsController.handleCancel);
router.post('/:id/float', requestsController.handleFloat);

export default router;
