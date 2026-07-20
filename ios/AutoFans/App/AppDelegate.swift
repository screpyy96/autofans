import FirebaseCore
import FirebaseMessaging
import UIKit
import UserNotifications

extension Notification.Name {
    static let autoFansFCMToken = Notification.Name("autoFansFCMToken")
    static let autoFansOpenConversation = Notification.Name("autoFansOpenConversation")
    static let autoFansAccountUpdated = Notification.Name("autoFansAccountUpdated")
}

/** Owns the iOS half of FCM. Supabase remains the recipient authority: this
 * delegate only receives the token and the conversation ID included in a push. */
final class AppDelegate: NSObject, UIApplicationDelegate, MessagingDelegate, UNUserNotificationCenterDelegate {
    private static let pendingConversationKey = "pendingPushConversationID"
    private static let pendingAccountUpdateKey = "pendingPushAccountUpdate"
    func application(
        _ application: UIApplication,
        didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil,
    ) -> Bool {
        FirebaseApp.configure()
        Messaging.messaging().delegate = self
        UNUserNotificationCenter.current().delegate = self
        return true
    }

    func application(_ application: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
        Messaging.messaging().apnsToken = deviceToken
    }

    func messaging(_ messaging: Messaging, didReceiveRegistrationToken fcmToken: String?) {
        guard let fcmToken, !fcmToken.isEmpty else { return }
        NotificationCenter.default.post(
            name: .autoFansFCMToken,
            object: nil,
            userInfo: ["token": fcmToken],
        )
    }

    func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        willPresent notification: UNNotification,
        withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void,
    ) {
        Self.handleAccountUpdate(notification.request.content.userInfo)
        completionHandler([.banner, .sound, .badge])
    }

    func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        didReceive response: UNNotificationResponse,
        withCompletionHandler completionHandler: @escaping () -> Void,
    ) {
        if let conversationID = Self.conversationID(from: response.notification.request.content.userInfo) {
            UserDefaults.standard.set(conversationID, forKey: Self.pendingConversationKey)
            NotificationCenter.default.post(
                name: .autoFansOpenConversation,
                object: nil,
                userInfo: ["conversationID": conversationID],
            )
        } else {
            Self.handleAccountUpdate(response.notification.request.content.userInfo, persistForLaunch: true)
        }
        completionHandler()
    }

    private static func conversationID(from userInfo: [AnyHashable: Any]) -> Int? {
        if let value = userInfo["conversationId"] as? String { return Int(value) }
        if let value = userInfo["conversationId"] as? NSNumber { return value.intValue }
        return nil
    }

    private static func handleAccountUpdate(
        _ userInfo: [AnyHashable: Any],
        persistForLaunch: Bool = false,
    ) {
        guard let type = userInfo["type"] as? String,
              type == "seller_verification_approved" || type == "seller_verification_rejected" else { return }
        if persistForLaunch { UserDefaults.standard.set(true, forKey: pendingAccountUpdateKey) }
        NotificationCenter.default.post(name: .autoFansAccountUpdated, object: nil)
    }

    static func takePendingConversationID() -> Int? {
        guard UserDefaults.standard.object(forKey: pendingConversationKey) != nil else { return nil }
        let value = UserDefaults.standard.integer(forKey: pendingConversationKey)
        UserDefaults.standard.removeObject(forKey: pendingConversationKey)
        return value > 0 ? value : nil
    }

    static func takePendingAccountUpdate() -> Bool {
        guard UserDefaults.standard.bool(forKey: pendingAccountUpdateKey) else { return false }
        UserDefaults.standard.removeObject(forKey: pendingAccountUpdateKey)
        return true
    }
}
