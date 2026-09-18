# ─────────────────────────────────────────────────────────────────
#  Obhyash — ProGuard / R8 rules
#  Flutter release builds use R8 (not classic ProGuard).
#  These rules prevent R8 from stripping classes that are accessed
#  via reflection or JNI, which would cause runtime crashes.
# ─────────────────────────────────────────────────────────────────

# ── Flutter engine ───────────────────────────────────────────────
-keep class io.flutter.** { *; }
-keep class io.flutter.embedding.** { *; }
-dontwarn io.flutter.**

# ── Supabase / Postgrest / Realtime (uses Gson reflection) ───────
-keep class io.supabase.** { *; }
-keep class io.github.jan.supabase.** { *; }
-keepattributes Signature
-keepattributes *Annotation*
-keepattributes EnclosingMethod
-keepattributes InnerClasses

# ── OkHttp (used internally by Supabase/http) ────────────────────
-dontwarn okhttp3.**
-dontwarn okio.**
-keep class okhttp3.** { *; }
-keep class okio.** { *; }

# ── Firebase / FCM ───────────────────────────────────────────────
-keep class com.google.firebase.** { *; }
-keep class com.google.android.gms.** { *; }
-dontwarn com.google.firebase.**
-dontwarn com.google.android.gms.**

# ── Google Play Billing (in_app_purchase) ────────────────────────
-keep class com.android.billingclient.** { *; }
-dontwarn com.android.billingclient.**

# ── Kotlin coroutines ────────────────────────────────────────────
-keepnames class kotlinx.coroutines.internal.MainDispatcherFactory {}
-keepnames class kotlinx.coroutines.CoroutineExceptionHandler {}
-keepclassmembers class kotlinx.coroutines.** { volatile <fields>; }

# ── url_launcher ─────────────────────────────────────────────────
-keep class io.flutter.plugins.urllauncher.** { *; }

# ── image_picker ─────────────────────────────────────────────────
-keep class io.flutter.plugins.imagepicker.** { *; }

# ── permission_handler ───────────────────────────────────────────
-keep class com.baseflow.permissionhandler.** { *; }

# ── share_plus ───────────────────────────────────────────────────
-keep class dev.fluttercommunity.plus.share.** { *; }

# ── connectivity_plus ────────────────────────────────────────────
-keep class dev.fluttercommunity.plus.connectivity.** { *; }

# ── path_provider ────────────────────────────────────────────────
-keep class io.flutter.plugins.pathprovider.** { *; }

# ── audioplayers ─────────────────────────────────────────────────
-keep class xyz.luan.audioplayers.** { *; }

# ── open_filex ───────────────────────────────────────────────────
-keep class com.crazecoder.openfile.** { *; }

# ── app_links ────────────────────────────────────────────────────
-keep class com.llfbandit.app_links.** { *; }

# ── cached_network_image / Glide ─────────────────────────────────
-keep public class * implements com.bumptech.glide.module.GlideModule
-keep class * extends com.bumptech.glide.module.AppGlideModule { <init>(...); }
-keep public enum com.bumptech.glide.load.ImageHeaderParser$** {
    **[] $VALUES;
    public *;
}
-dontwarn com.bumptech.glide.**

# ── Gson (used by some plugins for JSON serialization) ───────────
-keepattributes Signature
-keep class sun.misc.Unsafe { *; }
-keep class com.google.gson.** { *; }

# ── General Android / Java ───────────────────────────────────────
-keepattributes SourceFile,LineNumberTable
-keep public class * extends java.lang.Exception
-dontwarn java.lang.invoke.**
-dontwarn **$$Lambda$*
