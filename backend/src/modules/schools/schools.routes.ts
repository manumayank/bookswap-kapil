import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { validate, validateQuery } from '../../middleware/validate';
import { searchSchoolsDto, suggestSchoolDto } from './schools.dto';
import * as schoolsController from './schools.controller';

const router = Router();

router.get('/', validateQuery(searchSchoolsDto), schoolsController.handleSearch);
router.get('/:id', schoolsController.handleGetSchool);
router.post('/suggest', authenticate, validate(suggestSchoolDto), schoolsController.handleSuggest);

export default router;
