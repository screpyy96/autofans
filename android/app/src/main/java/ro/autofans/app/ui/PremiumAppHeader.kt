package ro.autofans.app.ui

import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.NotificationsNone
import androidx.compose.material.icons.outlined.Person
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import ro.autofans.app.R

/**
 * Quiet, persistent app chrome. Notification badges are deliberately not
 * rendered here: a badge only belongs in the UI when the backend provides a
 * real unread count.
 */
@Composable
fun PremiumAppHeader(
    title: String? = null,
    isAuthenticated: Boolean,
    accountEmail: String? = null,
    onAccount: () -> Unit,
    onNotifications: () -> Unit,
) {
    Surface(
        modifier = Modifier.fillMaxWidth().statusBarsPadding(),
        color = MaterialTheme.colorScheme.surface,
        shadowElevation = 0.dp,
    ) {
        androidx.compose.foundation.layout.Column {
            Row(
                modifier = Modifier.fillMaxWidth().height(64.dp).padding(horizontal = 20.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween,
            ) {
                HeaderIdentity(title = title)
                Row(verticalAlignment = Alignment.CenterVertically) {
                    IconButton(onClick = onNotifications, modifier = Modifier.size(42.dp)) {
                        Icon(
                            Icons.Default.NotificationsNone,
                            contentDescription = "Notificări",
                            tint = MaterialTheme.colorScheme.onSurfaceVariant,
                        )
                    }
                    AccountAction(
                        isAuthenticated = isAuthenticated,
                        accountEmail = accountEmail,
                        onClick = onAccount,
                    )
                }
            }
            HorizontalDivider(color = MaterialTheme.colorScheme.outline.copy(alpha = .12f))
        }
    }
}

@Composable
private fun HeaderIdentity(title: String?) {
    if (title != null) {
        Text(
            title,
            modifier = Modifier.width(210.dp),
            style = MaterialTheme.typography.titleLarge,
            fontWeight = FontWeight.Bold,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis,
        )
    } else {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Image(
                painter = painterResource(R.drawable.autofans_mark),
                contentDescription = "AutoFans",
                contentScale = ContentScale.Fit,
                modifier = Modifier.size(34.dp),
            )
            Text(
                "AutoFans",
                modifier = Modifier.padding(start = 9.dp),
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.ExtraBold,
                color = MaterialTheme.colorScheme.secondary,
            )
        }
    }
}

@Composable
private fun AccountAction(isAuthenticated: Boolean, accountEmail: String?, onClick: () -> Unit) {
    Surface(
        onClick = onClick,
        modifier = Modifier.padding(start = 6.dp).size(36.dp),
        shape = CircleShape,
        color = if (isAuthenticated) MaterialTheme.colorScheme.secondary else MaterialTheme.colorScheme.surfaceVariant,
    ) {
        if (isAuthenticated) {
            androidx.compose.foundation.layout.Box(contentAlignment = Alignment.Center) {
                Text(
                    accountEmail.orEmpty().trim().firstOrNull()?.uppercase().orEmpty(),
                    style = MaterialTheme.typography.labelLarge,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onSecondary,
                )
            }
        } else {
            Icon(
                Icons.Outlined.Person,
                contentDescription = "Autentificare",
                modifier = Modifier.padding(8.dp),
                tint = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }
    }
}
