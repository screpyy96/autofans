package ro.autofans.app.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.SideEffect
import androidx.compose.runtime.Composable
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalView
import androidx.core.view.WindowCompat
import android.app.Activity

private val AutoFansLightColors = lightColorScheme(
    primary = Color(0xFFD91F3D),
    onPrimary = Color.White,
    primaryContainer = Color(0xFFFFE9EC),
    onPrimaryContainer = Color(0xFF43000B),
    secondary = Color(0xFF0E2C57),
    onSecondary = Color.White,
    secondaryContainer = Color(0xFFE7EEF9),
    onSecondaryContainer = Color(0xFF061A37),
    background = Color(0xFFFFFFFF),
    onBackground = Color(0xFF152238),
    surface = Color(0xFFFFFFFF),
    onSurface = Color(0xFF152238),
    surfaceVariant = Color(0xFFF3F5F8),
    onSurfaceVariant = Color(0xFF4D5B70),
    outline = Color(0xFFC5CCD6),
    error = Color(0xFFBA1A1A),
)

private val AutoFansDarkColors = darkColorScheme(
    primary = Color(0xFFFFB1BB),
    onPrimary = Color(0xFF650018),
    primaryContainer = Color(0xFF8B0024),
    onPrimaryContainer = Color(0xFFFFD9DE),
    secondary = Color(0xFFB7C9EB),
    onSecondary = Color(0xFF20314C),
    secondaryContainer = Color(0xFF364763),
    onSecondaryContainer = Color(0xFFD9E2FF),
    background = Color(0xFF020617),
    surface = Color(0xFF0F172A),
    surfaceVariant = Color(0xFF1E293B),
    onBackground = Color(0xFFF8FAFC),
    onSurface = Color(0xFFF8FAFC),
    outline = Color(0xFF64748B),
    error = Color(0xFFFCA5A5),
)

@Composable
fun AutoFansTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit,
) {
    val colors = if (darkTheme) AutoFansDarkColors else AutoFansLightColors
    val view = LocalView.current
    if (!view.isInEditMode) {
        SideEffect {
            val window = (view.context as Activity).window
            WindowCompat.getInsetsController(window, view).apply {
                isAppearanceLightStatusBars = !darkTheme
                isAppearanceLightNavigationBars = !darkTheme
            }
        }
    }
    MaterialTheme(colorScheme = colors, content = content)
}
