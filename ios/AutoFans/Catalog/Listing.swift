import Foundation

struct ListingImage: Codable, Identifiable, Hashable, Sendable {
    var path: String
    var isMain: Bool?
    var url: URL?
    var id: String { path }

    enum CodingKeys: String, CodingKey { case path; case isMain }
}

struct Listing: Codable, Identifiable, Hashable, Sendable {
    let id: Int
    let ownerID: String?
    let slug, title: String
    let description: String?
    let price: Double
    let currency, make, model: String
    let year, mileage: Int?
    let fuelType, transmission, bodyType, city, county: String?
    var images: [ListingImage]
    let createdAt: String?
    let power: Int?
    let engineSize: Double?
    let doors, seats: Int?
    let features: [String]?

    enum CodingKeys: String, CodingKey {
        case id, slug, title, description, price, currency, make, model, year, mileage, images, city, county, transmission, power, doors, seats, features
        case ownerID = "owner_id"; case fuelType = "fuel_type"; case bodyType = "body_type"; case createdAt = "created_at"; case engineSize = "engine_size"
    }

    var mainImage: ListingImage? { images.first(where: { $0.isMain == true }) ?? images.first }
    var location: String { [city, county].compactMap { $0?.isEmpty == false ? $0 : nil }.joined(separator: ", ") }
    var priceText: String { Self.priceFormatter.string(from: NSNumber(value: price))! + " " + currency }
    var details: String { [year.map(String.init), mileage.map { "\($0.formatted(.number.grouping(.automatic))) km" }, fuelType, transmission].compactMap { $0 }.joined(separator: " · ") }
    private static let priceFormatter: NumberFormatter = { let f = NumberFormatter(); f.numberStyle = .decimal; f.locale = Locale(identifier: "ro_RO"); f.maximumFractionDigits = 0; return f }()
}

enum ListingSort: String, CaseIterable, Identifiable { case relevance, priceAsc = "price_asc", priceDesc = "price_desc", yearDesc = "year_desc", mileageAsc = "mileage_asc", dateDesc = "date_desc"
    var id: String { rawValue }
    var title: String { switch self { case .relevance: return "Relevanță"; case .priceAsc: return "Preț crescător"; case .priceDesc: return "Preț descrescător"; case .yearDesc: return "An mai nou"; case .mileageAsc: return "Kilometraj mic"; case .dateDesc: return "Cele mai recente" } }
}

struct ListingSearchFilters: Equatable, Sendable {
    var makes = [String](), models = [String](), fuelTypes = [String](), transmissions = [String]()
    var minPrice: Int?, maxPrice: Int?, minYear: Int?, maxYear: Int?, minMileage: Int?, maxMileage: Int?
    var city = ""
    var isEmpty: Bool { self == ListingSearchFilters() }

    func rpcPayload(query: String, sort: ListingSort) -> [String: JSONValue] {
        ["p_query": query.trimmed.map(JSONValue.string) ?? .null, "p_brands": values(makes), "p_models": values(models),
         "p_price_min": number(minPrice), "p_price_max": number(maxPrice), "p_year_min": number(minYear), "p_year_max": number(maxYear),
         "p_mileage_min": number(minMileage), "p_mileage_max": number(maxMileage), "p_fuel_types": values(fuelTypes), "p_transmissions": values(transmissions),
         "p_city": city.trimmed.map(JSONValue.string) ?? .null, "p_county": .null, "p_latitude": .null, "p_longitude": .null, "p_radius_km": .null,
         "p_service_history": .null, "p_max_owners": .null, "p_sort": .string(sort.rawValue)]
    }

    func savedSearch(query: String) -> JSONValue {
        var root: [String: JSONValue] = [:]
        if let text = query.trimmed { root["query"] = .string(text) }
        if !makes.isEmpty { root["brand"] = .array(makes.map(JSONValue.string)) }
        if !models.isEmpty { root["model"] = .array(models.map(JSONValue.string)) }
        if !fuelTypes.isEmpty { root["fuelType"] = .array(fuelTypes.map(JSONValue.string)) }
        if !transmissions.isEmpty { root["transmission"] = .array(transmissions.map(JSONValue.string)) }
        addRange(&root, "priceRange", minPrice, maxPrice); addRange(&root, "yearRange", minYear, maxYear); addRange(&root, "mileageRange", minMileage, maxMileage)
        if let city = city.trimmed { root["location"] = .object(["id": .string("mobile-city-\(city.lowercased().replacingOccurrences(of: " ", with: "-"))"), "city": .string(city), "county": .string(""), "country": .string("România")]) }
        return .object(root)
    }

    private func values(_ values: [String]) -> JSONValue { values.isEmpty ? .null : .array(values.map(JSONValue.string)) }
    private func number(_ number: Int?) -> JSONValue { number.map { .number(Double($0)) } ?? .null }
    private func addRange(_ root: inout [String: JSONValue], _ key: String, _ min: Int?, _ max: Int?) { if min != nil || max != nil { root[key] = .object(["min": .number(Double(min ?? 0)), "max": .number(Double(max ?? Int.max))]) } }
}

extension String { var trimmed: String? { let value = trimmingCharacters(in: .whitespacesAndNewlines); return value.isEmpty ? nil : value } }
