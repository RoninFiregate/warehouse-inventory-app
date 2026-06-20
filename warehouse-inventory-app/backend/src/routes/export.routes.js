const router = require('express').Router();
const c = require('../controllers/export.controller');
const auth = require('../middleware/auth');

router.use(auth);
router.get('/:table', c.exportTable);

module.exports = router;
