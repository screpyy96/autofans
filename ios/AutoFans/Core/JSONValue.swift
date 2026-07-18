import Foundation

enum JSONValue: Codable, Equatable, Sendable {
    case string(String), number(Double), bool(Bool), object([String: JSONValue]), array([JSONValue]), null

    init(from decoder: Decoder) throws {
        let container = try decoder.singleValueContainer()
        if container.decodeNil() { self = .null }
        else if let value = try? container.decode(Bool.self) { self = .bool(value) }
        else if let value = try? container.decode(Double.self) { self = .number(value) }
        else if let value = try? container.decode(String.self) { self = .string(value) }
        else if let value = try? container.decode([String: JSONValue].self) { self = .object(value) }
        else { self = .array(try container.decode([JSONValue].self)) }
    }

    func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        switch self {
        case .string(let value): try container.encode(value)
        case .number(let value): try container.encode(value)
        case .bool(let value): try container.encode(value)
        case .object(let value): try container.encode(value)
        case .array(let value): try container.encode(value)
        case .null: try container.encodeNil()
        }
    }

    var object: [String: JSONValue]? { if case .object(let value) = self { value } else { nil } }
    var array: [JSONValue]? { if case .array(let value) = self { value } else { nil } }
    var string: String? {
        switch self { case .string(let value): return value; case .number(let value): return String(format: "%g", value); case .bool(let value): return String(value); default: return nil }
    }
    var int: Int? { if case .number(let value) = self { Int(value) } else { Int(string ?? "") } }
    var bool: Bool? { if case .bool(let value) = self { value } else { nil } }

    static func from(_ value: Any) -> JSONValue {
        switch value {
        case let value as String: return .string(value)
        case let value as Int: return .number(Double(value))
        case let value as Int64: return .number(Double(value))
        case let value as Double: return .number(value)
        case let value as Bool: return .bool(value)
        case let value as [String: JSONValue]: return .object(value)
        case let value as [JSONValue]: return .array(value)
        default: return .null
        }
    }
}

extension Dictionary where Key == String, Value == JSONValue {
    subscript(string key: String) -> String { self[key]?.string ?? "" }
    subscript(int key: String) -> Int? { self[key]?.int }
    subscript(bool key: String) -> Bool { self[key]?.bool ?? false }
}
