package ro.autofans.app.ui

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import ro.autofans.app.MainActivity
import ro.autofans.app.R

internal object MessageNotification {
    private const val CHANNEL_ID = "chat_messages"

    fun show(
        context: Context,
        title: String,
        body: String,
        notificationId: Int,
        conversationId: Long? = null,
    ) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(CHANNEL_ID, "Mesaje AutoFans", NotificationManager.IMPORTANCE_HIGH).apply {
                description = "Mesaje noi de la cumpărători și vânzători"
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
        }
        val notification = NotificationCompat.Builder(context, CHANNEL_ID)
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentTitle(title)
            .setContentText(body)
            .setStyle(NotificationCompat.BigTextStyle().bigText(body))
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setAutoCancel(true)
            .apply { contentIntent?.let(::setContentIntent) }
            .build()
        NotificationManagerCompat.from(context).notify(notificationId, notification)
    }
}
