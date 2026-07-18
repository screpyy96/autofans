package ro.autofans.app.push

import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage
import ro.autofans.app.ui.MessageNotification

/** Receives data-only FCM messages while AutoFans is in the background or the
 * process is not running. Authentication and the audience selection happen on
 * the server; this client only renders the already-authorized message. */
class AutoFansFirebaseMessagingService : FirebaseMessagingService() {
    override fun onMessageReceived(message: RemoteMessage) {
        val data = message.data
        val title = data["title"] ?: message.notification?.title ?: "Mesaj nou"
        val body = data["body"] ?: message.notification?.body ?: "Ai primit un mesaj nou în AutoFans."
        val notificationId = data["notificationId"]?.toIntOrNull()
            ?: message.messageId?.hashCode()
            ?: System.currentTimeMillis().toInt()
        MessageNotification.show(
            context = applicationContext,
            title = title,
            body = body,
            notificationId = notificationId,
            conversationId = data["conversationId"]?.toLongOrNull(),
        )
    }
}
