package ro.autofans.app.push

import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage
import android.content.Intent
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
        val isAccountUpdate = data["type"] in setOf(
            "seller_verification_approved",
            "seller_verification_rejected",
        )
        if (isAccountUpdate) {
            sendBroadcast(
                Intent(ACTION_ACCOUNT_STATUS_UPDATED)
                    .setPackage(packageName),
            )
        }
        MessageNotification.show(
            context = applicationContext,
            title = title,
            body = body,
            notificationId = notificationId,
            conversationId = data["conversationId"]?.toLongOrNull(),
            accountUpdate = isAccountUpdate,
        )
    }

    companion object {
        const val ACTION_ACCOUNT_STATUS_UPDATED = "ro.autofans.app.ACCOUNT_STATUS_UPDATED"
    }
}
