package ro.autofans.app.ui

import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.Chat
import androidx.compose.material.icons.automirrored.filled.CompareArrows
import androidx.compose.material.icons.filled.FavoriteBorder
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Person
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.NavigationBarItemDefaults
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
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

private const val CATALOG_ROUTE = "catalog"
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

private val mainDestinations = listOf(
    MainDestination(CATALOG_ROUTE, "Acasă", protected = false) { Icon(Icons.Default.Home, contentDescription = null) },
    MainDestination("collection/favorites", "Favorite", protected = true) { Icon(Icons.Default.FavoriteBorder, contentDescription = null) },
    MainDestination(COMPARE_ROUTE, "Compară", protected = false) { Icon(Icons.AutoMirrored.Filled.CompareArrows, contentDescription = null) },
    MainDestination(MESSAGES_ROUTE, "Mesaje", protected = true) { Icon(Icons.AutoMirrored.Filled.Chat, contentDescription = null) },
    MainDestination(ACCOUNT_ROUTE, "Cont", protected = true) { Icon(Icons.Default.Person, contentDescription = null) },
)

@Composable
fun AutoFansNavigation(repository: ListingRepository, authRepository: SupabaseAuthRepository, mobileApi: MobileApi) {
    val navController = rememberNavController()
    val session by authRepository.sessionState.collectAsStateWithLifecycle()
    val backStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = backStackEntry?.destination?.route
    val currentCollectionKind = backStackEntry?.arguments?.getString("kind")
    var pendingProtectedRoute by remember { mutableStateOf<String?>(null) }
    val passwordRecovery = authRepository.passwordRecovery.collectAsStateWithLifecycle().value
    LaunchedEffect(passwordRecovery) {
        if (passwordRecovery) navController.navigate(LOGIN_ROUTE)
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
    val showBottomNavigation = currentRoute in setOf(CATALOG_ROUTE, COLLECTION_ROUTE, COMPARE_ROUTE, MESSAGES_ROUTE, ACCOUNT_ROUTE)
    val headerTitle = when (currentRoute) {
        CATALOG_ROUTE -> null
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
                if (showBottomNavigation) {
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
                        onDestinationSelected = ::navigateToMain,
                    )
                }
            },
        ) { padding ->
        NavHost(
            navController = navController,
            startDestination = CATALOG_ROUTE,
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
                AccountRoute(mobileApi = mobileApi, authRepository = authRepository, onBack = navController::popBackStack, onNewListing = { navController.navigate(LISTING_EDITOR_BASE) }, onSellerListings = { navController.navigate(SELLER_LISTINGS_ROUTE) }, onMessages = { navController.navigate(MESSAGES_ROUTE) }, onSellerDashboard = { navController.navigate(SELLER_DASHBOARD_ROUTE) }, onCollection = { kind -> navController.navigate("collection/$kind") })
            }
            composable(LISTING_EDITOR_ROUTE, arguments=listOf(navArgument("listingId") { type=NavType.LongType; defaultValue=0L })) { entry -> ListingEditorRoute(mobileApi, navController::popBackStack, entry.arguments?.getLong("listingId")?.takeIf { it > 0 }) }
            composable(SELLER_LISTINGS_ROUTE) { SellerListingsRoute(mobileApi, navController::popBackStack, onEdit = { id -> navController.navigate("$LISTING_EDITOR_BASE?listingId=$id") }) }
            composable(MESSAGES_ROUTE) { MessagesRoute(mobileApi, navController::popBackStack, embedded = true) }
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
    onDestinationSelected: (String) -> Unit,
) {
    NavigationBar(
        containerColor = MaterialTheme.colorScheme.surface,
        tonalElevation = 0.dp,
    ) {
        mainDestinations.forEach { destination ->
            val selected = when (destination.route) {
                "collection/favorites" -> currentRoute == COLLECTION_ROUTE && currentCollectionKind == "favorites"
                else -> currentRoute == destination.route
            }
            NavigationBarItem(
                selected = selected,
                onClick = { onDestinationSelected(destination.route) },
                icon = destination.icon,
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
