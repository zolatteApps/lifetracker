package com.lifesync.mobile

import android.Manifest
import android.content.IntentFilter
import android.content.pm.PackageManager
import android.os.Build
import androidx.core.content.ContextCompat
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.PermissionAwareActivity
import com.facebook.react.modules.core.PermissionListener

class SMSOTPModule(private val reactContext: ReactApplicationContext) : 
    ReactContextBaseJavaModule(reactContext), PermissionListener {

    private var smsReceiver: SMSBroadcastReceiver? = null
    private var permissionPromise: Promise? = null

    companion object {
        const val NAME = "SMSOTPModule"
        private const val REQUEST_SMS_PERMISSION = 1
    }

    override fun getName(): String = NAME

    @ReactMethod
    fun startListeningForOTP(promise: Promise) {
        // Check if SMS permission is granted
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            if (ContextCompat.checkSelfPermission(reactContext, Manifest.permission.RECEIVE_SMS) 
                != PackageManager.PERMISSION_GRANTED ||
                ContextCompat.checkSelfPermission(reactContext, Manifest.permission.READ_SMS) 
                != PackageManager.PERMISSION_GRANTED) {
                
                // Request permission
                requestSMSPermission(promise)
                return
            }
        }

        // Permission already granted, start listening
        registerSMSReceiver()
        promise.resolve(true)
    }

    @ReactMethod
    fun stopListeningForOTP() {
        unregisterSMSReceiver()
    }

    private fun requestSMSPermission(promise: Promise) {
        val activity = currentActivity as? PermissionAwareActivity
        if (activity != null) {
            permissionPromise = promise
            activity.requestPermissions(
                arrayOf(Manifest.permission.RECEIVE_SMS, Manifest.permission.READ_SMS),
                REQUEST_SMS_PERMISSION,
                this
            )
        } else {
            promise.reject("NO_ACTIVITY", "No activity available to request permissions")
        }
    }

    private fun registerSMSReceiver() {
        if (smsReceiver == null) {
            smsReceiver = SMSBroadcastReceiver()
            SMSBroadcastReceiver.reactContext = reactContext
            
            val intentFilter = IntentFilter("android.provider.Telephony.SMS_RECEIVED")
            intentFilter.priority = IntentFilter.SYSTEM_HIGH_PRIORITY
            
            try {
                reactContext.registerReceiver(smsReceiver, intentFilter)
                android.util.Log.d(NAME, "SMS Receiver registered successfully")
            } catch (e: Exception) {
                android.util.Log.e(NAME, "Failed to register SMS receiver: ${e.message}", e)
            }
        } else {
            android.util.Log.d(NAME, "SMS Receiver already registered")
        }
    }

    private fun unregisterSMSReceiver() {
        smsReceiver?.let {
            try {
                reactContext.unregisterReceiver(it)
            } catch (e: IllegalArgumentException) {
                // Receiver was not registered
            }
            smsReceiver = null
            SMSBroadcastReceiver.reactContext = null
        }
    }

    // PermissionListener implementation
    override fun onRequestPermissionsResult(
        requestCode: Int,
        permissions: Array<String>,
        grantResults: IntArray
    ): Boolean {
        if (requestCode == REQUEST_SMS_PERMISSION) {
            val allGranted = grantResults.all { it == PackageManager.PERMISSION_GRANTED }
            
            if (allGranted) {
                registerSMSReceiver()
                permissionPromise?.resolve(true)
            } else {
                permissionPromise?.reject("PERMISSION_DENIED", "SMS permission denied")
            }
            
            permissionPromise = null
            return true
        }
        return false
    }

    @ReactMethod
    fun addListener(eventName: String) {
        // Required for RN built-in Event Emitter support
    }

    @ReactMethod
    fun removeListeners(count: Int) {
        // Required for RN built-in Event Emitter support
    }
}