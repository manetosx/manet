const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/', userController.getAllUsers);
router.get('/profile', userController.getProfile);
router.put('/profile', userController.updateProfile);
router.put('/fcm-token', userController.updateFcmToken);
router.get('/search', userController.searchUsers);
router.delete('/account', userController.deleteAccount);
router.post('/delete-account', userController.deleteAccount);
router.get('/:userId', userController.getUserById);

module.exports = router;
