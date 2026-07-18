# Keep Kotlin serialization metadata used by the Supabase REST DTOs.
-keepattributes *Annotation*, Signature
-keepclassmembers class **$$serializer { <fields>; }
-keepclasseswithmembers class ** { kotlinx.serialization.KSerializer serializer(...); }
