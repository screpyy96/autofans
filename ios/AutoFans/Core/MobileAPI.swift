import Foundation
import OSLog
import UIKit

actor MobileAPI {
    private let config: APIConfiguration
    private let auth: AuthStore
    private let encoder = JSONEncoder(), decoder = JSONDecoder()
    private static let logger = Logger(subsystem: "ro.autofans.app", category: "MobileAPI")
    private static let activitySessionKey = "autofans.activity.session"
    init(config: APIConfiguration, auth: AuthStore) { self.config = config; self.auth = auth }

    func call(_ operation: String, payload: [String: JSONValue] = [:]) async throws -> [String: JSONValue] {
        let function = Self.chatOperations.contains(operation) ? "chat-v1" : "mobile-v1"
        Self.logger.info("Preparing \(operation, privacy: .public) via \(function, privacy: .public)")
        let session: AuthSession
        do {
            session = try await auth.activeSession()
        } catch {
            Self.logger.error("\(operation, privacy: .public) could not get an active session: \(error.localizedDescription, privacy: .public)")
            throw error
        }
        var request = URLRequest(url: config.supabaseURL.appendingPath("functions/v1/\(function)"))
        request.httpMethod = "POST"
        request.timeoutInterval = 20
        request.setValue(config.anonKey, forHTTPHeaderField: "apikey")
        request.setValue("Bearer \(session.accessToken)", forHTTPHeaderField: "Authorization")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try encoder.encode(["operation": JSONValue.string(operation), "payload": JSONValue.object(payload)])

        Self.logger.info("Starting \(operation, privacy: .public) via \(function, privacy: .public)")
        do {
            let (data, response) = try await URLSession.shared.data(for: request)
            guard let http = response as? HTTPURLResponse else {
                Self.logger.error("\(operation, privacy: .public) returned a non-HTTP response")
                throw APIError.invalidResponse
            }
            guard 200..<300 ~= http.statusCode else {
                let message = SupabaseRepository.message(data) ?? "Cererea a eșuat."
                Self.logger.error("\(operation, privacy: .public) failed with HTTP \(http.statusCode): \(message, privacy: .public)")
                throw APIError.server(status: http.statusCode, message: message)
            }
            let result = try decoder.decode([String: JSONValue].self, from: data)
            Self.logger.info("Finished \(operation, privacy: .public) with HTTP \(http.statusCode)")
            return result
        } catch {
            Self.logger.error("\(operation, privacy: .public) request failed: \(error.localizedDescription, privacy: .public)")
            throw error
        }
    }

    func registerPushToken(_ token: String) async throws {
        guard token.count >= 30 else { return }
        _ = try await call("register_push_token", payload: [
            "token": .string(token),
            "platform": .string("ios"),
        ])
    }

    func uploadListingImage(_ image: UIImage) async throws -> String {
        guard let data = image.jpegData(compressionQuality: 0.82), data.count <= 10 * 1024 * 1024 else { throw APIError.server(status: 400, message: "Imaginea poate avea cel mult 10 MB.") }
        let session = try await auth.activeSession(), path = "\(session.user.id)/mobile/\(UUID().uuidString).jpg"
        var request = URLRequest(url: config.supabaseURL.appendingPath("storage/v1/object/listing-images/\(path)")); request.httpMethod = "POST"; request.setValue(config.anonKey, forHTTPHeaderField: "apikey"); request.setValue("Bearer \(session.accessToken)", forHTTPHeaderField: "Authorization"); request.setValue("image/jpeg", forHTTPHeaderField: "Content-Type"); request.httpBody = data
        let (_, response) = try await URLSession.shared.data(for: request)
        guard let http = response as? HTTPURLResponse, 200..<300 ~= http.statusCode else { throw APIError.server(status: (response as? HTTPURLResponse)?.statusCode ?? 0, message: "Nu am putut încărca imaginea.") }
        return path
    }

    /// Compresses and uploads a profile image to the public avatar bucket. The
    /// storage policy allows each user to write only inside their own UUID folder.
    func uploadProfileAvatar(_ image: UIImage) async throws -> String {
        let maximumDimension: CGFloat = 1_200
        let sourceSize = image.size
        let scale = min(1, maximumDimension / max(sourceSize.width, sourceSize.height))
        let targetSize = CGSize(width: max(1, floor(sourceSize.width * scale)), height: max(1, floor(sourceSize.height * scale)))
        let rendered = UIGraphicsImageRenderer(size: targetSize).image { _ in image.draw(in: CGRect(origin: .zero, size: targetSize)) }

        guard let data = rendered.jpegData(compressionQuality: 0.82), data.count <= 5 * 1024 * 1024 else {
            throw APIError.server(status: 400, message: "Fotografia de profil poate avea cel mult 5 MB.")
        }

        let session = try await auth.activeSession()
        let path = "\(session.user.id)/avatar-\(UUID().uuidString).jpg"
        var request = URLRequest(url: config.supabaseURL.appendingPath("storage/v1/object/profile-avatars/\(path)"))
        request.httpMethod = "POST"
        request.setValue(config.anonKey, forHTTPHeaderField: "apikey")
        request.setValue("Bearer \(session.accessToken)", forHTTPHeaderField: "Authorization")
        request.setValue("image/jpeg", forHTTPHeaderField: "Content-Type")
        request.httpBody = data

        let (_, response) = try await URLSession.shared.data(for: request)
        guard let http = response as? HTTPURLResponse, 200..<300 ~= http.statusCode else {
            throw APIError.server(status: (response as? HTTPURLResponse)?.statusCode ?? 0, message: "Nu am putut încărca fotografia de profil.")
        }
        return config.supabaseURL.appendingPath("storage/v1/object/public/profile-avatars/\(path)").absoluteString
    }

    func recordListingView(listingID: Int) async throws {
        try await recordPublicActivity(
            path: "rest/v1/listing_views",
            payload: [
                "listing_id": .number(Double(listingID)),
                "visitor_id": .null,
                "session_id": .string(activitySessionID()),
                "viewed_on": .string(Self.currentActivityDay()),
            ],
        )
    }

    func recordListingContact(listingID: Int, contactType: String) async throws {
        let normalizedType = Self.normalizedContactType(contactType)
        try await recordPublicActivity(
            path: "rest/v1/listing_contacts",
            payload: [
                "listing_id": .number(Double(listingID)),
                "visitor_id": .null,
                "contact_type": .string(normalizedType),
                "session_id": .string(activitySessionID()),
                "contacted_on": .string(Self.currentActivityDay()),
            ],
        )
    }

    private static let chatOperations: Set<String> = [
        "conversations",
        "messages",
        "start_conversation",
        "send_message",
        "mark_conversation_read",
    ]

    private func activitySessionID() -> String {
        if let existing = UserDefaults.standard.string(forKey: Self.activitySessionKey), existing.count >= 12 {
            return existing
        }
        let created = UUID().uuidString.lowercased()
        UserDefaults.standard.set(created, forKey: Self.activitySessionKey)
        return created
    }

    private static func currentActivityDay() -> String {
        ISO8601DateFormatter().string(from: Date()).prefix(10).description
    }

    private static func normalizedContactType(_ value: String) -> String {
        switch value {
        case "phone", "whatsapp", "viewing":
            return value
        default:
            return "message"
        }
    }

    private func recordPublicActivity(path: String, payload: [String: JSONValue]) async throws {
        var request = URLRequest(url: config.supabaseURL.appendingPath(path))
        request.httpMethod = "POST"
        request.timeoutInterval = 10
        request.setValue(config.anonKey, forHTTPHeaderField: "apikey")
        request.setValue("Bearer \(config.anonKey)", forHTTPHeaderField: "Authorization")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("return=minimal", forHTTPHeaderField: "Prefer")
        request.httpBody = try encoder.encode(payload)

        let (data, response) = try await URLSession.shared.data(for: request)
        guard let http = response as? HTTPURLResponse else { throw APIError.invalidResponse }
        if 200..<300 ~= http.statusCode { return }

        if http.statusCode == 409 {
            let duplicate = (try? JSONSerialization.jsonObject(with: data) as? [String: Any])?["code"] as? String
            if duplicate == "23505" { return }
        }

        throw APIError.server(status: http.statusCode, message: SupabaseRepository.message(data) ?? "Nu am putut actualiza statisticile anunțului.")
    }

}
