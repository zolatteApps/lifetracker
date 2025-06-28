package com.lifesync.mobile

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.telephony.SmsMessage
import android.util.Log
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.WritableMap
import com.facebook.react.bridge.Arguments
import com.facebook.react.modules.core.DeviceEventManagerModule

class SMSBroadcastReceiver : BroadcastReceiver() {
    companion object {
        var reactContext: ReactApplicationContext? = null
        private const val TAG = "SMSBroadcastReceiver"
        private val OTP_PATTERNS = listOf(
            Regex("\\b\\d{6}\\b"),                    // 6 digits
            Regex("\\b\\d{4,6}\\b"),                  // 4-6 digits
            Regex("(?:otp|OTP|code|CODE)\\s*:?\\s*(\\d{4,6})"),  // OTP: 123456
            Regex("(\\d{6})\\s*(?:is|as)"),          // 123456 is your OTP
            Regex("verification\\s*code\\s*:?\\s*(\\d{4,6})", RegexOption.IGNORE_CASE)
        )
    }

    override fun onReceive(context: Context?, intent: Intent?) {
        Log.d(TAG, "onReceive called with action: ${intent?.action}")
        
        if (intent?.action == "android.provider.Telephony.SMS_RECEIVED") {
            Log.d(TAG, "SMS_RECEIVED action detected")
            
            val bundle = intent.extras
            if (bundle != null) {
                try {
                    val pdus = bundle.get("pdus") as? Array<*>
                    val format = bundle.getString("format")
                    
                    Log.d(TAG, "PDUs count: ${pdus?.size ?: 0}")
                    
                    pdus?.forEach { pdu ->
                        val message = if (android.os.Build.VERSION.SDK_INT >= 23 && format != null) {
                            SmsMessage.createFromPdu(pdu as ByteArray, format)
                        } else {
                            @Suppress("DEPRECATION")
                            SmsMessage.createFromPdu(pdu as ByteArray)
                        }
                        
                        val messageBody = message.messageBody
                        val sender = message.originatingAddress

                        Log.d(TAG, "SMS received from: $sender")
                        Log.d(TAG, "SMS body: $messageBody")
                        
                        // Try multiple patterns to extract OTP
                        var otpFound: String? = null
                        for (pattern in OTP_PATTERNS) {
                            val match = pattern.find(messageBody)
                            if (match != null) {
                                otpFound = if (match.groups.size > 1 && match.groups[1] != null) {
                                    match.groups[1]!!.value
                                } else {
                                    match.value
                                }
                                Log.d(TAG, "OTP detected using pattern: $pattern, OTP: $otpFound")
                                break
                            }
                        }
                        
                        if (otpFound != null && otpFound.length >= 4) {
                            Log.d(TAG, "Sending OTP to React Native: $otpFound")
                            sendOTPToReactNative(otpFound, sender ?: "", messageBody)
                        } else {
                            Log.d(TAG, "No OTP found in message")
                        }
                    }
                } catch (e: Exception) {
                    Log.e(TAG, "Error processing SMS: ${e.message}", e)
                }
            } else {
                Log.d(TAG, "Bundle is null")
            }
        } else {
            Log.d(TAG, "Not SMS_RECEIVED action: ${intent?.action}")
        }
    }

    private fun sendOTPToReactNative(otp: String, sender: String, fullMessage: String) {
        Log.d(TAG, "sendOTPToReactNative called - OTP: $otp")
        
        if (reactContext == null) {
            Log.e(TAG, "ReactContext is null! Cannot send OTP event")
            return
        }
        
        reactContext?.let { context ->
            try {
                val params: WritableMap = Arguments.createMap()
                params.putString("otp", otp)
                params.putString("sender", sender)
                params.putString("message", fullMessage)
                
                Log.d(TAG, "Emitting onOTPReceived event with OTP: $otp")
                
                context
                    .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                    .emit("onOTPReceived", params)
                    
                Log.d(TAG, "Event emitted successfully")
            } catch (e: Exception) {
                Log.e(TAG, "Error sending OTP event to React Native: ${e.message}", e)
            }
        }
    }
}