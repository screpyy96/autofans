import Foundation

struct ListingPage { let listings: [Listing]; let total: Int; let hasMore: Bool }

actor SupabaseRepository {
    private let config: APIConfiguration
    private let decoder = JSONDecoder()
    private let encoder = JSONEncoder()
    private let columns = "id,owner_id,slug,title,description,price,currency,make,model,year,mileage,fuel_type,transmission,body_type,city,county,images,created_at,power,engine_size,doors,seats,features"

    init(config: APIConfiguration) { self.config = config }

    func search(query: String, filters: ListingSearchFilters, sort: ListingSort, page: Int, pageSize: Int = 20) async throws -> ListingPage {
        var components = URLComponents(url: config.supabaseURL.appendingPath("rest/v1/rpc/search_published_listings"), resolvingAgainstBaseURL: false)!
        let offset = max(0, page - 1) * pageSize
        components.queryItems = [URLQueryItem(name: "select", value: columns), URLQueryItem(name: "offset", value: String(offset)), URLQueryItem(name: "limit", value: String(pageSize))]
        var request = try request(url: components.url!, method: "POST", authenticated: false)
        request.setValue("count=exact", forHTTPHeaderField: "Prefer")
        request.httpBody = try encoder.encode(filters.rpcPayload(query: query, sort: sort))
        let (data, response) = try await execute(request)
        var listings = try decoder.decode([Listing].self, from: data)
        await signImages(&listings)
        let total = Int((response.value(forHTTPHeaderField: "Content-Range") ?? "").split(separator: "/").last ?? "") ?? listings.count
        return ListingPage(listings: listings, total: total, hasMore: offset + listings.count < total)
    }

    func listing(slug: String) async throws -> Listing? {
        var components = URLComponents(url: config.supabaseURL.appendingPath("rest/v1/listings"), resolvingAgainstBaseURL: false)!
        components.queryItems = [URLQueryItem(name: "select", value: columns), URLQueryItem(name: "slug", value: "eq.\(slug)"), URLQueryItem(name: "status", value: "eq.published"), URLQueryItem(name: "limit", value: "1")]
        let (data, _) = try await execute(try request(url: components.url!, method: "GET", authenticated: false))
        var listings = try decoder.decode([Listing].self, from: data)
        await signImages(&listings)
        return listings.first
    }

    private func signImages(_ listings: inout [Listing]) async {
        let paths = Array(Set(listings.flatMap(\.images).map(\.path).filter { !$0.isEmpty }))
        guard !paths.isEmpty else { return }
        struct SignRequest: Encodable { let paths: [String]; let expiresIn: Int }
        struct Signed: Decodable { let name: String?; let path: String?; let signedURL: String? }
        do {
            var request = try request(url: config.supabaseURL.appendingPath("storage/v1/object/sign/listing-images"), method: "POST", authenticated: false)
            request.httpBody = try encoder.encode(SignRequest(paths: paths, expiresIn: 3600))
            let (data, _) = try await execute(request)
            let urls = try decoder.decode([Signed].self, from: data).reduce(into: [String: URL]()) { result, item in
                guard let path = item.path ?? item.name, let signed = item.signedURL else { return }
                guard let signedURL = storageSignedURL(from: signed) else { return }
                result[path] = signedURL
            }
            listings.indices.forEach { index in listings[index].images.indices.forEach { imageIndex in listings[index].images[imageIndex].url = urls[listings[index].images[imageIndex].path] } }
        } catch { /* A card remains usable when Storage signing is temporarily unavailable. */ }
    }

    /// Storage may return either an absolute signed URL or a path such as
    /// `/object/sign/<bucket>/<file>?token=...`. `URL(string:)` accepts the
    /// latter as a relative URL, but URLSession cannot download it without a host.
    private func storageSignedURL(from value: String) -> URL? {
        if let absoluteURL = URL(string: value), absoluteURL.scheme != nil, absoluteURL.host != nil {
            return absoluteURL
        }

        let path = value.hasPrefix("/") ? value : "/\(value)"
        let baseURL = config.supabaseURL.absoluteString.trimmingCharacters(in: CharacterSet(charactersIn: "/"))
        return URL(string: "\(baseURL)/storage/v1\(path)")
    }

    private func request(url: URL, method: String, authenticated: Bool) throws -> URLRequest {
        var request = URLRequest(url: url); request.httpMethod = method; request.setValue(config.anonKey, forHTTPHeaderField: "apikey"); request.setValue("application/json", forHTTPHeaderField: "Content-Type"); request.setValue("Bearer \(config.anonKey)", forHTTPHeaderField: "Authorization"); return request
    }

    private func execute(_ request: URLRequest) async throws -> (Data, HTTPURLResponse) {
        let (data, response) = try await URLSession.shared.data(for: request)
        guard let http = response as? HTTPURLResponse else { throw APIError.invalidResponse }
        guard 200..<300 ~= http.statusCode else { throw APIError.server(status: http.statusCode, message: Self.message(data) ?? "Cererea a eșuat.") }
        return (data, http)
    }
    static func message(_ data: Data) -> String? {
        guard let response = try? JSONSerialization.jsonObject(with: data) as? [String: Any] else {
            return String(data: data, encoding: .utf8)?.trimmingCharacters(in: .whitespacesAndNewlines).nonEmpty
        }

        for key in ["msg", "message", "error_description", "error"] {
            if let message = response[key] as? String, !message.isEmpty { return message }
        }
        return nil
    }
}

private extension String {
    var nonEmpty: String? { isEmpty ? nil : self }
}
