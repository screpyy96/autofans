package ro.autofans.app.ui

import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.Chat
import androidx.compose.material.icons.automirrored.filled.CompareArrows
import androidx.compose.material.icons.filled.FavoriteBorder
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.AddCircle
import androidx.compose.material.icons.filled.DirectionsCar
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Badge
import androidx.compose.material3.BadgedBox
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.NavigationBarItemDefaults
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.navigation.NavDestination
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.navArgument
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import ro.autofans.app.data.ListingRepository
import ro.autofans.app.data.SupabaseAuthRepository
import ro.autofans.app.data.MobileApi
import kotlinx.coroutines.launch
import kotlinx.coroutines.flow.StateFlow
import kotlinx.serialization.json.intOrNull
import kotlinx.serialization.json.jsonArray
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import com.google.firebase.messaging.FirebaseMessaging

private const val CATALOG_ROUTE = "catalog"
private const val GARAGE_ROUTE = "garage"
private const val DETAIL_ROUTE = "listing/{slug}"
private const val LOGIN_ROUTE = "login"
private const val ACCOUNT_ROUTE = "account"
private const val LISTING_EDITOR_BASE = "listing-editor"
private const val LISTING_EDITOR_ROUTE = "$LISTING_EDITOR_BASE?listingId={listingId}"
private const val SELLER_LISTINGS_ROUTE = "seller-listings"
private const val MESSAGES_ROUTE = "messages"
private const val SELLER_DASHBOARD_ROUTE = "seller-dashboard"
private const val COLLECTION_ROUTE = "collection/{kind}"
private const val SELLER_PROFILE_ROUTE = "seller/{sellerId}"
private const val COMPARE_ROUTE = "compare"

private data class MainDestination(
    val route: String,
    val label: String,
    val protected: Boolean,
    val icon: @Composable () -> Unit,
)

private val buyerMainDestinations = listOf(
    MainDestination(GARAGE_ROUTE, "Garaj 🏎️", protected = false) { Icon(Icons.Default.DirectionsCar, contentDescription = null) },
    MainDestination(CATALOG_ROUTE, "Căutare", protected = false) { Icon(Icons.Default.Home, contentDescription = null) },
    MainDestination("collection/favorites", "Favorite", protected = true) { Icon(Icons.Default.FavoriteBorder, contentDescription = null) },
    MainDestination(MESSAGES_ROUTE, "Mesaje", protected = true) { Icon(Icons.AutoMirrored.Filled.Chat, contentDescription = null) },
    MainDestination(ACCOUNT_ROUTE, "Cont", protected = true) { Icon(Icons.Default.Person, contentDescription = null) },
)

private val sellerMainDestinations = listOf(
    MainDestination(GARAGE_ROUTE, "Garaj 🏎️", protected = false) { Icon(Icons.Default.DirectionsCar, contentDescription = null) },
    MainDestination(CATALOG_ROUTE, "Căutare", protected = false) { Icon(Icons.Default.Home, contentDescription = null) },
    MainDestination(LISTING_EDITOR_BASE, "Vinde", protected = true) { Icon(Icons.Default.AddCircle, contentDescription = null) },
    MainDestination(MESSAGES_ROUTE, "Mesaje", protected = true) { Icon(Icons.AutoMirrored.Filled.Chat, contentDescription = null) },
    MainDestination(ACCOUNT_ROUTE, "Cont", protected = true) { Icon(Icons.Default.Person, contentDescription = null) },
)

