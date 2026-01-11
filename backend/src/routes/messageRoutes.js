const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.post('/', messageController.sendMessage);
router.get('/chat/:chatId', messageController.getMessages);
router.put('/:messageId/read', messageController.markAsRead);
router.delete('/:messageId', messageController.deleteMessage);

module.exports = router;
