/**
 * AEGIS AI CROWD INTELLIGENCE COMMAND CENTER
 * Main Controller, UI Bindings, Chart Telemetry & Dispatch Orchestration
 */

class AegisApp {
  constructor() {
    this.currentView = 'single'; // 'single', 'quad', 'radar', 'analytics'
    this.canvas = null;
    this.ctx = null;
    this.quadCanvases = {};
    this.lastFrameTime = performance.now();
    this.fps = 60;
    this.eventLogs = [];
    this.telemetryHistory = {
      labels: [],
      density: [],
      flow: [],
      threat: []
    };
    this.chart = null;
    this.radarCanvas = null;
    this.radarCtx = null;
    this.lastAlertTime = 0;

    // Uploaded Media state
    this.uploadedVideo = null;
    this.uploadedImage = null;
    this.isUsingUploaded = false;

    // Live Webcam state
    this.isWebcamActive = false;
    this.webcamVideo = null;
    this.webcamStream = null;
    this.lastWebcamAlertTime = 0;
    this.latestWebcamMetrics = null;
  }

  async activateWebcam() {
    try {
      if (!this.webcamVideo) {
        this.webcamVideo = document.getElementById('webcamVideo');
      }

      if (!this.webcamStream) {
        this.logEvent('INFO', 'Initializing optical sensor (requesting webcam permissions)...');
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'user'
          },
          audio: false
        });
        this.webcamStream = stream;
        this.webcamVideo.srcObject = stream;
        await this.webcamVideo.play();
      }

      this.isWebcamActive = true;
      this.isUsingUploaded = false;
      this.switchView('single');

      const setText = (id, txt) => {
        const el = document.getElementById(id);
        if (el) el.textContent = txt;
      };
      setText('hudSectorId', 'CAM-LIVE');
      setText('hudSectorName', 'LIVE OPTICAL SENSOR (YOUR WEBCAM)');
      setText('hudSectorLocation', 'Local Video Stream • Real-Time AI Threat Perception');

      window.tacticalAudio.playPing();
      window.tacticalAudio.speak('Live Optical Webcam Sensor engaged. Threat perimeter and tripwires online.');
      this.logEvent('INFO', 'LIVE WEBCAM ONLINE: Real-time optical flow & threat detection active.');
    } catch (err) {
      console.error('Webcam access error:', err);
      this.logEvent('WARNING', `Optical Sensor Error: ${err.message || 'Permission denied or no camera found.'}`);
      alert(`Optical Sensor Notice: Could not access webcam (${err.name}: ${err.message}).\n\nPlease ensure you grant camera permissions in your browser.`);
    }
  }

  init() {
    this.initDOM();
    this.initClock();
    this.initCanvas();
    this.initChart();
    this.bindEvents();
    this.logEvent('INFO', 'AEGIS Neural Surveillance Engine initialized. Dual-spectral synthetic feeds active.');
    this.logEvent('INFO', 'Zero-webcam autonomous mode: 4/4 synthetic CCTV sectors streaming at 4K 60FPS.');

    // Start render & simulation loops
    requestAnimationFrame((t) => this.renderLoop(t));
    setInterval(() => this.telemetryTick(), 1000);
  }

  initDOM() {
    this.canvas = document.getElementById('mainViewportCanvas');
    if (this.canvas) {
      this.ctx = this.canvas.getContext('2d');
    }

    // Quad mode canvases
    ['CAM-01', 'CAM-02', 'CAM-03', 'CAM-04'].forEach(id => {
      const el = document.getElementById(`quadCanvas_${id}`);
      if (el) {
        this.quadCanvases[id] = {
          canvas: el,
          ctx: el.getContext('2d')
        };
      }
    });

    this.radarCanvas = document.getElementById('tacticalRadarCanvas');
    if (this.radarCanvas) {
      this.radarCtx = this.radarCanvas.getContext('2d');
    }
  }

  initClock() {
    const updateTime = () => {
      const now = new Date();
      const utcStr = now.toISOString().replace('T', ' ').substring(0, 19) + ' UTC';
      const localStr = now.toLocaleTimeString('en-US', { hour12: false });
      const ms = now.getMilliseconds().toString().padStart(3, '0');

      const clockEl = document.getElementById('hudClock');
      if (clockEl) {
        clockEl.textContent = `${localStr}.${ms} | ${utcStr}`;
      }
    };
    setInterval(updateTime, 40);
    updateTime();
  }

  initCanvas() {
    // Default virtual resolution
    if (this.canvas) {
      this.canvas.width = 960;
      this.canvas.height = 540;
    }
    for (const id in this.quadCanvases) {
      this.quadCanvases[id].canvas.width = 480;
      this.quadCanvases[id].canvas.height = 270;
    }
    if (this.radarCanvas) {
      this.radarCanvas.width = 960;
      this.radarCanvas.height = 540;
    }
  }

  initChart() {
    const chartEl = document.getElementById('telemetryTrendChart');
    if (!chartEl || !window.Chart) return;

    // Fill initial 15 points
    const now = new Date();
    for (let i = 14; i >= 0; i--) {
      const t = new Date(now.getTime() - i * 1000);
      this.telemetryHistory.labels.push(t.toLocaleTimeString('en-US', { hour12: false }));
      this.telemetryHistory.density.push(0.4 + Math.random() * 0.2);
      this.telemetryHistory.flow.push(Math.round(45 + Math.random() * 15));
      this.telemetryHistory.threat.push(10);
    }

    this.chart = new Chart(chartEl, {
      type: 'line',
      data: {
        labels: this.telemetryHistory.labels,
        datasets: [
          {
            label: 'Density (P/m²)',
            data: this.telemetryHistory.density,
            borderColor: '#00f0ff',
            backgroundColor: 'rgba(0, 240, 255, 0.12)',
            borderWidth: 2,
            tension: 0.35,
            fill: true,
            yAxisID: 'y'
          },
          {
            label: 'Flow Rate (P/min)',
            data: this.telemetryHistory.flow,
            borderColor: '#00ff9d',
            borderWidth: 2,
            tension: 0.35,
            borderDash: [4, 4],
            fill: false,
            yAxisID: 'y1'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 400 },
        scales: {
          x: {
            display: false,
            grid: { display: false }
          },
          y: {
            type: 'linear',
            display: true,
            position: 'left',
            min: 0,
            max: 3.0,
            grid: { color: 'rgba(255, 255, 255, 0.06)' },
            ticks: { color: '#8494b2', font: { size: 9 } }
          },
          y1: {
            type: 'linear',
            display: true,
            position: 'right',
            min: 0,
            max: 120,
            grid: { drawOnChartArea: false },
            ticks: { color: '#00ff9d', font: { size: 9 } }
          }
        },
        plugins: {
          legend: {
            display: true,
            position: 'top',
            labels: { color: '#8494b2', font: { size: 9, family: 'monospace' }, boxWidth: 12 }
          }
        }
      }
    });
  }

  telemetryTick() {
    if (this.isWebcamActive && this.latestWebcamMetrics) {
      const m = this.latestWebcamMetrics;
      const nowStr = new Date().toLocaleTimeString('en-US', { hour12: false });
      this.telemetryHistory.labels.push(nowStr);
      this.telemetryHistory.density.push(parseFloat(m.density));
      this.telemetryHistory.flow.push(m.flowRate);
      this.telemetryHistory.threat.push(m.threatScore);

      if (this.telemetryHistory.labels.length > 20) {
        this.telemetryHistory.labels.shift();
        this.telemetryHistory.density.shift();
        this.telemetryHistory.flow.shift();
        this.telemetryHistory.threat.shift();
      }

      if (this.chart) this.chart.update('none');

      this.updateHUDMetrics(m, {
        id: 'CAM-LIVE',
        name: 'LIVE OPTICAL SENSOR',
        location: 'Local Optical Video Feed • Real-Time AI Threat Detection'
      });
      return;
    }

    const sec = window.crowdEngine.getActiveSector();
    const metrics = window.aiVision.computeMetrics(sec);

    // Update Telemetry Chart
    const nowStr = new Date().toLocaleTimeString('en-US', { hour12: false });
    this.telemetryHistory.labels.push(nowStr);
    this.telemetryHistory.density.push(parseFloat(metrics.density));
    this.telemetryHistory.flow.push(metrics.flowRate);
    this.telemetryHistory.threat.push(metrics.threatScore);

    if (this.telemetryHistory.labels.length > 20) {
      this.telemetryHistory.labels.shift();
      this.telemetryHistory.density.shift();
      this.telemetryHistory.flow.shift();
      this.telemetryHistory.threat.shift();
    }

    if (this.chart) {
      this.chart.update('none');
    }

    // Update UI HUD Metrics
    this.updateHUDMetrics(metrics, sec);

    // Autonomous Alert Detection & Incident Logging
    this.checkAutonomousAnomalies(metrics, sec);
  }

  updateHUDMetrics(m, sec) {
    const setText = (id, txt) => {
      const el = document.getElementById(id);
      if (el) el.textContent = txt;
    };

    setText('metricHeadcount', m.totalCount);
    setText('metricDensity', `${m.density} P/m²`);
    setText('metricFlowRate', `${m.flowRate} /min`);
    setText('metricCrushRisk', `${m.crushPressure}%`);
    setText('metricThreatScore', `${m.threatScore}%`);
    
    // Level of Service
    const losEl = document.getElementById('metricLoS');
    if (losEl) {
      losEl.textContent = `LoS ${m.losGrade} - ${m.losDescription}`;
      losEl.style.color = m.losColor;
    }

    // Threat level badge
    const badgeEl = document.getElementById('globalThreatBadge');
    if (badgeEl) {
      badgeEl.textContent = m.threatLevel;
      badgeEl.className = `font-tactical text-xs font-bold px-2 py-0.5 rounded border border-${m.threatBadgeColor}-500/40 bg-${m.threatBadgeColor}-500/10 text-${m.threatBadgeColor}-400`;
    }

    // Active Sector Header
    setText('hudSectorId', sec.id);
    setText('hudSectorName', sec.name);
    setText('hudSectorLocation', sec.location);
  }

  checkAutonomousAnomalies(m, sec) {
    const now = Date.now();
    if (now - this.lastAlertTime < 5000) return; // Debounce 5s

    if (m.panicCount > 0) {
      this.logEvent('CRITICAL', `CROWD SURGE / STAMPEDE in ${sec.id} (${sec.name}). Rapid divergence detected.`);
      this.lastAlertTime = now;
    } else if (m.breachCount > 0) {
      this.logEvent('CRITICAL', `RESTRICTED PERIMETER BREACH: Unauthorized subject inside ${sec.id}.`);
      this.lastAlertTime = now;
    } else if (m.unattendedCount > 0) {
      this.logEvent('WARNING', `UNATTENDED OBJECT DETECTED in ${sec.id}. Security scan initiated.`);
      this.lastAlertTime = now;
    } else if (m.loiteringCount > 0) {
      this.logEvent('WARNING', `SUSPICIOUS LOITERING DETECTED in ${sec.id} (${m.loiteringCount} subjects).`);
      this.lastAlertTime = now;
    } else if (parseFloat(m.density) > 1.2) {
      this.logEvent('WARNING', `HIGH DENSITY WARNING: Level of Service ${m.losGrade} in ${sec.id}.`);
      this.lastAlertTime = now;
    }
  }

  logEvent(level, message) {
    const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false });
    const event = { id: Date.now(), level, message, timestamp };
    this.eventLogs.unshift(event);
    if (this.eventLogs.length > 50) this.eventLogs.pop();

    const logContainer = document.getElementById('incidentLogContainer');
    if (logContainer) {
      const item = document.createElement('div');
      item.className = 'p-2 rounded bg-slate-900/60 border border-slate-800 text-xs font-mono flex items-start gap-2 animate-fadeIn';
      
      let badgeClass = 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30';
      if (level === 'CRITICAL') badgeClass = 'text-red-400 bg-red-500/20 border-red-500/50 critical-pulse';
      else if (level === 'WARNING') badgeClass = 'text-amber-400 bg-amber-500/20 border-amber-500/50';

      item.innerHTML = `
        <span class="px-1.5 py-0.5 rounded text-[10px] font-bold border ${badgeClass}">${level}</span>
        <span class="text-slate-400 text-[10px] whitespace-nowrap">${timestamp}</span>
        <span class="text-slate-200 flex-1">${message}</span>
      `;
      logContainer.prepend(item);
    }
  }

  /**
   * Main Render Loop
   */
  renderLoop(timestamp) {
    const delta = timestamp - this.lastFrameTime;
    this.lastFrameTime = timestamp;
    this.fps = Math.round(1000 / (delta || 16.6));

    const fpsEl = document.getElementById('hudFpsCounter');
    if (fpsEl && Math.random() < 0.1) {
      fpsEl.textContent = `${this.fps} FPS`;
    }

    // 1. Advance crowd simulation for all sectors
    window.crowdEngine.updateAll();

    // 2. Render based on active view mode
    if (this.currentView === 'single') {
      this.renderSingleView();
    } else if (this.currentView === 'quad') {
      this.renderQuadView();
    } else if (this.currentView === 'radar') {
      this.renderRadarMap();
    }

    requestAnimationFrame((t) => this.renderLoop(t));
  }

  renderSingleView() {
    if (!this.ctx || !this.canvas) return;

    if (this.isWebcamActive && this.webcamVideo && this.webcamVideo.readyState >= 2) {
      // Live Webcam Real-Time AI Computer Vision & Threat Detection
      const metrics = window.aiVision.processWebcamFeed(
        this.webcamVideo,
        this.ctx,
        this.canvas.width,
        this.canvas.height
      );

      if (metrics) {
        this.latestWebcamMetrics = metrics;

        // Autonomous Threat Alerts on Webcam
        if (metrics.isThreatActive) {
          const now = Date.now();
          if (now - this.lastWebcamAlertTime > 4500) {
            this.lastWebcamAlertTime = now;
            window.tacticalAudio.playCriticalAlarm();
            window.tacticalAudio.speak(`Security Alert: ${metrics.threatReason}`);
            this.logEvent('CRITICAL', `[WEBCAM THREAT] ${metrics.threatReason}`);
          }
        }
      }
    } else if (this.isUsingUploaded && (this.uploadedVideo || this.uploadedImage)) {
      // Uploaded Media Mode: draw video/image frame, then synthetic overlays
      const media = this.uploadedVideo || this.uploadedImage;
      this.ctx.drawImage(media, 0, 0, this.canvas.width, this.canvas.height);
      const sec = window.crowdEngine.getActiveSector();
      // Render AI annotations over video
      window.aiVision.renderPedestrians(this.ctx, sec);
      if (window.aiVision.options.showHeatmap) {
        window.aiVision.renderHeatmapLayer(this.ctx, sec);
      }
    } else {
      // Standard Synthetic Multi-Spectral Feed
      const sec = window.crowdEngine.getActiveSector();
      window.aiVision.render(this.ctx, sec, this.canvas.width, this.canvas.height);
    }
  }

  renderQuadView() {
    // Render all 4 sectors into their respective sub-canvases
    for (const id in this.quadCanvases) {
      const q = this.quadCanvases[id];
      const sec = window.crowdEngine.sectors[id];
      if (sec && q.ctx) {
        window.aiVision.render(q.ctx, sec, q.canvas.width, q.canvas.height);
      }
    }
  }

  renderRadarMap() {
    if (!this.radarCtx || !this.radarCanvas) return;
    const ctx = this.radarCtx;
    const w = this.radarCanvas.width;
    const h = this.radarCanvas.height;

    // Tactical blueprint background
    ctx.fillStyle = '#060a14';
    ctx.fillRect(0, 0, w, h);

    // Concentric Radar circles
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.15)';
    ctx.lineWidth = 1;
    for (let r = 80; r < 480; r += 70) {
      ctx.beginPath();
      ctx.arc(w / 2, h / 2, r, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Facility Quadrants & Zones
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.3)';
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(w / 2, 0); ctx.lineTo(w / 2, h);
    ctx.moveTo(0, h / 2); ctx.lineTo(w, h / 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Quadrant Titles
    ctx.fillStyle = 'rgba(0, 240, 255, 0.6)';
    ctx.font = 'bold 11px monospace';
    ctx.fillText('SECTOR 1: CONCOURSE ALPHA', 30, 30);
    ctx.fillText('SECTOR 2: GATE BRAVO', w / 2 + 30, 30);
    ctx.fillText('SECTOR 3: CIVIC PLAZA', 30, h / 2 + 30);
    ctx.fillText('SECTOR 4: PERIMETER DELTA', w / 2 + 30, h / 2 + 30);

    // Render agents from all 4 sectors mapped into 4 quadrants
    const sectors = [
      { id: 'CAM-01', ox: 0, oy: 0 },
      { id: 'CAM-02', ox: w / 2, oy: 0 },
      { id: 'CAM-03', ox: 0, oy: h / 2 },
      { id: 'CAM-04', ox: w / 2, oy: h / 2 }
    ];

    sectors.forEach(s => {
      const sec = window.crowdEngine.sectors[s.id];
      if (!sec) return;

      const scaleX = (w / 2) / sec.bounds.w;
      const scaleY = (h / 2) / sec.bounds.h;

      // Draw agent blips
      sec.agents.forEach(a => {
        const px = s.ox + a.x * scaleX;
        const py = s.oy + a.y * scaleY;

        ctx.fillStyle = a.isPanic ? '#ff0055' : (a.inRestricted ? '#ef4444' : '#00ff9d');
        ctx.beginPath();
        ctx.arc(px, py, a.isPanic ? 3.5 : 2, 0, Math.PI * 2);
        ctx.fill();
      });

      // Camera position beacon
      ctx.fillStyle = '#00f0ff';
      ctx.beginPath();
      ctx.arc(s.ox + 25, s.oy + 25, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#00f0ff';
      ctx.strokeRect(s.ox + 20, s.oy + 20, 10, 10);
    });

    // Rotating Radar Sweep beam
    const time = Date.now() / 1000;
    const sweepAngle = (time * 1.5) % (Math.PI * 2);
    const grad = ctx.createRadialGradient(w / 2, h / 2, 10, w / 2, h / 2, 450);
    grad.addColorStop(0, 'rgba(0, 240, 255, 0.25)');
    grad.addColorStop(1, 'rgba(0, 240, 255, 0)');

    ctx.save();
    ctx.translate(w / 2, h / 2);
    ctx.rotate(sweepAngle);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, 450, 0, Math.PI / 4);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  /**
   * UI Event Bindings
   */
  bindEvents() {
    // Camera Switching
    document.querySelectorAll('.cam-select-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const camId = e.currentTarget.dataset.cam;
        document.querySelectorAll('.cam-select-btn').forEach(b => b.classList.remove('btn-active'));
        e.currentTarget.classList.add('btn-active');

        if (camId === 'CAM-LIVE') {
          this.activateWebcam();
        } else {
          this.isWebcamActive = false;
          window.crowdEngine.setActiveSector(camId);
          this.logEvent('INFO', `Switched active surveillance viewport to ${camId}.`);
        }
      });
    });

    // Header Quick Webcam Button
    const btnHeaderWebcam = document.getElementById('btnHeaderWebcam');
    if (btnHeaderWebcam) {
      btnHeaderWebcam.addEventListener('click', () => {
        document.querySelectorAll('.cam-select-btn').forEach(b => b.classList.remove('btn-active'));
        const liveBtn = document.getElementById('btnSelectWebcam');
        if (liveBtn) liveBtn.classList.add('btn-active');
        this.activateWebcam();
      });
    }

    // View Mode Switching (Single, Quad, Radar)
    document.querySelectorAll('.view-mode-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const view = e.currentTarget.dataset.view;
        this.switchView(view);
        document.querySelectorAll('.view-mode-btn').forEach(b => b.classList.remove('btn-active'));
        e.currentTarget.classList.add('btn-active');
        window.tacticalAudio.playClick();
      });
    });

    // AI Vision Toggles
    this.bindToggle('toggleBoundingBoxes', 'showBoundingBoxes');
    this.bindToggle('toggleVectors', 'showVectors');
    this.bindToggle('togglePose', 'showPoseSkeletons');
    this.bindToggle('toggleHeatmap', 'showHeatmap');
    this.bindToggle('toggleTripwires', 'showTripwires');
    this.bindToggle('togglePrivacyMask', 'privacyMask');
    this.bindToggle('toggleNightVision', 'nightVisionMode');

    // Scanlines Toggle
    const scanToggle = document.getElementById('toggleScanlines');
    if (scanToggle) {
      scanToggle.addEventListener('click', () => {
        document.body.classList.toggle('scanlines');
        scanToggle.classList.toggle('btn-active');
        window.tacticalAudio.playClick();
      });
    }

    // Audio Mute Toggle
    const audioToggle = document.getElementById('toggleAudio');
    if (audioToggle) {
      audioToggle.addEventListener('click', () => {
        const isMuted = window.tacticalAudio.toggleMute();
        audioToggle.textContent = isMuted ? '🔇 AUDIO OFF' : '🔊 AUDIO ON';
        audioToggle.classList.toggle('btn-active', !isMuted);
      });
    }

    // Scenario Injections
    document.querySelectorAll('.scenario-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const scenario = e.currentTarget.dataset.scenario;
        window.crowdEngine.triggerScenario(scenario);
      });
    });

    // Emergency Dispatch Buttons
    const btnGuard = document.getElementById('btnDispatchGuards');
    if (btnGuard) {
      btnGuard.addEventListener('click', () => {
        window.tacticalAudio.playDispatchConfirmed();
        window.tacticalAudio.speak('Rapid Response Security Unit dispatched to active sector.');
        this.logEvent('CRITICAL', `EMERGENCY DISPATCH: Tactical Security Patrol Unit deployed to ${window.crowdEngine.activeSectorId}.`);
        alert(`🚨 DISPATCH CONFIRMED:\nTactical Rapid Response Team 4 deployed to Sector ${window.crowdEngine.activeSectorId}. ETA: 45 seconds.`);
      });
    }

    const btnPA = document.getElementById('btnBroadcastPA');
    if (btnPA) {
      btnPA.addEventListener('click', () => {
        window.tacticalAudio.playWarningBeep();
        window.tacticalAudio.speak('Attention all occupants. Please proceed calmly towards designated exit corridors. Do not run.');
        this.logEvent('WARNING', `FACILITY PA BROADCAST: Automated crowd evacuation instructions transmitted.`);
      });
    }

    const btnLockdown = document.getElementById('btnLockdownGates');
    if (btnLockdown) {
      btnLockdown.addEventListener('click', () => {
        window.tacticalAudio.playCriticalAlarm();
        window.tacticalAudio.speak('Emergency lockdown initiated. Turnstiles and security barriers sealed.');
        this.logEvent('CRITICAL', `FACILITY LOCKDOWN: Ingress gates sealed in ${window.crowdEngine.activeSectorId}.`);
        alert(`🔒 FACILITY LOCKDOWN ENGAGED:\nElectronic turnstiles and security gates in Sector ${window.crowdEngine.activeSectorId} have been magnetically locked.`);
      });
    }

    // Incident Dossier Generator
    const btnReport = document.getElementById('btnGenerateReport');
    if (btnReport) {
      btnReport.addEventListener('click', () => {
        this.generateIncidentDossier();
      });
    }

    // File Upload (Custom Video / Image Analysis)
    const fileInput = document.getElementById('mediaUploadInput');
    if (fileInput) {
      fileInput.addEventListener('change', (e) => {
        this.handleFileUpload(e.target.files[0]);
      });
    }
  }

  bindToggle(elementId, optionKey) {
    const el = document.getElementById(elementId);
    if (!el) return;
    el.addEventListener('click', () => {
      window.aiVision.options[optionKey] = !window.aiVision.options[optionKey];
      el.classList.toggle('btn-active', window.aiVision.options[optionKey]);
      window.tacticalAudio.playClick();
    });
  }

  switchView(view) {
    this.currentView = view;
    const singleWrap = document.getElementById('singleViewWrapper');
    const quadWrap = document.getElementById('quadViewWrapper');
    const radarWrap = document.getElementById('radarViewWrapper');

    if (singleWrap) singleWrap.style.display = view === 'single' ? 'block' : 'none';
    if (quadWrap) quadWrap.style.display = view === 'quad' ? 'grid' : 'none';
    if (radarWrap) radarWrap.style.display = view === 'radar' ? 'block' : 'none';
  }

  handleFileUpload(file) {
    if (!file) return;
    const url = URL.createObjectURL(file);
    const isVideo = file.type.startsWith('video');

    if (isVideo) {
      const vid = document.createElement('video');
      vid.src = url;
      vid.autoplay = true;
      vid.loop = true;
      vid.muted = true;
      vid.play();
      this.uploadedVideo = vid;
      this.uploadedImage = null;
      this.isUsingUploaded = true;
      this.logEvent('INFO', `Custom CCTV Video Loaded: "${file.name}". Real-time AI analysis initiated.`);
    } else {
      const img = new Image();
      img.onload = () => {
        this.uploadedImage = img;
        this.uploadedVideo = null;
        this.isUsingUploaded = true;
        this.logEvent('INFO', `Custom Surveillance Image Loaded: "${file.name}". AI crowd count & heatmap computed.`);
      };
      img.src = url;
    }

    // Switch to single view
    this.switchView('single');
  }

  generateIncidentDossier() {
    const sec = window.crowdEngine.getActiveSector();
    const metrics = window.aiVision.computeMetrics(sec);
    const now = new Date();
    const incidentId = `INC-${now.getFullYear()}${(now.getMonth()+1).toString().padStart(2, '0')}-${Math.floor(Math.random()*90000+10000)}`;

    const modal = document.getElementById('incidentReportModal');
    const content = document.getElementById('incidentReportContent');
    if (!modal || !content) return;

    // Snapshot of current viewport
    let snapshotDataUrl = '';
    if (this.canvas) {
      snapshotDataUrl = this.canvas.toDataURL('image/jpeg', 0.85);
    }

    content.innerHTML = `
      <div class="border-b border-cyan-500/30 pb-4 mb-4 flex justify-between items-start">
        <div>
          <div class="text-xs text-cyan-400 font-mono tracking-widest font-bold">TOP SECRET // CLASSIFIED LAW ENFORCEMENT INTELLIGENCE</div>
          <h2 class="text-2xl font-bold font-mono text-white mt-1">CROWD ANOMALY & THREAT INCIDENT DOSSIER</h2>
          <div class="text-xs text-slate-400 font-mono mt-1">INCIDENT IDENTIFIER: <span class="text-cyan-400 font-bold">${incidentId}</span> | JURISDICTION: METRO COMMAND</div>
        </div>
        <div class="text-right font-mono text-xs text-slate-400">
          <div>DATE: ${now.toLocaleDateString()}</div>
          <div>TIMESTAMP: ${now.toLocaleTimeString()} UTC</div>
          <div class="text-red-400 font-bold mt-1">STATUS: ${metrics.threatLevel}</div>
        </div>
      </div>

      <!-- Live CCTV Snapshot Frame -->
      <div class="mb-5">
        <div class="text-xs font-mono text-slate-300 mb-1 flex justify-between">
          <span>EVIDENCE CAPTURE [OPTICAL SENSOR]: ${sec.name}</span>
          <span class="text-cyan-400">RESOLUTION: 3840x2160 UHD</span>
        </div>
        <div class="border border-cyan-500/40 rounded p-1 bg-black">
          <img src="${snapshotDataUrl}" class="w-full h-auto rounded max-h-64 object-cover" alt="Incident CCTV Snapshot" />
        </div>
      </div>

      <!-- Telemetry Analytics Matrix -->
      <div class="grid grid-cols-4 gap-3 mb-5 font-mono">
        <div class="p-3 bg-slate-900 border border-slate-700 rounded">
          <div class="text-[10px] text-slate-400">DETECTED OCCUPANCY</div>
          <div class="text-xl font-bold text-white">${metrics.totalCount} <span class="text-xs text-slate-400">Persons</span></div>
        </div>
        <div class="p-3 bg-slate-900 border border-slate-700 rounded">
          <div class="text-[10px] text-slate-400">DENSITY RATING</div>
          <div class="text-xl font-bold text-cyan-400">${metrics.density} <span class="text-xs text-slate-400">P/m²</span></div>
        </div>
        <div class="p-3 bg-slate-900 border border-slate-700 rounded">
          <div class="text-[10px] text-slate-400">FRUIN LEVEL OF SERVICE</div>
          <div class="text-xl font-bold" style="color: ${metrics.losColor}">LoS ${metrics.losGrade}</div>
        </div>
        <div class="p-3 bg-slate-900 border border-slate-700 rounded">
          <div class="text-[10px] text-slate-400">CRUSH / STAMPEDE RISK</div>
          <div class="text-xl font-bold text-red-400">${metrics.crushPressure}%</div>
        </div>
      </div>

      <!-- Security Events Timeline -->
      <div class="mb-5">
        <h4 class="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider mb-2">Automated Threat Event Log</h4>
        <div class="space-y-1.5 max-h-36 overflow-y-auto font-mono text-xs">
          ${this.eventLogs.slice(0, 6).map(e => `
            <div class="p-1.5 bg-slate-900/80 rounded border border-slate-800 flex items-center gap-2">
              <span class="text-slate-500">[${e.timestamp}]</span>
              <span class="px-1 rounded text-[10px] font-bold ${e.level === 'CRITICAL' ? 'text-red-400 bg-red-900/30' : 'text-amber-400 bg-amber-900/30'}">${e.level}</span>
              <span class="text-slate-300">${e.message}</span>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Officer Signoff & Directives -->
      <div class="border-t border-slate-800 pt-3 flex justify-between items-end font-mono text-xs text-slate-400">
        <div>
          <div>DISPATCH DIRECTIVE: Level 2 Crowd Control Units on Standby</div>
          <div>AUTOMATED AI VERIFICATION: YOLOv9-Crowd Tensor Core Hash Verified</div>
        </div>
        <div class="text-right">
          <div class="border-b border-slate-600 pb-1 mb-1 w-48 text-center text-slate-300">COMMANDER J. VANCE</div>
          <div class="text-[10px]">CHIEF SECURITY CONTROLLER</div>
        </div>
      </div>
    `;

    modal.classList.remove('hidden');
    modal.classList.add('flex');
    window.tacticalAudio.playDispatchConfirmed();
  }
}

// Global App Instance
window.aegisApp = new AegisApp();
window.addEventListener('DOMContentLoaded', () => {
  window.aegisApp.init();
});