@Composable
fun AutoFansNavigation(
    repository: ListingRepository,
    authRepository: SupabaseAuthRepository,
    mobileApi: MobileApi,
    pendingConversationId: StateFlow<Long?>,
    accountRefreshVersion: StateFlow<Int>,
    onConversationOpened: (Long) -> Unit,
) {
    val navController = rememberNavController()
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val session by authRepository.sessionState.collectAsStateWithLifecycle()
    val requestedConversationId by pendingConversationId.collectAsState()
    val requestedAccountRefreshVersion by accountRefreshVersion.collectAsState()
    val backStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = backStackEntry?.destination?.route
    val latestRoute by rememberUpdatedState(currentRoute)
    val currentCollectionKind = backStackEntry?.arguments?.getString("kind")
    var pendingProtectedRoute by remember { mutableStateOf<String?>(null) }
    var sellerAccount by remember { mutableStateOf(false) }
    var unreadMessageCount by remember { mutableIntStateOf(0) }
    val passwordRecovery = authRepository.passwordRecovery.collectAsStateWithLifecycle().value
    val mainDestinations = if (sellerAccount) sellerMainDestinations else buyerMainDestinations
    fun refreshUnreadMessageCount() {
        if (session == null) {
            unreadMessageCount = 0
            return
        }
        scope.launch {
            runCatching {
                mobileApi.call("conversations")["conversations"]
                    ?.jsonArray
                    ?.sumOf { conversation -> conversation.jsonObject["unread_count"]?.jsonPrimitive?.intOrNull ?: 0 }
                    ?: 0
            }.onSuccess { unreadMessageCount = it }
        }
    }
    DisposableEffect(session?.user?.id) {
        var subscription: java.io.Closeable? = null
        val job = session?.let { activeSession ->
            scope.launch {
                subscription = runCatching {
                    mobileApi.subscribeToMessages(
                        onEvent = { event ->
                            refreshUnreadMessageCount()
                            if (event.senderId != null && event.senderId != activeSession.user.id && latestRoute != MESSAGES_ROUTE &&
                                (android.os.Build.VERSION.SDK_INT < 33 || androidx.core.content.ContextCompat.checkSelfPermission(context, android.Manifest.permission.POST_NOTIFICATIONS) == android.content.pm.PackageManager.PERMISSION_GRANTED)
                            ) MessageNotification.show(
                                context = context,
                                title = "Mesaj nou",
                                body = event.message["body"]?.jsonPrimitive?.content ?: "Ai primit un mesaj nou în AutoFans.",
                                notificationId = event.conversationId.toInt(),
                                conversationId = event.conversationId,
                            )
                        },
                        onError = { },
                    )
                }.getOrNull()
            }
        }
        onDispose { job?.cancel(); subscription?.close() }
    }
    LaunchedEffect(session?.user?.id) {
        refreshUnreadMessageCount()
    }
    LaunchedEffect(session?.user?.id) {
        if (session == null) return@LaunchedEffect
        FirebaseMessaging.getInstance().token.addOnSuccessListener { token ->
            scope.launch { runCatching { mobileApi.registerPushToken(token) } }
        }
    }
    LaunchedEffect(session?.user?.id) {
        sellerAccount = session?.let {
            runCatching { mobileApi.call("account") }
                .getOrNull()
                ?.get("profile")
                ?.let { profile -> (profile as? kotlinx.serialization.json.JsonObject)?.get("role")?.toString()?.trim('"') == "seller" }
                ?: false
        } ?: false
    }
    LaunchedEffect(passwordRecovery) {
        if (passwordRecovery) navController.navigate(LOGIN_ROUTE)
    }
    LaunchedEffect(requestedConversationId, session?.user?.id) {
        if (requestedConversationId == null) return@LaunchedEffect
        if (session == null) {
            pendingProtectedRoute = MESSAGES_ROUTE
            navController.navigate(LOGIN_ROUTE) { launchSingleTop = true }
        } else {
            navController.navigate(MESSAGES_ROUTE) {
                popUpTo(navController.graph.findStartDestination().id) { saveState = true }
                launchSingleTop = true
                restoreState = true
            }
        }
    }
    LaunchedEffect(requestedAccountRefreshVersion, session?.user?.id) {
        if (requestedAccountRefreshVersion == 0) return@LaunchedEffect
        if (session == null) {
            pendingProtectedRoute = ACCOUNT_ROUTE
            navController.navigate(LOGIN_ROUTE) { launchSingleTop = true }
        } else {
            navController.navigate(ACCOUNT_ROUTE) {
                popUpTo(navController.graph.findStartDestination().id) { saveState = true }
                launchSingleTop = true
                restoreState = true
            }
        }
    }
    fun navigateToMain(route: String) {
        if (session == null && mainDestinations.firstOrNull { it.route == route }?.protected == true) {
            pendingProtectedRoute = route
            navController.navigate(LOGIN_ROUTE) { launchSingleTop = true }
            return
        }
        navController.navigate(route) {
            popUpTo(navController.graph.findStartDestination().id) { saveState = true }
            launchSingleTop = true
            restoreState = true
        }
    }
    fun navigateToProtected(route: String) {
        if (session == null) {
            pendingProtectedRoute = route
            navController.navigate(LOGIN_ROUTE) { launchSingleTop = true }
        } else {
            navigateToMain(route)
        }
    }
    val showBottomNavigation = currentRoute in setOf(CATALOG_ROUTE, GARAGE_ROUTE, COLLECTION_ROUTE, COMPARE_ROUTE, MESSAGES_ROUTE, ACCOUNT_ROUTE)
    val headerTitle = when (currentRoute) {
        CATALOG_ROUTE -> null
        GARAGE_ROUTE -> "Garajul Comunității 🏎️"
        COLLECTION_ROUTE -> when (currentCollectionKind) {
            "favorites" -> "Favorite"
            "saved" -> "Căutări salvate"
            "notifications" -> "Notificări"
            else -> "Colecția mea"
        }
        COMPARE_ROUTE -> "Compară"
        MESSAGES_ROUTE -> "Mesaje"
        ACCOUNT_ROUTE -> "Contul meu"
        else -> null
    }
    Surface(modifier = Modifier.fillMaxSize()) {
        Scaffold(
            modifier = Modifier.fillMaxSize(),
            topBar = {
                if (showBottomNavigation && currentRoute != MESSAGES_ROUTE) {
                    PremiumAppHeader(
                        title = headerTitle,
                        isAuthenticated = session != null,
                        accountEmail = session?.user?.email,
                        onAccount = { navigateToMain(ACCOUNT_ROUTE) },
                        onNotifications = { navigateToProtected("collection/notifications") },
                    )
                }
            },
            bottomBar = {
                if (showBottomNavigation) {
                    AutoFansBottomNavigation(
                        currentRoute = currentRoute,
                        currentCollectionKind = currentCollectionKind,
                        destinations = mainDestinations,
                        unreadMessageCount = unreadMessageCount,
                        onDestinationSelected = ::navigateToMain,
                    )
                }
            },
        ) { padding ->
        NavHost(
            navController = navController,
            startDestination = GARAGE_ROUTE,
            modifier = Modifier.padding(padding),
        ) {
            composable(CATALOG_ROUTE) {
                CatalogRoute(
                    repository = repository,
                    mobileApi = mobileApi,
                    isAuthenticated = session != null,
                    onListingSelected = { slug -> navController.navigate("listing/$slug") },
                    onAccount = { navigateToMain(ACCOUNT_ROUTE) },
                )
            }
            composable(
                route = DETAIL_ROUTE,
                arguments = listOf(navArgument("slug") { type = NavType.StringType }),
            ) { entry ->
                ListingDetailRoute(
                    slug = entry.arguments?.getString("slug").orEmpty(),
                    repository = repository,
                    onBack = navController::popBackStack,
                    mobileApi = mobileApi,
                    onMessages = { navController.navigate(MESSAGES_ROUTE) },
                    onSeller = { id -> navController.navigate("seller/$id") },
                    onCompare = { navController.navigate(COMPARE_ROUTE) },
                )
            }
            composable(LOGIN_ROUTE) {
                LoginRoute(authRepository = authRepository, onDone = {
                    val destination = pendingProtectedRoute
                    pendingProtectedRoute = null
                    navController.popBackStack()
                    destination?.let(::navigateToMain)
                })
            }
            composable(ACCOUNT_ROUTE) {
                AccountRoute(mobileApi = mobileApi, authRepository = authRepository, refreshVersion = requestedAccountRefreshVersion, onBack = navController::popBackStack, onNewListing = { navController.navigate(LISTING_EDITOR_BASE) }, onSellerListings = { navController.navigate(SELLER_LISTINGS_ROUTE) }, onMessages = { navController.navigate(MESSAGES_ROUTE) }, onSellerDashboard = { navController.navigate(SELLER_DASHBOARD_ROUTE) }, onCollection = { kind -> navController.navigate("collection/$kind") }, onSellerRoleChanged = { sellerAccount = it })
            }
            composable(LISTING_EDITOR_ROUTE, arguments=listOf(navArgument("listingId") { type=NavType.LongType; defaultValue=0L })) { entry ->
                ListingEditorRoute(
                    api = mobileApi,
                    onDone = navController::popBackStack,
                    editingId = entry.arguments?.getLong("listingId")?.takeIf { it > 0 },
                    onViewListing = { slug ->
                        navController.navigate("listing/$slug") {
                            popUpTo(CATALOG_ROUTE) { saveState = true }
                        }
                    },
                    onSellerListings = {
                        navController.navigate(SELLER_LISTINGS_ROUTE) {
                            popUpTo(CATALOG_ROUTE) { saveState = true }
                        }
                    },
                )
            }
            composable(SELLER_LISTINGS_ROUTE) { SellerListingsRoute(mobileApi, navController::popBackStack, onEdit = { id -> navController.navigate("$LISTING_EDITOR_BASE?listingId=$id") }) }
            composable(MESSAGES_ROUTE) {
                MessagesRoute(
                    api = mobileApi,
                    onBack = navController::popBackStack,
                    embedded = true,
                    requestedConversationId = requestedConversationId,
                    onRequestedConversationOpened = onConversationOpened,
                    onUnreadMessagesChanged = ::refreshUnreadMessageCount,
                )
            }
            composable(GARAGE_ROUTE) {
                GarageScreen(
                    mobileApi = mobileApi,
                    onVehicleSelected = { slug ->
                        navController.navigate("listing/$slug")
                    }
                )
            }
            composable(SELLER_DASHBOARD_ROUTE) { SellerDashboardRoute(mobileApi, navController::popBackStack) }
            composable(COLLECTION_ROUTE, arguments=listOf(navArgument("kind") { type=NavType.StringType })) { entry -> CollectionRoute(mobileApi, entry.arguments?.getString("kind").orEmpty(), navController::popBackStack, onCatalog = { navController.navigate(CATALOG_ROUTE) { popUpTo(CATALOG_ROUTE) } }, onListing = { slug -> navController.navigate("listing/$slug") }, embedded = true) }
            composable(SELLER_PROFILE_ROUTE, arguments=listOf(navArgument("sellerId") { type=NavType.StringType })) { entry -> SellerProfileRoute(mobileApi, entry.arguments?.getString("sellerId").orEmpty(), navController::popBackStack) }
            composable(COMPARE_ROUTE) { CompareRoute(navController::popBackStack, embedded = true) }
        }
        }
    }
}

