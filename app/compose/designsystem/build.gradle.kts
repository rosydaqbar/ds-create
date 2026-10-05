// The design system library (AAR), published as DS_GROUP:DS_ARTIFACT (default your.org:design-system).
plugins {
    alias(libs.plugins.android.library)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.kotlin.compose)
    alias(libs.plugins.roborazzi)
    `maven-publish`
}

val dsGroup = providers.gradleProperty("DS_GROUP").get()
val dsArtifact = providers.gradleProperty("DS_ARTIFACT").get()
val dsVersion = providers.gradleProperty("DS_VERSION").get()

group = dsGroup
version = dsVersion

android {
    namespace = "design.system"
    compileSdk = 35

    defaultConfig {
        minSdk = 26
    }

    buildFeatures {
        compose = true
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    testOptions {
        // Robolectric runs the Compose UI and screenshot tests on the JVM.
        unitTests.isIncludeAndroidResources = true
    }

    publishing {
        singleVariant("release") {
            withSourcesJar()
        }
    }
}

kotlin {
    jvmToolchain(17)
}

dependencies {
    // Foundation only: the look comes from the system tokens, never from Material (APP.md §3).
    api(platform(libs.androidx.compose.bom))
    api(libs.androidx.compose.runtime)
    api(libs.androidx.compose.foundation)
    api(libs.androidx.compose.animation)
    api(libs.androidx.compose.ui)
    implementation(libs.androidx.compose.ui.tooling.preview)
    debugImplementation(libs.androidx.compose.ui.tooling)

    testImplementation(platform(libs.androidx.compose.bom))
    testImplementation(libs.junit)
    testImplementation(libs.androidx.test.ext.junit)
    testImplementation(libs.robolectric)
    testImplementation(libs.androidx.compose.ui.test.junit4)
    testImplementation(libs.roborazzi)
    testImplementation(libs.roborazzi.compose)
    debugImplementation(libs.androidx.compose.ui.test.manifest)
}

publishing {
    publications {
        register<MavenPublication>("release") {
            groupId = dsGroup
            artifactId = dsArtifact
            version = dsVersion
            afterEvaluate { from(components["release"]) }
        }
    }
    repositories {
        // A8: replace with the team's Maven repository (GitHub Packages, Artifactory, …).
        maven {
            name = "local"
            url = uri(layout.buildDirectory.dir("repo"))
        }
    }
}
