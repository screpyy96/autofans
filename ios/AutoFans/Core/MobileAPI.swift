import Foundation
import UIKit

actor MobileAPI {
    private let config: APIConfiguration
    private let auth: AuthStore
    private let encoder = JSONEncoder(), decoder = JSONDecoder()
    init(config: APIConfiguration, auth: AuthStore) { self.config = config; self.auth = auth }

    func call(_ operation: String, payload: [String: JSONValue] = [:]) async throws -> [String: JSONValue] {
        let session = try await auth.activeSession()
        var request = URLRequest(url: config.appURL.appendingPath("api/mobile/v1")); request.httpMethod = "POST"; request.setValue("Bearer \(session.accessToken)", forHTTPHeaderField: "Authorization"); request.setValue("application/json", forHTTPHeaderField: "Content-Type"); request.httpBody = try encoder.encode(["operation": JSONValue.string(operation), "payload": JSONValue.object(payload)])
        let (data, response) = try await URLSession.shared.data(for: request)
        guard let http = response as? HTTPURLResponse else { throw APIError.invalidResponse }
        guard 200..<300 ~= http.statusCode else { throw APIError.server(status: http.statusCode, message: SupabaseRepository.message(data) ?? "Cererea a eșuat.") }
        return try decoder.decode([String: JSONValue].self, from: data)
    }

    func uploadListingImage(_ image: UIImage) async throws -> String {
        guard let data = image.jpegData(compressionQuality: 0.82), data.count <= 10 * 1024 * 1024 else { throw APIError.server(status: 400, message: "Imaginea poate avea cel mult 10 MB.") }
        let session = try await auth.activeSession(), path = "\(session.user.id)/mobile/\(UUID().uuidString).jpg"
        var request = URLRequest(url: config.supabaseURL.appendingPath("storage/v1/object/listing-images/\(path)")); request.httpMethod = "POST"; request.setValue(config.anonKey, forHTTPHeaderField: "apikey"); request.setValue("Bearer \(session.accessToken)", forHTTPHeaderField: "Authorization"); request.setValue("image/jpeg", forHTTPHeaderField: "Content-Type"); request.httpBody = data
        let (_, response) = try await URLSession.shared.data(for: request)
        guard let http = response as? HTTPURLResponse, 200..<300 ~= http.statusCode else { throw APIError.server(status: (response as? HTTPURLResponse)?.statusCode ?? 0, message: "Nu am putut încărca imaginea.") }
        return path
    }
}