@Composable
private fun AutoFansBottomNavigation(
    currentRoute: String?,
    currentCollectionKind: String?,
    destinations: List<MainDestination>,
    unreadMessageCount: Int,
    onDestinationSelected: (String) -> Unit,
) {
    NavigationBar(
        containerColor = MaterialTheme.colorScheme.surface,
        tonalElevation = 0.dp,
    ) {
        destinations.forEach { destination ->
            val selected = when (destination.route) {
                "collection/favorites" -> currentRoute == COLLECTION_ROUTE && currentCollectionKind == "favorites"
                else -> currentRoute == destination.route
            }
            NavigationBarItem(
                selected = selected,
                onClick = { onDestinationSelected(destination.route) },
                icon = {
                    if (destination.route == MESSAGES_ROUTE && unreadMessageCount > 0) {
                        BadgedBox(
                            badge = {
                                Badge(containerColor = MaterialTheme.colorScheme.error) {
                                    androidx.compose.material3.Text(if (unreadMessageCount > 9) "9+" else unreadMessageCount.toString())
                                }
                            },
                        ) { destination.icon() }
                    } else {
                        destination.icon()
                    }
                },
                label = { androidx.compose.material3.Text(destination.label) },
                alwaysShowLabel = true,
                colors = NavigationBarItemDefaults.colors(
                    selectedIconColor = MaterialTheme.colorScheme.primary,
                    selectedTextColor = MaterialTheme.colorScheme.primary,
                    unselectedIconColor = MaterialTheme.colorScheme.onSurfaceVariant,
                    unselectedTextColor = MaterialTheme.colorScheme.onSurfaceVariant,
                    indicatorColor = androidx.compose.ui.graphics.Color.Transparent,
                ),
            )
        }
    }
}
