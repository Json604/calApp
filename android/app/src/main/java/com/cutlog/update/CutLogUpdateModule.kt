package com.cutlog.update

import android.content.Intent
import android.os.Build
import androidx.core.content.FileProvider
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.WritableNativeMap
import java.io.File
import java.net.HttpURLConnection
import java.net.URL
import java.security.MessageDigest
import java.util.concurrent.Executors

/**
 * Self-hosted updates. The APK is verified against the SHA-256 in latest.json
 * before the package installer is opened.
 */
class CutLogUpdateModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

  private val worker = Executors.newSingleThreadExecutor()

  override fun getName(): String = "CutLogUpdate"

  @ReactMethod
  fun getVersion(promise: Promise) {
    try {
      val info = reactContext.packageManager.getPackageInfo(reactContext.packageName, 0)
      val code =
          if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            info.longVersionCode
          } else {
            @Suppress("DEPRECATION")
            info.versionCode.toLong()
          }
      val map = WritableNativeMap()
      map.putDouble("versionCode", code.toDouble())
      map.putString("versionName", info.versionName ?: "")
      promise.resolve(map)
    } catch (error: Throwable) {
      promise.reject("version_unavailable", error.message, error)
    }
  }

  @ReactMethod
  fun downloadAndInstall(url: String, expectedSha256: String, promise: Promise) {
    worker.execute {
      var target: File? = null
      try {
        val cacheDir = File(reactContext.cacheDir, "updates").apply { mkdirs() }
        val file = File(cacheDir, "cutlog-update-${System.currentTimeMillis()}.apk")
        target = file

        val connection = (URL(url).openConnection() as HttpURLConnection).apply {
          connectTimeout = 20_000
          readTimeout = 60_000
          instanceFollowRedirects = true
        }
        connection.inputStream.use { input ->
          file.outputStream().use { output -> input.copyTo(output, 64 * 1024) }
        }
        connection.disconnect()

        val actual = sha256(file)
        if (!actual.equals(expectedSha256, ignoreCase = true)) {
          file.delete()
          promise.reject(
              "checksum_mismatch",
              "Downloaded update did not match the published checksum, so it was discarded.",
          )
          return@execute
        }

        val uri =
            FileProvider.getUriForFile(reactContext, "${reactContext.packageName}.updates", file)
        val intent =
            Intent(Intent.ACTION_VIEW).apply {
              setDataAndType(uri, "application/vnd.android.package-archive")
              addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
              addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
        reactContext.startActivity(intent)
        promise.resolve(true)
      } catch (error: Throwable) {
        target?.delete()
        promise.reject("update_failed", error.message, error)
      }
    }
  }

  private fun sha256(file: File): String {
    val digest = MessageDigest.getInstance("SHA-256")
    file.inputStream().use { stream ->
      val buffer = ByteArray(64 * 1024)
      while (true) {
        val read = stream.read(buffer)
        if (read <= 0) break
        digest.update(buffer, 0, read)
      }
    }
    return digest.digest().joinToString("") { "%02x".format(it) }
  }
}
