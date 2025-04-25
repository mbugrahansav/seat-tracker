import express, { Router } from 'express';
import * as controller from '../controllers/controller';

const router: Router = express.Router();

router.post('/seferleriGetir', controller.handleSeferleriGetir);
router.post('/seferTakibi', controller.handleSeferTakibi);

export default router;