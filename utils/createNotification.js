const createNotification = async (recipientId, senderId, type, content) => {
    try {

        const recipient = await User.findById(recipientId);

        if(!recipient) {
            console.log(`Recipient with ID ${recipientId} not found. Notification not created.`);
            return null;
        }
         
        const notification = new Notification({
            recipient: recipientId,
            sender: senderId,
            type,
            content
        });

        await notification.save();

        return notification;

    } catch (error) {
        console.log('Error creating notification:', error);
        return null;
    }
}

export default createNotification;