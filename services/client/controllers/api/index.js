import express from 'express';
import assignment from './routes/assignment.js';
import picklist from './routes/picklist.js';
import form from './routes/form.js';
import field from './routes/field.js';

const router = express.Router();
router.use('/assignment', assignment);
router.use('/field', field);
router.use('/form', form);
router.use('/picklist', picklist);

export default router;