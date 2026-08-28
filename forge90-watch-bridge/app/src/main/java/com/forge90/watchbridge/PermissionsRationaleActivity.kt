package com.forge90.watchbridge

import android.os.Bundle
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity

class PermissionsRationaleActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val text = TextView(this).apply {
            setPadding(48, 64, 48, 64)
            textSize = 17f
            setTextColor(0xFFF4FFF9.toInt())
            setBackgroundColor(0xFF03110F.toInt())
            this.text = "Forge 90 Watch Bridge reads only the Health Connect data you approve: steps, active calories, distance and exercise sessions. Heart rate and sleep are not requested. Data is used to create a one-time summary that opens in your Forge 90 dashboard."
        }
        setContentView(text)
    }
}
