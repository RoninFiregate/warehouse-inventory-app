const router = require('express').Router();
const c = require('../controllers/inventory.controller');
const auth = require('../middleware/auth');

router.use(auth);
router.get('/recent', c.recent);
router.get('/current', c.current);
router.get('/lookup', c.findByQr);
router.get('/produkt/:id/lokalizacje', c.getProductLocations);
router.post('/transfer', c.transfer);
router.post('/', c.createOperation);
router.put('/:id', c.updateOperation);
router.delete('/:id', c.removeOperation);

module.exports = router;
