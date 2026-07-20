import Foundation
import UIKit

actor MobileAPI {
    private let config: APIConfiguration
    private let auth: AuthStore
    private let encoder = JSONEncoder(), decoder = JSONDecoder()
    init(config: APIConfiguration, auth: AuthStore) { self.config = config; self.auth = auth }

    func call(_ operation: String, payload: [String: JSONValue] = [:]) async throws -> [String: JSONValue] {
        let session = try await auth.activeSession()
        let function = Self.chatOperations.contains(operation) ? "chat-v1" : "mobile-v1"
        var request = URLRequest(url: config.supabaseURL.appendingPath("functions/v1/\(function)")); request.httpMethod = "POST"; request.setValue(config.anonKey, forHTTPHeaderField: "apikey"); request.setValue("Bearer \(session.accessToken)", forHTTPHeaderField: "Authorization"); request.setValue("application/json", forHTTPHeaderField: "Content-Type"); request.httpBody = try encoder.encode(["operation": JSONValue.string(operation), "payload": JSONValue.object(payload)])
        let (data, response) = try await URLSession.shared.data(for: request)
        guard let http = response as? HTTPURLResponse else { throw APIError.invalidResponse }
        guard 200..<300 ~= http.statusCode else { throw APIError.server(status: http.statusCode, message: SupabaseRepository.message(data) ?? "Cererea a eșuat.") }
        return try decoder.decode([String: JSONValue].self, from: data)
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

    private static let chatOperations: Set<String> = [
        "conversations",
        "messages",
        "start_conversation",
        "send_message",
        "mark_conversation_read",
    ]
}
