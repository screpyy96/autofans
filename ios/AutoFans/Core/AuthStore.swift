import Foundation
import SwiftUI

struct AuthUser: Codable, Sendable { let id: String; let email: String? }
struct AuthSession: Codable, Sendable { let accessToken: String; let refreshToken: String?; let expiresAt: Int?; let user: AuthUser
    enum CodingKeys: String, CodingKey { case accessToken = "access_token", refreshToken = "refresh_token", expiresAt = "expires_at", user }
}

@MainActor
final class AuthStore: ObservableObject {
    @Published private(set) var session: AuthSession?
    @Published private(set) var passwordRecovery = false
    let config: APIConfiguration
    private let decoder = JSONDecoder(), encoder = JSONEncoder()

    init(config: APIConfiguration) { self.config = config; self.session = KeychainStore.read(AuthSession.self) }

    var googleURL: URL {
        var components = URLComponents(url: config.supabaseURL.appendingPath("auth/v1/authorize"), resolvingAgainstBaseURL: false)!
        components.queryItems = [URLQueryItem(name: "provider", value: "google"), URLQueryItem(name: "redirect_to", value: "autofans://auth/callback")]
        return components.url!
    }

    func activeSession() async throws -> AuthSession {
        guard let current = session else { throw APIError.unauthorized }
        if current.expiresAt == nil || current.expiresAt! > Int(Date().timeIntervalSince1970) + 60 { return current }
        guard let refreshToken = current.refreshToken else { await clear(); throw APIError.unauthorized }
        do { return try await post(path: "auth/v1/token?grant_type=refresh_token", payload: ["refresh_token": .string(refreshToken)], persist: true) ?? current }
        catch { await clear(); throw error }
    }

    func signIn(email: String, password: String) async throws { _ = try await post(path: "auth/v1/token?grant_type=password", payload: ["email": .string(email), "password": .string(password)], persist: true) }
    func signUp(email: String, password: String) async throws -> Bool { try await post(path: "auth/v1/signup", payload: ["email": .string(email), "password": .string(password), "email_redirect_to": .string("autofans://auth/callback")], persist: true) != nil }
    func sendPasswordReset(email: String) async throws { _ = try await post(path: "auth/v1/recover", payload: ["email": .string(email), "email_redirect_to": .string("autofans://auth/callback")], persist: false) }

    func completeRedirect(_ url: URL) async {
        guard url.scheme == "autofans", url.host == "auth", let fragment = url.fragment else { return }
        let values = URLComponents(string: "https://callback.invalid/?\(fragment)")?.queryItems ?? []
        guard let accessToken = values.first(where: { $0.name == "access_token" })?.value else { return }
        let request = authRequest(url: config.supabaseURL.appendingPath("auth/v1/user"), token: accessToken, method: "GET")
        guard let (data, response) = try? await URLSession.shared.data(for: request), let http = response as? HTTPURLResponse, 200..<300 ~= http.statusCode, let user = try? decoder.decode(AuthUser.self, from: data) else { return }
        let refresh = values.first(where: { $0.name == "refresh_token" })?.value
        let expiry = values.first(where: { $0.name == "expires_at" })?.value.flatMap(Int.init)
        let received = AuthSession(accessToken: accessToken, refreshToken: refresh, expiresAt: expiry, user: user)
        session = received; try? KeychainStore.save(received); passwordRecovery = values.first(where: { $0.name == "type" })?.value == "recovery"
    }

    func updatePassword(_ password: String) async throws {
        guard password.count >= 6 else { throw APIError.server(status: 400, message: "Parola trebuie să aibă cel puțin 6 caractere.") }
        let current = try await activeSession()
        var request = authRequest(url: config.supabaseURL.appendingPath("auth/v1/user"), token: current.accessToken, method: "PUT")
        request.httpBody = try encoder.encode(["password": JSONValue.string(password)])
        _ = try await execute(request); passwordRecovery = false
    }

    func signOut() async { if let current = session { var request = authRequest(url: config.supabaseURL.appendingPath("auth/v1/logout"), token: current.accessToken, method: "POST"); request.httpBody = Data("{}".utf8); _ = try? await URLSession.shared.data(for: request) }; await clear() }
    func clear() async { session = nil; passwordRecovery = false; KeychainStore.delete() }

    private func post(path: String, payload: [String: JSONValue], persist: Bool) async throws -> AuthSession? {
        guard var components = URLComponents(url: config.supabaseURL.appendingPath(path.components(separatedBy: "?").first ?? path), resolvingAgainstBaseURL: false) else { throw APIError.configuration("URL Supabase invalid.") }
        if let query = path.split(separator: "?", maxSplits: 1).dropFirst().first { components.percentEncodedQuery = String(query) }
        var request = URLRequest(url: components.url!); request.httpMethod = "POST"; request.setValue(config.anonKey, forHTTPHeaderField: "apikey"); request.setValue("application/json", forHTTPHeaderField: "Content-Type"); request.httpBody = try encoder.encode(payload)
        let data = try await execute(request)
        let root = try decoder.decode([String: JSONValue].self, from: data)
        let result: AuthSession?
        if root["access_token"] != nil {
            result = try decoder.decode(AuthSession.self, from: data)
        } else if let nested = root["session"], case .object = nested, let nestedData = try? encoder.encode(nested) {
            result = try? decoder.decode(AuthSession.self, from: nestedData)
        } else {
            result = nil
        }
        if persist, let result { session = result; try KeychainStore.save(result) }
        return result
    }

    private func authRequest(url: URL, token: String, method: String) -> URLRequest { var request = URLRequest(url: url); request.httpMethod = method; request.setValue(config.anonKey, forHTTPHeaderField: "apikey"); request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization"); request.setValue("application/json", forHTTPHeaderField: "Content-Type"); return request }
    private func execute(_ request: URLRequest) async throws -> Data { let (data, response) = try await URLSession.shared.data(for: request); guard let http = response as? HTTPURLResponse else { throw APIError.invalidResponse }; guard 200..<300 ~= http.statusCode else { throw APIError.server(status: http.statusCode, message: SupabaseRepository.message(data) ?? "Autentificarea a eșuat.") }; return data }
}
