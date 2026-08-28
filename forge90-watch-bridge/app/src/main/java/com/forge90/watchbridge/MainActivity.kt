package com.forge90.watchbridge

import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.provider.Settings
import android.util.Base64
import android.widget.Button
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import androidx.health.connect.client.HealthConnectClient
import androidx.health.connect.client.PermissionController
import androidx.health.connect.client.permission.HealthPermission
import androidx.health.connect.client.records.ActiveCaloriesBurnedRecord
import androidx.health.connect.client.records.DistanceRecord
import androidx.health.connect.client.records.ExerciseSessionRecord
import androidx.health.connect.client.records.StepsRecord
import androidx.health.connect.client.request.AggregateRequest
import androidx.health.connect.client.request.ReadRecordsRequest
import androidx.health.connect.client.time.TimeRangeFilter
import androidx.lifecycle.lifecycleScope
import kotlinx.coroutines.launch
import org.json.JSONObject
import java.time.Duration
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneId
import java.util.Locale

class MainActivity : AppCompatActivity() {
    private lateinit var status: TextView
    private lateinit var stepsView: TextView
    private lateinit var caloriesView: TextView
    private lateinit var minutesView: TextView
    private lateinit var distanceView: TextView
    private lateinit var workoutsView: TextView
    private var client: HealthConnectClient? = null
    private var lastSummary: WatchSummary? = null

    private val permissions = setOf(
        HealthPermission.getReadPermission(StepsRecord::class),
        HealthPermission.getReadPermission(ActiveCaloriesBurnedRecord::class),
        HealthPermission.getReadPermission(DistanceRecord::class),
        HealthPermission.getReadPermission(ExerciseSessionRecord::class)
    )

    private val requestPermissions = registerForActivityResult(
        PermissionController.createRequestPermissionResultContract()
    ) { granted ->
        if (granted.containsAll(permissions)) {
            status.text = "Health Connect access granted. Reading today’s watch data…"
            readToday()
        } else {
            status.text = "Some permissions were not granted. Forge 90 will only read what you allow."
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)
        status = findViewById(R.id.statusText)
        stepsView = findViewById(R.id.stepsText)
        caloriesView = findViewById(R.id.caloriesText)
        minutesView = findViewById(R.id.minutesText)
        distanceView = findViewById(R.id.distanceText)
        workoutsView = findViewById(R.id.workoutsText)

        findViewById<Button>(R.id.grantButton).setOnClickListener { requestAccess() }
        findViewById<Button>(R.id.readButton).setOnClickListener { readToday() }
        findViewById<Button>(R.id.syncButton).setOnClickListener { syncToForge() }
        findViewById<Button>(R.id.healthButton).setOnClickListener { openHealthConnect() }
        setupHealthConnect()
    }

    private fun setupHealthConnect() {
        when (HealthConnectClient.getSdkStatus(this)) {
            HealthConnectClient.SDK_AVAILABLE -> {
                client = HealthConnectClient.getOrCreate(this)
                status.text = "Health Connect is available. Grant access, then read today’s data."
                lifecycleScope.launch {
                    val granted = client?.permissionController?.getGrantedPermissions().orEmpty()
                    if (granted.containsAll(permissions)) readToday()
                }
            }
            HealthConnectClient.SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED -> {
                status.text = "Health Connect needs to be installed or updated on this phone."
            }
            else -> status.text = "Health Connect is not available on this Android device."
        }
    }

    private fun requestAccess() {
        if (client == null) setupHealthConnect()
        if (client != null) requestPermissions.launch(permissions)
    }

