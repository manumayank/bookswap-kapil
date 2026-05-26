import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { createGrievanceDto } from './grievances.dto';
import * as controller from './grievances.controller';

const router = Router();

router.use(authenticate);
router.post('/', validate(createGrievanceDto), controller.handleCreate);
router.get('/my', controller.handleGetMine);

export default router;
