const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.post('/', chatController.createChat);
router.get('/', chatController.getChats);
router.get('/:chatId', chatController.getChatById);
router.post('/:chatId/participants', chatController.addParticipants);
router.delete('/:chatId/participants/:participantId', chatController.removeParticipant);
router.delete('/:chatId/leave', chatController.leaveChat);
router.put('/:chatId/pin', chatController.togglePinChat);
router.put('/:chatId/mute', chatController.muteChat);
router.delete('/:chatId/mute', chatController.unmuteChat);
router.delete('/:chatId', chatController.deleteChat);

module.exports = router;
