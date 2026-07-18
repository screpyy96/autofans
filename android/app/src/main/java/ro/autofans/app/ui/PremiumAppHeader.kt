package ro.autofans.app.ui

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.NotificationsNone
import androidx.compose.material.icons.filled.Person
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
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import ro.autofans.app.R

/**
 * Persistent app chrome: account on the left, a genuinely centered identity
 * or screen title, and notifications on the right. The surface includes the
 * status-bar area so it reads as one continuous top region.
 */
@Composable
fun PremiumAppHeader(
    title: String? = null,
    isAuthenticated: Boolean,
    onAccount: () -> Unit,
    onNotifications: () -> Unit,
) {
    Surface(
        modifier = Modifier.fillMaxWidth().statusBarsPadding(),
        color = MaterialTheme.colorScheme.surface,
        shadowElevation = 2.dp,
    ) {
        androidx.compose.foundation.layout.Column {
            Row(
                modifier = Modifier.fillMaxWidth().height(76.dp).padding(horizontal = 16.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                ProfileAction(isAuthenticated = isAuthenticated, onClick = onAccount)

                Box(
                    modifier = Modifier.weight(1f),
                    contentAlignment = Alignment.Center,
                ) {
                    if (title == null) {
                        Image(
                            painter = painterResource(R.drawable.autofans_logo),
                            contentDescription = "AutoFans",
                            contentScale = ContentScale.Fit,
                            modifier = Modifier.width(138.dp),
                        )
                    } else {
                        Text(
                            title,
                            modifier = Modifier.padding(horizontal = 12.dp),
                            style = MaterialTheme.typography.titleLarge,
                            fontWeight = FontWeight.ExtraBold,
                            textAlign = TextAlign.Center,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis,
                        )
                    }
                }

                NotificationAction(onClick = onNotifications)
            }
            HorizontalDivider(color = MaterialTheme.colorScheme.outline.copy(alpha = .16f))
        }
    }
}

@Composable
private fun ProfileAction(isAuthenticated: Boolean, onClick: () -> Unit) {
    Box(modifier = Modifier.size(46.dp), contentAlignment = Alignment.Center) {
        Surface(
            onClick = onClick,
            modifier = Modifier.size(44.dp),
            shape = RoundedCornerShape(15.dp),
            color = if (isAuthenticated) MaterialTheme.colorScheme.primaryContainer else MaterialTheme.colorScheme.surface,
            border = if (isAuthenticated) null else BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = .45f)),
        ) {
            Icon(
                imageVector = if (isAuthenticated) Icons.Default.Person else Icons.Outlined.Person,
                contentDescription = if (isAuthenticated) "Contul meu" else "Autentificare",
                modifier = Modifier.padding(10.dp),
                tint = if (isAuthenticated) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurface,
            )
        }
        if (!isAuthenticated) {
            Surface(
                modifier = Modifier.align(Alignment.BottomEnd).size(12.dp),
                shape = CircleShape,
                color = MaterialTheme.colorScheme.primary,
                border = BorderStroke(2.dp, MaterialTheme.colorScheme.surface),
            ) {}
        }
    }
}

@Composable
private fun NotificationAction(onClick: () -> Unit) {
    Box(modifier = Modifier.size(46.dp), contentAlignment = Alignment.Center) {
        IconButton(
            onClick = onClick,
            modifier = Modifier.size(44.dp).clip(RoundedCornerShape(15.dp)).background(MaterialTheme.colorScheme.surfaceVariant),
        ) {
            Icon(Icons.Default.NotificationsNone, contentDescription = "Notificări", tint = MaterialTheme.colorScheme.onSurface)
        }
        Surface(
            modifier = Modifier.align(Alignment.TopEnd).padding(top = 5.dp, end = 5.dp).size(8.dp),
            shape = CircleShape,
            color = MaterialTheme.colorScheme.primary,
            border = BorderStroke(1.5.dp, MaterialTheme.colorScheme.surface),
        ) {}
    }
}
