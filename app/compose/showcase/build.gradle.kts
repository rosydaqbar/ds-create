// The showcase app: the system's documentation on a phone (APP.md §7).
plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.kotlin.compose)
}

fun prop(name: String) = providers.gradleProperty(name).get()
fun quoted(value: String) = "\"" + value.replace("\"", "\\\"") + "\""

android {
    namespace = "design.system.showcase"
    compileSdk = 35

    defaultConfig {
        // A3: the team's own application id.
        applicationId = "your.org.designsystem.showcase"
        minSdk = 26
        targetSdk = 35
        versionCode = 1
        versionName = prop("DS_VERSION")

        buildConfigField("String", "DS_NAME", quoted(prop("DS_NAME")))
        buildConfigField("String", "DS_VERSION", quoted(prop("DS_VERSION")))
        buildConfigField("String", "DS_COORDINATES", quoted("${prop("DS_GROUP")}:${prop("DS_ARTIFACT")}:${prop("DS_VERSION")}"))
        buildConfigField("String", "DS_DOCS_URL", quoted(prop("DS_DOCS_URL")))
        resValue("string", "app_name", prop("DS_NAME"))
    }

    buildFeatures {
        compose = true
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
    implementation(project(":designsystem"))
    implementation(platform(libs.androidx.compose.bom))
    implementation(libs.androidx.compose.foundation)
    implementation(libs.androidx.activity.compose)
    implementation(libs.androidx.compose.ui.tooling.preview)
    debugImplementation(libs.androidx.compose.ui.tooling)
}
