import React, { useState, useRef } from 'react';
import { 
  Smartphone, 
  Code, 
  Copy, 
  Check, 
  Layers, 
  Settings2, 
  Terminal, 
  ArrowRight, 
  Sparkles, 
  Cpu, 
  FileCode, 
  ExternalLink,
  Minimize2,
  Search
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AndroidHubProps {
  snippets: Array<{
    id?: string;
    title: string;
    code: string;
    language?: string;
  }>;
}

export default function AndroidHub({ snippets }: AndroidHubProps) {
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'kotlin' | 'manifest' | 'capacitor'>('overview');
  const [copiedText, setCopiedText] = useState<string | null>(null);
  
  // Mobile simulator state
  const phoneRef = useRef<HTMLDivElement>(null);
  const [mobileBubbleExpanded, setMobileBubbleExpanded] = useState(false);
  const [copiedSnippetId, setCopiedSnippetId] = useState<string | null>(null);
  const [simulatedSearch, setSimulatedSearch] = useState('');

  const triggerCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(id);
    setTimeout(() => setCopiedText(null), 2500);
  };

  const copySimulatedSnippet = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedSnippetId(id);
    setTimeout(() => setCopiedSnippetId(null), 2000);
  };

  const filteredSimulatedSnippets = snippets.filter(s => 
    s.title.toLowerCase().includes(simulatedSearch.toLowerCase()) ||
    (s.language && s.language.toLowerCase().includes(simulatedSearch.toLowerCase()))
  ).slice(0, 4);

  const kotlinCode = `package com.snippetbubble.app

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.graphics.PixelFormat
import android.os.Build
import android.os.IBinder
import android.view.Gravity
import android.view.LayoutInflater
import android.view.MotionEvent
import android.view.View
import android.view.WindowManager
import androidx.core.app.NotificationCompat

class SnippetBubbleService : Service() {
    private lateinit var windowManager: WindowManager
    private lateinit var bubbleView: View
    private lateinit var params: WindowManager.LayoutParams

    override fun onCreate() {
        super.onCreate()
        windowManager = getSystemService(Context.WINDOW_SERVICE) as WindowManager
        
        // Inflate custom floating circular chat-head view
        bubbleView = LayoutInflater.from(this).inflate(R.layout.layout_floating_bubble, null)
        
        // Define high-priority overlay layout parameters (SYSTEM_ALERT_WINDOW API)
        val layoutFlag = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
        } else {
            @Suppress("DEPRECATION")
            WindowManager.LayoutParams.TYPE_PHONE
        }

        params = WindowManager.LayoutParams(
            WindowManager.LayoutParams.WRAP_CONTENT,
            WindowManager.LayoutParams.WRAP_CONTENT,
            layoutFlag,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN,
            PixelFormat.TRANSLUCENT
        )
        
        // Position on the middle-right side initially
        params.gravity = Gravity.TOP or Gravity.END
        params.x = 20
        params.y = 350

        // Dragging & Edge Snapping gesture tracking
        bubbleView.setOnTouchListener(object : View.OnTouchListener {
            private var initialX: Int = 0
            private var initialY: Int = 0
            private var initialTouchX: Float = 0f
            private var initialTouchY: Float = 0f
            private var isClick = false

            override fun onTouch(v: View, event: MotionEvent): Boolean {
                when (event.action) {
                    MotionEvent.ACTION_DOWN -> {
                        initialX = params.x
                        initialY = params.y
                        initialTouchX = event.rawX
                        initialTouchY = event.rawY
                        isClick = true
                        return true
                    }
                    MotionEvent.ACTION_MOVE -> {
                        val deltaX = (event.rawX - initialTouchX).toInt()
                        val deltaY = (event.rawY - initialTouchY).toInt()
                        
                        // If moved significantly, it is a drag, not a simple tap
                        if (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10) {
                            isClick = false
                        }
                        
                        // For gravity Gravity.END, horizontal coordinate delta scales oppositely
                        params.x = initialX - deltaX
                        params.y = initialY + deltaY
                        windowManager.updateViewLayout(bubbleView, params)
                        return true
                    }
                    MotionEvent.ACTION_UP -> {
                        if (isClick) {
                            // Tap triggered: Launch web-app drawer overlay
                            val launchIntent = Intent(this@SnippetBubbleService, MainActivity::class.java).apply {
                                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP)
                                putExtra("START_WIDGET_DRAWER", true)
                            }
                            startActivity(launchIntent)
                        } else {
                            // Release gesture: smooth animate drift back to nearest edge
                            animateToNearestEdge()
                        }
                        return true
                    }
                }
                return false
            }
        })

        // Mount bubble container securely inside Android window server
        windowManager.addView(bubbleView, params)
        startForeground(NOTIFICATION_ID, getStickyNotification())
    }

    private fun animateToNearestEdge() {
        val displayWidth = resources.displayMetrics.widthPixels
        val center = displayWidth / 2
        // Animate horizontal float alignment asynchronously 
        val targetX = if (params.x > center) displayWidth - bubbleView.width - 20 else 20
        
        // Simple interpolation handler
        val animator = android.animation.ValueAnimator.ofInt(params.x, targetX).apply {
            duration = 200
            addUpdateListener { animation ->
                params.x = animation.animatedValue as Int
                if (bubbleView.parent != null) {
                    windowManager.updateViewLayout(bubbleView, params)
                }
            }
        }
        animator.start()
    }

    private fun getStickyNotification() = NotificationCompat.Builder(this, CHANNEL_ID)
        .setContentTitle("Snippet Bubble is Active")
        .setContentText("Tap overlay trigger to access your cloud snippets anywhere.")
        .setSmallIcon(R.drawable.ic_bubble_launcher)
        .setPriority(NotificationCompat.PRIORITY_MIN)
        .setCategory(NotificationNotification.CATEGORY_SERVICE)
        .build()

    override fun onDestroy() {
        super.onDestroy()
        if (::bubbleView.isInitialized && bubbleView.parent != null) {
            windowManager.removeView(bubbleView)
        }
    }

    override fun onBind(intent: Intent?): IBinder? = null

    companion object {
        private const val NOTIFICATION_ID = 1001
        private const val CHANNEL_ID = "snippet_overlay_service"
    }
}`;

  const manifestXml = `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.snippetbubble.app">

    <!-- Crucial permission to paint circular bubble trigger on top of all other apps -->
    <uses-permission android:name="android.permission.SYSTEM_ALERT_WINDOW" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
    
    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:theme="@style/AppTheme">

        <!-- MainActivity configured with modular launcher intentions -->
        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:launchMode="singleTask"
            android:configChanges="orientation|keyboardHidden|keyboard|screenSize|locale">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>

        <!-- Multi-threaded background window overlay painter -->
        <service
            android:name=".services.SnippetBubbleService"
            android:enabled="true"
            android:exported="false"
            android:foregroundServiceType="specialUse" />

    </application>
</manifest>`;

  const capacitorCode = `import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.snippetbubble.app',
  appName: 'Snippet Bubble',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    // Custom native plugin configs can go here
  }
};

export default config;`;

  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 lg:p-8 space-y-8 text-zinc-100">
      {/* Intro info card */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-zinc-800">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-1 bg-brand/10 border border-brand/30 text-brand text-[11px] uppercase font-bold tracking-widest rounded-full">
              Mobile Roadmap & Build Guide
            </span>
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Android System Overlay Integration</h2>
          <p className="text-zinc-400 text-sm mt-1">
            Learn and preview how this React circular widget converts into a full-system Android Float Overlay (Chat Head).
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <a 
            href="https://capacitorjs.com/docs/getting-started" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-zinc-400 hover:text-brand bg-zinc-900 border border-zinc-800 hover:border-brand/40 px-3 py-2 rounded-xl transition-all font-mono"
          >
            Capacitor SDK Docs <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Row 1/Col 1: Mobile Simulator mockup */}
        <div className="lg:col-span-5 flex flex-col items-center space-y-4">
          <div className="text-center">
            <h3 className="font-bold text-sm text-zinc-400 uppercase tracking-wider mb-1">
              Interactive System Simulator
            </h3>
            <p className="text-xs text-zinc-500">
              Drag & release the bubble inside the phone. Tap to fly out snippets!
            </p>
          </div>

          {/* Android Device Mockup */}
          <div 
            ref={phoneRef}
            className="relative w-76 h-[480px] bg-zinc-950 border-[8px] border-zinc-800 rounded-[38px] overflow-hidden shadow-2xl flex flex-col justify-between selection:bg-none select-none"
            style={{ backgroundImage: 'radial-gradient(circle at 50% 120%, rgba(var(--brand-rgb, 12, 175, 160), 0.15) 0%, transparent 80%)' }}
          >
            {/* Camera speaker notch */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-20 h-4 bg-zinc-800 rounded-full z-30 flex items-center justify-center">
              <div className="w-2 h-2 bg-black rounded-full mr-2" />
              <div className="w-6 h-1 bg-zinc-900 rounded-full" />
            </div>

            {/* Android Status Bar */}
            <div className="flex justify-between items-center px-6 pt-6 pb-2 text-[10px] text-zinc-400 font-medium z-20 bg-zinc-950/70 backdrop-blur-sm">
              <span>15:45</span>
              <div className="flex items-center gap-1">
                <span>📶</span>
                <span>🛜</span>
                <span>🔋 100%</span>
              </div>
            </div>

            {/* Android Screen Body */}
            <div className="relative flex-1 w-full overflow-hidden flex flex-col justify-between px-3 pb-4">
              {/* Wallpaper simulated system visual content */}
              <div className="absolute inset-x-4 top-2 text-center text-zinc-600 font-mono text-[9px] pointer-events-none uppercase tracking-widest leading-3 mt-4">
                Android OS System Overlay Mode<br/>
                <span className="text-zinc-500 font-bold">SYSTEM_ALERT_WINDOW active</span>
              </div>

              {/* Fake wallpaper system icons represent background view */}
              <div className="grid grid-cols-4 gap-3 p-2 mt-12 z-0 opacity-45 pointer-events-none">
                {[
                  { label: 'Chrome', icon: '🌐' },
                  { label: 'Google Maps', icon: '🗺️' },
                  { label: 'Play Store', icon: '🛍️' },
                  { label: 'Drive', icon: '📁' },
                  { label: 'Gmail', icon: '✉️' },
                  { label: 'Calendar', icon: '📅' },
                  { label: 'Photos', icon: '🖼️' },
                  { label: 'Settings', icon: '⚙️' },
                ].map((app, i) => (
                  <div key={i} className="flex flex-col items-center space-y-1">
                    <div className="w-9 h-9 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-sm">
                      {app.icon}
                    </div>
                    <span className="text-[8px] text-zinc-500 scale-90">{app.label}</span>
                  </div>
                ))}
              </div>

              {/* Draggable Simulated Chathead Floating Bubble */}
              <motion.div
                drag
                dragConstraints={phoneRef}
                dragElastic={0.05}
                dragMomentum={true}
                onDragStart={() => setMobileBubbleExpanded(false)}
                className="absolute w-12 h-12 rounded-full bg-brand shadow-xl border border-white/20 flex items-center justify-center cursor-grab active:cursor-grabbing z-30"
                style={{ bottom: '90px', right: '16px' }}
                onClick={() => setMobileBubbleExpanded(!mobileBubbleExpanded)}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.95 }}
                layout
              >
                <Code className="w-5 h-5 text-white" />
              </motion.div>

              {/* Simulated Floating App Drawer overlay */}
              <AnimatePresence>
                {mobileBubbleExpanded && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.92, y: 30 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.92, y: 30 }}
                    className="absolute inset-x-3 max-h-[300px] bottom-4 bg-[#111] border border-zinc-800 rounded-2xl flex flex-col overflow-hidden shadow-2xl z-20 text-xs"
                  >
                    <div className="p-3 border-b border-zinc-800 bg-zinc-950 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-brand animate-pulse" />
                        <span className="font-bold text-[10px] text-zinc-400 uppercase tracking-widest">Floating Overlay Panel</span>
                      </div>
                      <button 
                        onClick={() => setMobileBubbleExpanded(false)}
                        className="p-1 text-zinc-500 hover:text-white"
                      >
                        <Minimize2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* search input for simulator */}
                    <div className="p-2 border-b border-zinc-800/80 bg-zinc-900/40">
                      <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-zinc-600" />
                        <input
                          type="text"
                          placeholder="Search simulator..."
                          value={simulatedSearch}
                          onChange={(e) => setSimulatedSearch(e.target.value)}
                          className="w-full bg-black/60 border border-zinc-800/80 rounded-lg py-1 pl-7 pr-2 text-[10px] focus:outline-none focus:border-brand/40 text-zinc-300"
                        />
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-2 space-y-1.5 custom-scrollbar bg-black/20">
                      {filteredSimulatedSnippets.length ===0 ? (
                        <div className="text-zinc-600 text-[10px] text-center italic py-4">
                          No matching snippets
                        </div>
                      ) : (
                        filteredSimulatedSnippets.map((snip, idx) => (
                          <div 
                            key={idx}
                            onClick={() => copySimulatedSnippet(snip.code, idx.toString())}
                            className="p-2 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800/60 rounded-xl flex items-center justify-between cursor-pointer group hover:border-brand/20 transition-all"
                          >
                            <div className="flex-1 min-w-0 pr-2">
                              <div className="font-bold text-[11px] truncate group-hover:text-brand transition-colors">{snip.title}</div>
                              <div className="text-[8px] font-mono text-zinc-500 uppercase">{snip.language || 'Text'}</div>
                            </div>
                            <button className="p-1 bg-zinc-8ba0/30 rounded-lg text-zinc-500 group-hover:text-brand text-[9px] transition-colors">
                              {copiedSnippetId === idx.toString() ? (
                                <Check className="w-3 h-3 text-brand" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        ))
                      )}
                    </div>

                    <div className="p-2 bg-zinc-950 border-t border-zinc-800 text-[8px] text-zinc-600 flex justify-between font-mono">
                      <span>DRAGGABLE HANDLE ACTIVE</span>
                      <span className="text-brand">tap outside to close</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Android Navigation Bar handle pill */}
            <div className="w-full h-4 flex justify-center items-center pb-2 z-20">
              <div className="w-24 h-1 bg-zinc-700 rounded-full" />
            </div>
          </div>

          <div className="flex items-center gap-2 bg-zinc-900/50 px-4 py-2 rounded-2xl border border-zinc-850">
            <Cpu className="w-4 h-4 text-brand" />
            <span className="text-[11px] text-zinc-400 font-medium">Native Edge-Snapping Code Configured Below</span>
          </div>
        </div>

        {/* Row 1/Col 2: Technical Tabs & copyable files */}
        <div className="lg:col-span-7 flex flex-col space-y-4">
          <div className="flex flex-wrap border-b border-zinc-800">
            {[
              { id: 'overview', label: 'Architecture', icon: Layers },
              { id: 'kotlin', label: 'SnippetBubbleService.kt', icon: FileCode },
              { id: 'manifest', label: 'AndroidManifest.xml', icon: Code },
              { id: 'capacitor', label: 'capacitor.config.ts', icon: Settings2 },
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveSubTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold uppercase tracking-wider relative transition-colors ${
                    activeSubTab === tab.id 
                      ? 'text-brand border-b-2 border-brand font-bold' 
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="flex-1 min-h-[350px]">
            {activeSubTab === 'overview' && (
              <div className="space-y-6 text-sm text-zinc-400 leading-relaxed">
                <div>
                  <h4 className="font-bold text-zinc-200 text-base mb-2">Android System Overlays (Draw-on-Top)</h4>
                  <p>
                    On Android, a floating widget or bubble is launched as a structural <span className="text-zinc-300 font-mono font-bold bg-zinc-900 border border-zinc-800 px-1 py-0.5 rounded">Service</span> utilizing Android's <span className="text-zinc-300 font-mono">WindowManager</span> client wrapper. Rather than rendering inside a standard fullscreen browser tab process, the app requests the standard <span className="text-brand font-mono font-bold">SYSTEM_ALERT_WINDOW</span> level authorization.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-zinc-900/30 rounded-2xl border border-zinc-800/80 space-y-2">
                    <div className="flex items-center gap-2 text-zinc-200 font-bold text-xs uppercase tracking-wider">
                      <span className="w-1.5 h-1.5 rounded-full bg-brand" />
                      Overlay Canvas Physics
                    </div>
                    <p className="text-xs text-zinc-500 leading-relaxed">
                      Android intercepts custom multi-touch motions on the bubble view, mapping them back dynamically to screen absolute vertical coordinate increments, triggering automatic left-to-right drift snapping when the user ends the drag state.
                    </p>
                  </div>

                  <div className="p-4 bg-zinc-900/30 rounded-2xl border border-zinc-800/80 space-y-2">
                    <div className="flex items-center gap-2 text-zinc-200 font-bold text-xs uppercase tracking-wider">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                      Bridging with Capacitor
                    </div>
                    <p className="text-xs text-zinc-500 leading-relaxed">
                      Using standard Capacitor, HTML and TS can access and configure foreground service listeners, passing snippet updates through web interfaces or local persistent SQLite instances.
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-zinc-900/50 rounded-2xl border border-zinc-850 space-y-3">
                  <h5 className="font-bold text-xs text-zinc-300 uppercase tracking-widest flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-zinc-500" /> Ready to Convert in 3 Commands:
                  </h5>
                  <div className="bg-black/50 p-3 rounded-xl border border-zinc-900 font-mono text-xs text-zinc-300 space-y-1 overflow-x-auto">
                    <div><span className="text-zinc-500"># 1. Install Capacitor Native tools</span></div>
                    <div>npm install @capacitor/core @capacitor/cli</div>
                    <div className="pt-2"><span className="text-zinc-500"># 2. Add Android deployment platform template</span></div>
                    <div>npx cap init</div>
                    <div>npx cap add android</div>
                    <div className="pt-2"><span className="text-zinc-500"># 3. Compile and bridge React build output</span></div>
                    <div>npm run build && npx cap sync</div>
                  </div>
                </div>
              </div>
            )}

            {activeSubTab === 'kotlin' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center text-xs text-zinc-500 font-mono">
                  <span>src/main/java/.../services/SnippetBubbleService.kt</span>
                  <button 
                    onClick={() => triggerCopy(kotlinCode, 'kotlin')}
                    className="flex items-center gap-1.5 text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800 px-2.5 py-1.5 rounded-lg transition-colors"
                  >
                    {copiedText === 'kotlin' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Code</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="bg-black/60 border border-zinc-800 rounded-2xl p-4 overflow-x-auto max-h-[380px] text-xs font-mono text-zinc-300 leading-relaxed custom-scrollbar">
                  <pre>{kotlinCode}</pre>
                </div>
              </div>
            )}

            {activeSubTab === 'manifest' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center text-xs text-zinc-500 font-mono">
                  <span>src/main/AndroidManifest.xml</span>
                  <button 
                    onClick={() => triggerCopy(manifestXml, 'manifest')}
                    className="flex items-center gap-1.5 text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800 px-2.5 py-1.5 rounded-lg transition-colors"
                  >
                    {copiedText === 'manifest' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Code</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="bg-black/60 border border-zinc-800 rounded-2xl p-4 overflow-x-auto max-h-[380px] text-xs font-mono text-zinc-300 leading-relaxed custom-scrollbar">
                  <pre>{manifestXml}</pre>
                </div>
              </div>
            )}

            {activeSubTab === 'capacitor' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center text-xs text-zinc-500 font-mono">
                  <span>capacitor.config.ts</span>
                  <button 
                    onClick={() => triggerCopy(capacitorCode, 'capacitor')}
                    className="flex items-center gap-1.5 text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800 px-2.5 py-1.5 rounded-lg transition-colors"
                  >
                    {copiedText === 'capacitor' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Code</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="bg-black/60 border border-zinc-800 rounded-2xl p-4 overflow-x-auto max-h-[380px] text-xs font-mono text-zinc-300 leading-relaxed custom-scrollbar">
                  <pre>{capacitorCode}</pre>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
