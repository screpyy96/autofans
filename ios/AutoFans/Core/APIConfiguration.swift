import Foundation

struct APIConfiguration {
    let supabaseURL: URL
    let anonKey: String

    static func load(bundle: Bundle = .main) throws -> APIConfiguration {
        func value(_ key: String) throws -> String {
            guard let value = bundle.object(forInfoDictionaryKey: key) as? String,
                  !value.isEmpty, !value.contains("$(") else {
                throw APIError.configuration("Lipsește \(key). Configurează ios/Config/Secrets.xcconfig.")
            }
            return value
        }
        let url = try value("SUPABASE_URL")
        guard let supabaseURL = URL(string: url), supabaseURL.scheme == "https" else {
            throw APIError.configuration("Configurația URL este invalidă.")
        }
        return APIConfiguration(supabaseURL: supabaseURL, anonKey: try value("SUPABASE_ANON_KEY"))
    }
}

enum APIError: LocalizedError {
    case configuration(String)
    case unauthorized
    case server(status: Int, message: String)
    case invalidResponse

    var errorDescription: String? {
        switch self {
        case .configuration(let message), .server(_, let message): return message
        case .unauthorized: return "Autentifică-te pentru această acțiune."
        case .invalidResponse: return "Răspuns invalid de la server."
        }
    }
}

extension URL {
    func appendingPath(_ path: String) -> URL {
        path.split(separator: "/").reduce(self) { $0.appendingPathComponent(String($1)) }
    }
}
