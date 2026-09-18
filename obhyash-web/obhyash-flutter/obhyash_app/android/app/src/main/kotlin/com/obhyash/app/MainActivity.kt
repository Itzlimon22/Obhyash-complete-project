package com.obhyash.app

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.ContentValues
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.Environment
import android.provider.MediaStore
import android.view.WindowManager
import android.graphics.BitmapFactory
import androidx.core.app.NotificationCompat
import androidx.core.content.FileProvider
import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.MethodChannel
import java.io.File
import java.io.FileOutputStream

class MainActivity : FlutterActivity() {
    private val SECURE_CHANNEL = "com.obhyash.app/secure_window"
    private val DOWNLOAD_CHANNEL = "com.obhyash.app/download"
    private val NOTIFICATION_CHANNEL_ID = "obhyash_downloads"

    override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)

        MethodChannel(flutterEngine.dartExecutor.binaryMessenger, SECURE_CHANNEL).setMethodCallHandler { call, result ->
            when (call.method) {
                "enableSecure" -> {
                    window.addFlags(WindowManager.LayoutParams.FLAG_SECURE)
                    result.success(true)
                }
                "disableSecure" -> {
                    window.clearFlags(WindowManager.LayoutParams.FLAG_SECURE)
                    result.success(true)
                }
                "isSecure" -> {
                    val flags = window.attributes.flags
                    val isSecure = (flags and WindowManager.LayoutParams.FLAG_SECURE) != 0
                    result.success(isSecure)
                }
                else -> {
                    result.notImplemented()
                }
            }
        }

        MethodChannel(flutterEngine.dartExecutor.binaryMessenger, DOWNLOAD_CHANNEL).setMethodCallHandler { call, result ->
            when (call.method) {
                "saveToDownloads" -> {
                    val bytes = call.argument<ByteArray>("bytes")
                    val fileName = call.argument<String>("fileName") ?: "document.pdf"
                    val title = call.argument<String>("title") ?: "Download Complete"

                    if (bytes == null) {
                        result.error("INVALID_ARGS", "Bytes cannot be null", null)
                        return@setMethodCallHandler
                    }

                    try {
                        val fileUri = saveFileToPublicDownloads(bytes, fileName)
                        if (fileUri != null) {
                            showDownloadNotification(fileName, title, fileUri)
                            result.success(fileUri.toString())
                        } else {
                            result.error("SAVE_FAILED", "Failed to save file to downloads", null)
                        }
                    } catch (e: Exception) {
                        result.error("ERROR", e.message, null)
                    }
                }
                else -> {
                    result.notImplemented()
                }
            }
        }
    }

    private fun saveFileToPublicDownloads(bytes: ByteArray, fileName: String): Uri? {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            val contentValues = ContentValues().apply {
                put(MediaStore.MediaColumns.DISPLAY_NAME, fileName)
                put(MediaStore.MediaColumns.MIME_TYPE, "application/pdf")
                put(MediaStore.MediaColumns.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS)
            }
            val resolver = applicationContext.contentResolver
            val uri = resolver.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, contentValues)
            if (uri != null) {
                resolver.openOutputStream(uri)?.use { outputStream ->
                    outputStream.write(bytes)
                    outputStream.flush()
                }
            }
            uri
        } else {
            val downloadsDir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS)
            if (!downloadsDir.exists()) {
                downloadsDir.mkdirs()
            }
            val file = File(downloadsDir, fileName)
            FileOutputStream(file).use { outputStream ->
                outputStream.write(bytes)
                outputStream.flush()
            }
            FileProvider.getUriForFile(applicationContext, "${applicationContext.packageName}.fileprovider", file)
        }
    }

    private fun showDownloadNotification(fileName: String, title: String, uri: Uri) {
        val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                NOTIFICATION_CHANNEL_ID,
                "Downloads & Reports",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Download completed notifications"
                enableVibration(true)
            }
            notificationManager.createNotificationChannel(channel)
        }

        val openIntent = Intent(Intent.ACTION_VIEW).apply {
            setDataAndType(uri, "application/pdf")
            addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }

        val pendingIntent = PendingIntent.getActivity(
            this,
            System.currentTimeMillis().toInt(),
            openIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val largeIcon = try {
            BitmapFactory.decodeResource(resources, R.mipmap.ic_launcher)
        } catch (e: Exception) {
            null
        }

        val builder = NotificationCompat.Builder(this, NOTIFICATION_CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_launcher_foreground)
            .setColor(0xFF059669.toInt())
            .setContentTitle(title)
            .setContentText("$fileName ডাউনলোড সম্পন্ন হয়েছে। দেখতে ট্যাপ করুন।")
            .setAutoCancel(true)
            .setContentIntent(pendingIntent)
            .setPriority(NotificationCompat.PRIORITY_HIGH)

        if (largeIcon != null) {
            builder.setLargeIcon(largeIcon)
        }

        val notification = builder.build()

        notificationManager.notify(System.currentTimeMillis().toInt(), notification)
    }
}
