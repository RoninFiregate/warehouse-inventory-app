const router = require('express').Router();
const c = require('../controllers/assortment.controller');
const auth = require('../middleware/auth');

router.get('/', c.list);
router.get('/:id', c.getById);
router.post('/', c.create);
router.put('/:id', c.update);
router.delete('/:id', c.remove);

module.exports = router;
