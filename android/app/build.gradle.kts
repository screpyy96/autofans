import java.util.Properties

plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.kotlin.compose)
    alias(libs.plugins.kotlin.serialization)
}

val localProperties = Properties().apply {
    val localFile = rootProject.file("local.properties")
    if (localFile.exists()) localFile.inputStream().use(::load)
}

// Reuse the web application's local Supabase configuration when present. The
// file is ignored by Git, so credentials still never enter the Android tree.
val rootEnvProperties = Properties().apply {
    val rootEnvFile = rootProject.file("../.env.local")
    if (rootEnvFile.exists()) rootEnvFile.inputStream().use(::load)
}

fun configValue(name: String, vararg aliases: String): String =
    (listOf(name) + aliases).firstNotNullOfOrNull { key ->
        providers.gradleProperty(key).orNull
            ?: localProperties.getProperty(key)
            ?: rootEnvProperties.getProperty(key)
            ?: System.getenv(key)
    } ?: ""

fun String.forBuildConfig(): String = replace("\\", "\\\\").replace("\"", "\\\"")

val releaseStoreFile = configValue("RELEASE_STORE_FILE")
val releaseStorePassword = configValue("RELEASE_STORE_PASSWORD")
val releaseKeyAlias = configValue("RELEASE_KEY_ALIAS")
val releaseKeyPassword = configValue("RELEASE_KEY_PASSWORD")
// OAuth client IDs are public identifiers. This fallback is the Web client
// configured for the existing AutoFans Google provider in Supabase. Teams can
// override it through local.properties or .env.local without changing code.
val googleWebClientId = configValue("GOOGLE_WEB_CLIENT_ID", "VITE_GOOGLE_WEB_CLIENT_ID")
    .ifBlank { "839811357724-s3fujn7btag6rbvtf9td3s5ars9c7qta.apps.googleusercontent.com" }
val hasReleaseSigning = listOf(releaseStoreFile, releaseStorePassword, releaseKeyAlias, releaseKeyPassword).all(String::isNotBlank)

android {
    namespace = "ro.autofans.app"
    compileSdk = 35

    defaultConfig {
        applicationId = "ro.autofans.app"
        minSdk = 26
        targetSdk = 35
        versionCode = 1
        versionName = "1.0.0"
        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
        buildConfigField("String", "SUPABASE_URL", "\"${configValue("SUPABASE_URL", "VITE_SUPABASE_URL", "REMIX_PUBLIC_SUPABASE_URL").forBuildConfig()}\"")
        buildConfigField("String", "SUPABASE_ANON_KEY", "\"${configValue("SUPABASE_ANON_KEY", "VITE_SUPABASE_ANON_KEY", "REMIX_PUBLIC_SUPABASE_ANON_KEY").forBuildConfig()}\"")
        buildConfigField("String", "GOOGLE_WEB_CLIENT_ID", "\"${googleWebClientId.forBuildConfig()}\"")
    }

    buildTypes {
        debug {
            applicationIdSuffix = ".debug"
            versionNameSuffix = "-debug"
        }
        release {
            isMinifyEnabled = true
            isShrinkResources = true
            if (hasReleaseSigning) signingConfig = signingConfigs.getByName("release")
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
        }
    }

    signingConfigs {
        create("release") {
            if (hasReleaseSigning) {
                storeFile = rootProject.file(releaseStoreFile)
                storePassword = releaseStorePassword
                keyAlias = releaseKeyAlias
                keyPassword = releaseKeyPassword
            }
        }
    }

    buildFeatures {
        buildConfig = true
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
}

kotlin {
    jvmToolchain(17)
}

dependencies {
    implementation(libs.androidx.core.ktx)
    implementation(libs.androidx.lifecycle.runtime.ktx)
    implementation(libs.androidx.lifecycle.runtime.compose)
    implementation(libs.androidx.lifecycle.viewmodel.compose)
    implementation(libs.androidx.activity.compose)
    implementation(libs.androidx.navigation.compose)
    implementation(platform(libs.androidx.compose.bom))
    implementation(libs.androidx.compose.ui)
    implementation(libs.androidx.compose.ui.graphics)
    implementation(libs.androidx.compose.ui.tooling.preview)
    implementation(libs.androidx.compose.material3)
    implementation(libs.androidx.compose.material.icons)
    implementation(libs.coil.compose)
    implementation(libs.okhttp)
    implementation(libs.kotlinx.serialization.json)
    implementation(libs.kotlinx.coroutines.android)
    implementation(libs.androidx.credentials)
    implementation(libs.androidx.credentials.play.services.auth)
    implementation(libs.googleid)

    testImplementation(libs.junit)
    androidTestImplementation(libs.androidx.junit)
    androidTestImplementation(libs.androidx.espresso.core)
    androidTestImplementation(platform(libs.androidx.compose.bom))
    androidTestImplementation(libs.androidx.compose.ui.test.junit4)
    debugImplementation(libs.androidx.compose.ui.tooling)
    debugImplementation(libs.androidx.compose.ui.test.manifest)
}
