import User from '../models/user.js';
import Notification from '../models/notification.js';

const createNotification = async (recipientId, senderId, type, content, entityType = null, entityId = null) => {
    try {

        if (recipientId.toString() === senderId.toString()) {
            return null;
        }

        const recipient = await User.findById(recipientId);

        if(!recipient) {
            console.log(`Recipient with ID ${recipientId} not found. Notification not created.`);
            return null;
        }
         
        const notification = await Notification.create({
            recipient: recipientId,
            sender: senderId,
            type,
            content,
            entityType,
            entityId
        });

        return notification;

    } catch (error) {
        console.log('Error creating notification:', error);
        return null;
    }
}

export default createNotification;