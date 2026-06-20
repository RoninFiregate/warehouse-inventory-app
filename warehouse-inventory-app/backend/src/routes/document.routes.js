const router = require('express').Router();
const auth = require('../middleware/auth');

const c = require('../controllers/document.controller');
const pdf = require('../controllers/documentPdf.controller');

// router.use(auth);
router.get('/', c.getDocuments);

router.get(
'/:id/pdf',
pdf.generatePdf
);

module.exports = router;