    private fun readToday() {
        val hc = client ?: return run { status.text = "Health Connect is not ready." }
        lifecycleScope.launch {
            try {
                val granted = hc.permissionController.getGrantedPermissions()
                if (!granted.containsAll(permissions)) {
                    status.text = "Grant Health Connect access first."
                    return@launch
                }
                status.text = "Reading today’s Health Connect data…"
                val zone = ZoneId.systemDefault()
                val start = LocalDate.now(zone).atStartOfDay(zone).toInstant()
                val end = Instant.now()
                val aggregate = hc.aggregate(
                    AggregateRequest(
                        metrics = setOf(
                            StepsRecord.COUNT_TOTAL,
                            ActiveCaloriesBurnedRecord.ACTIVE_CALORIES_TOTAL,
                            DistanceRecord.DISTANCE_TOTAL
                        ),
                        timeRangeFilter = TimeRangeFilter.between(start, end)
                    )
                )
                val sessions = hc.readRecords(
                    ReadRecordsRequest(
                        recordType = ExerciseSessionRecord::class,
                        timeRangeFilter = TimeRangeFilter.between(start, end),
                        ascendingOrder = true
                    )
                ).records
                val steps = aggregate[StepsRecord.COUNT_TOTAL] ?: 0L
                val activeCalories = aggregate[ActiveCaloriesBurnedRecord.ACTIVE_CALORIES_TOTAL]?.inKilocalories ?: 0.0
                val miles = (aggregate[DistanceRecord.DISTANCE_TOTAL]?.inMeters ?: 0.0) / 1609.344
                val minutes = sessions.sumOf { Duration.between(it.startTime, it.endTime).toMinutes() }
                val latest = sessions.maxByOrNull { it.endTime }
                val summary = WatchSummary(
                    steps = steps,
                    activeCalories = activeCalories,
                    distanceMiles = miles,
                    exerciseMinutes = minutes,
                    workoutCount = sessions.size,
                    latestWorkoutType = latest?.exerciseType,
                    lastSync = Instant.now().toString()
                )
                lastSummary = summary
                render(summary)
                status.text = "Ready to sync to Forge 90."
            } catch (e: Exception) {
                status.text = "Could not read Health Connect: ${e.message ?: "unknown error"}"
            }
        }
    }

    private fun render(s: WatchSummary) {
        stepsView.text = "Steps  ${String.format(Locale.US, "%,d", s.steps)}"
        caloriesView.text = "Active calories  ${s.activeCalories.toInt()} kcal"
        minutesView.text = "Exercise  ${s.exerciseMinutes} min"
        distanceView.text = "Distance  ${String.format(Locale.US, "%.1f", s.distanceMiles)} mi"
        workoutsView.text = "Watch workouts  ${s.workoutCount} today"
    }

    private fun syncToForge() {
        val s = lastSummary ?: return run { status.text = "Read today’s watch data first." }
        val json = JSONObject().apply {
            put("steps", s.steps)
            put("activeCalories", s.activeCalories)
            put("distanceMiles", s.distanceMiles)
            put("exerciseMinutes", s.exerciseMinutes)
            put("workoutCount", s.workoutCount)
            put("latestWorkoutType", s.latestWorkoutType ?: JSONObject.NULL)
            put("lastSync", s.lastSync)
            put("source", "Health Connect")
        }.toString()
        val token = Base64.encodeToString(
            json.toByteArray(Charsets.UTF_8),
            Base64.URL_SAFE or Base64.NO_WRAP or Base64.NO_PADDING
        )
        val uri = Uri.parse("https://forge-90-fit.vercel.app/?hc=${Uri.encode(token)}")
        startActivity(Intent(Intent.ACTION_VIEW, uri))
    }

    private fun openHealthConnect() {
        val intent = Intent("android.health.connect.action.HEALTH_HOME_SETTINGS")
        try {
            startActivity(intent)
        } catch (_: Exception) {
            startActivity(Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.parse("package:$packageName")))
        }
    }
}

data class WatchSummary(
    val steps: Long,
    val activeCalories: Double,
    val distanceMiles: Double,
    val exerciseMinutes: Long,
    val workoutCount: Int,
    val latestWorkoutType: Int?,
    val lastSync: String
)
