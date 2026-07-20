package ro.autofans.app.ui

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.graphics.BitmapFactory
import android.graphics.Color
import android.net.Uri
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import ro.autofans.app.MainActivity
import ro.autofans.app.R

internal object MessageNotification {
    private const val MESSAGE_CHANNEL_ID = "chat_messages"
    private const val ACCOUNT_CHANNEL_ID = "account_updates"

    fun show(
        context: Context,
        title: String,
        body: String,
        notificationId: Int,
        conversationId: Long? = null,
        accountUpdate: Boolean = false,
    ) {
        val channelId = if (accountUpdate) ACCOUNT_CHANNEL_ID else MESSAGE_CHANNEL_ID
        val channelName = if (accountUpdate) "Actualizări AutoFans" else "Mesaje AutoFans"
        val channelDescription = if (accountUpdate) {
            "Actualizări pentru contul și verificarea ta"
        } else {
            "Mesaje noi de la cumpărători și vânzători"
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(channelId, channelName, NotificationManager.IMPORTANCE_HIGH).apply {
                description = channelDescription
                setShowBadge(true)
            }
            context.getSystemService(NotificationManager::class.java).createNotificationChannel(channel)
        }
        val contentIntent = conversationId?.let { id ->
            val intent = Intent(context, MainActivity::class.java).apply {
                action = Intent.ACTION_VIEW
                data = Uri.parse("autofans://messages/$id")
                flags = Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP
            }
            PendingIntent.getActivity(
                context,
                notificationId,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
            )
        } ?: if (accountUpdate) {
            val intent = Intent(context, MainActivity::class.java).apply {
                action = Intent.ACTION_VIEW
                data = Uri.parse("autofans://account")
                flags = Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP
            }
            PendingIntent.getActivity(
                context,
                notificationId,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
            )
        } else null
        val notification = NotificationCompat.Builder(context, channelId)
            .setSmallIcon(R.drawable.ic_notification)
            .setLargeIcon(BitmapFactory.decodeResource(context.resources, R.drawable.autofans_mark))
            .setContentTitle(title)
            .setContentText(body)
            .setStyle(NotificationCompat.BigTextStyle().bigText(body))
            .setSubText(if (accountUpdate) "AutoFans · Cont" else "AutoFans · Mesaje")
            .setCategory(if (accountUpdate) NotificationCompat.CATEGORY_STATUS else NotificationCompat.CATEGORY_MESSAGE)
            .setColor(Color.rgb(225, 29, 72))
            .setVisibility(NotificationCompat.VISIBILITY_PRIVATE)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setAutoCancel(true)
            .apply { contentIntent?.let(::setContentIntent) }
            .build()
        NotificationManagerCompat.from(context).notify(notificationId, notification)
    }
}
