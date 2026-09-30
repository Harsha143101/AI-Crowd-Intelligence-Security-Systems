/**
 * AEGIS AI CROWD INTELLIGENCE SYSTEM
 * Synthetic Computer Vision & Neural Crowd Analytics Engine
 * Features: YOLO-style Bounding Boxes, Optical Flow Vectors, Heatmaps, LoS, Privacy Mask
 */

class AIVisionEngine {
  constructor() {
    this.options = {
      showBoundingBoxes: true,
      showPersonIds: true,
      showVectors: true,
      showPoseSkeletons: true,
      showHeatmap: true,
      showTripwires: true,
      privacyMask: false,
      heatmapOpacity: 0.55,
      nightVisionMode: false
    };

    // Offscreen heatmap canvas for ultra-smooth GPU composition
    this.heatCanvas = document.createElement('canvas');
    this.heatCanvas.width = 960;
    this.heatCanvas.height = 540;
    this.heatCtx = this.heatCanvas.getContext('2d');

    // Precomputed radial gradient brush
    this.brush = this.createHeatBrush(45);
    
    // Palette lookup gradient
    this.palette = this.createPalette();
  }

  createHeatBrush(radius) {
    const bCanvas = document.createElement('canvas');
    bCanvas.width = radius * 2;
    bCanvas.height = radius * 2;
    const bCtx = bCanvas.getContext('2d');

    const grad = bCtx.createRadialGradient(radius, radius, 0, radius, radius, radius);
    grad.addColorStop(0, 'rgba(0, 0, 0, 1)');
    grad.addColorStop(0.3, 'rgba(0, 0, 0, 0.6)');
    grad.addColorStop(0.7, 'rgba(0, 0, 0, 0.2)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    bCtx.fillStyle = grad;
    bCtx.fillRect(0, 0, radius * 2, radius * 2);
    return bCanvas;
  }

  createPalette() {
    const pCanvas = document.createElement('canvas');
    pCanvas.width = 256;
    pCanvas.height = 1;
    const pCtx = pCanvas.getContext('2d');

    const grad = pCtx.createLinearGradient(0, 0, 256, 0);
    grad.addColorStop(0.0, 'rgba(0, 20, 80, 0)');
    grad.addColorStop(0.15, 'rgba(0, 200, 255, 0.5)'); // Cyan
    grad.addColorStop(0.40, 'rgba(0, 255, 120, 0.7)'); // Emerald
    grad.addColorStop(0.65, 'rgba(255, 220, 0, 0.85)'); // Yellow
    grad.addColorStop(0.85, 'rgba(255, 90, 0, 0.95)');  // Orange
    grad.addColorStop(1.0, 'rgba(255, 0, 60, 1.0)');   // Crimson Red

    pCtx.fillStyle = grad;
    pCtx.fillRect(0, 0, 256, 1);
    return pCtx.getImageData(0, 0, 256, 1).data;
  }

  /**
   * Main Render Pipeline
   */
  render(ctx, sector, width, height) {
    const scaleX = width / sector.bounds.w;
    const scaleY = height / sector.bounds.h;

    ctx.save();
    ctx.scale(scaleX, scaleY);

    // 1. Draw Environmental Map & Floor Grid
    this.renderEnvironment(ctx, sector);

    // 2. Draw Tripwires and Geofenced Zones
    if (this.options.showTripwires) {
      this.renderZonesAndTripwires(ctx, sector);
    }

    // 3. Draw Unattended Luggage / Hazards
    this.renderUnattendedObjects(ctx, sector);

    // 4. Draw Pedestrians & AI Overlays
    this.renderPedestrians(ctx, sector);

    // 5. Draw Density Heatmap
    if (this.options.showHeatmap) {
      this.renderHeatmapLayer(ctx, sector);
    }

    // 6. Draw Night Vision / CCTV Filter if toggled
    if (this.options.nightVisionMode) {
      ctx.fillStyle = 'rgba(0, 255, 120, 0.08)';
      ctx.fillRect(0, 0, sector.bounds.w, sector.bounds.h);
    }

    ctx.restore();
  }

  renderEnvironment(ctx, sector) {
    const w = sector.bounds.w;
    const h = sector.bounds.h;

    // Floor Base (Dark surveillance background)
    ctx.fillStyle = '#0a101d';
    ctx.fillRect(0, 0, w, h);

    // Subtle tactical grid
    ctx.strokeStyle = 'rgba(30, 58, 95, 0.25)';
    ctx.lineWidth = 1;
    const gridSize = 40;
    ctx.beginPath();
    for (let x = 0; x <= w; x += gridSize) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
    }
    for (let y = 0; y <= h; y += gridSize) {
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
    }
    ctx.stroke();

    // Directional Walkway Guide Lines
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.12)';
    ctx.setLineDash([8, 8]);
    ctx.beginPath();
    ctx.moveTo(80, h / 2);
    ctx.lineTo(w - 80, h / 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw Obstacles (Pillars, Desks, Turnstiles, Walls)
    for (const obs of sector.obstacles) {
      ctx.save();
      if (obs.type === 'circle') {
        // Drop shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.beginPath();
        ctx.arc(obs.x + 3, obs.y + 3, obs.radius, 0, Math.PI * 2);
        ctx.fill();

        // Pillar body
        ctx.fillStyle = '#1e293b';
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(obs.x, obs.y, obs.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Inner marker
        ctx.fillStyle = 'rgba(56, 189, 248, 0.4)';
        ctx.beginPath();
        ctx.arc(obs.x, obs.y, obs.radius * 0.4, 0, Math.PI * 2);
        ctx.fill();
      } else if (obs.type === 'rect') {
        // Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(obs.x + 3, obs.y + 3, obs.w, obs.h);

        // Rect body
        ctx.fillStyle = '#1e293b';
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 1.5;
        ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
        ctx.strokeRect(obs.x, obs.y, obs.w, obs.h);

        // Architectural label
        ctx.fillStyle = 'rgba(148, 163, 184, 0.5)';
        ctx.font = '9px monospace';
        ctx.fillText(obs.name.toUpperCase(), obs.x + 6, obs.y + 14);
      }
      ctx.restore();
    }
  }

  renderZonesAndTripwires(ctx, sector) {
    const time = Date.now() / 1000;

    // Restricted Security Zones
    for (const rz of sector.restrictedZones) {
      ctx.save();
      // Glowing red warning box
      ctx.fillStyle = 'rgba(239, 68, 68, 0.08)';
      ctx.fillRect(rz.x, rz.y, rz.w, rz.h);

      ctx.strokeStyle = 'rgba(239, 68, 68, 0.7)';
      ctx.lineWidth = 2;
      ctx.setLineDash([10, 5]);
      ctx.strokeRect(rz.x, rz.y, rz.w, rz.h);

      // Warning text badge
      ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(239, 68, 68, 0.9)';
      ctx.font = 'bold 10px monospace';
      ctx.fillText(`⚠ ${rz.name}`, rz.x + 8, rz.y + 18);
      ctx.restore();
    }

    // Laser Tripwires
    for (const tw of sector.tripwires) {
      ctx.save();
      const pulse = 0.5 + Math.sin(time * 6) * 0.3;
      ctx.strokeStyle = `rgba(0, 240, 255, ${0.4 + pulse * 0.4})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(tw.x1, tw.y1);
      ctx.lineTo(tw.x2, tw.y2);
      ctx.stroke();

      // Tripwire label
      ctx.fillStyle = '#00f0ff';
      ctx.font = 'bold 9px monospace';
      ctx.fillText(tw.label, tw.x1 + 6, tw.y1 + 16);
      ctx.restore();
    }
  }

  renderUnattendedObjects(ctx, sector) {
    const time = Date.now() / 1000;

    for (const obj of sector.unattendedObjects) {
      ctx.save();
      const pulse = Math.sin(time * 8) * 6;
      
      // Target Reticle
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(obj.x, obj.y, 16 + pulse, 0, Math.PI * 2);
      ctx.stroke();

      // Bag icon / graphic
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(obj.x - 7, obj.y - 6, 14, 12);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(obj.x - 3, obj.y - 8, 6, 3);

      // Dwell timer pill
      ctx.fillStyle = 'rgba(239, 68, 68, 0.9)';
      ctx.fillRect(obj.x - 45, obj.y - 28, 90, 16);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`⚠ DWELL: ${Math.floor(obj.age)}s`, obj.x, obj.y - 17);

      ctx.restore();
    }
  }

  renderPedestrians(ctx, sector) {
    const time = Date.now() / 1000;

    for (const agent of sector.agents) {
      ctx.save();

      // 1. Motion Velocity Vector (Optical Flow line)
      if (this.options.showVectors) {
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(agent.x, agent.y);
        ctx.lineTo(agent.x + agent.vx * 12, agent.y + agent.vy * 12);
        ctx.stroke();

        // Arrow head
        const angle = Math.atan2(agent.vy, agent.vx);
        const headlen = 4;
        ctx.fillStyle = 'rgba(56, 189, 248, 0.6)';
        ctx.beginPath();
        ctx.moveTo(agent.x + agent.vx * 12, agent.y + agent.vy * 12);
        ctx.lineTo(
          agent.x + agent.vx * 12 - headlen * Math.cos(angle - Math.PI / 6),
          agent.y + agent.vy * 12 - headlen * Math.sin(angle - Math.PI / 6)
        );
        ctx.lineTo(
          agent.x + agent.vx * 12 - headlen * Math.cos(angle + Math.PI / 6),
          agent.y + agent.vy * 12 - headlen * Math.sin(angle + Math.PI / 6)
        );
        ctx.fill();
      }

      // 2. Pedestrian Physical Representation (CCTV Overhead View)
      // Realistic ground drop shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.beginPath();
      ctx.ellipse(agent.x + 2, agent.y + 3, agent.radius * 1.3, agent.radius * 0.8, 0, 0, Math.PI * 2);
      ctx.fill();

      // Torso / Shoulders
      ctx.fillStyle = agent.isPanic ? '#ef4444' : (agent.isLoitering ? '#f59e0b' : agent.clothingColor);
      ctx.beginPath();
      const heading = Math.atan2(agent.vy, agent.vx) || 0;
      ctx.ellipse(agent.x, agent.y, agent.radius * 1.2, agent.radius * 0.75, heading + Math.PI / 2, 0, Math.PI * 2);
      ctx.fill();

      // Head
      ctx.fillStyle = '#ffe4e6';
      ctx.beginPath();
      ctx.arc(agent.x, agent.y - 1, agent.radius * 0.55, 0, Math.PI * 2);
      ctx.fill();

      // Privacy Face-Blur Mask (GDPR/Compliance feature)
      if (this.options.privacyMask) {
        ctx.fillStyle = 'rgba(30, 41, 59, 0.95)';
        ctx.beginPath();
        ctx.arc(agent.x, agent.y - 1, agent.radius * 0.7, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // 3. Pose Skeleton Overlay (AI keypoints)
      if (this.options.showPoseSkeletons) {
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.5)';
        ctx.lineWidth = 1;
        // Shoulder span
        const p1x = agent.x - Math.cos(heading) * 6;
        const p1y = agent.y - Math.sin(heading) * 6;
        const p2x = agent.x + Math.cos(heading) * 6;
        const p2y = agent.y + Math.sin(heading) * 6;
        ctx.beginPath();
        ctx.moveTo(p1x, p1y);
        ctx.lineTo(p2x, p2y);
        ctx.stroke();

        ctx.fillStyle = '#00ff9d';
        ctx.fillRect(p1x - 1, p1y - 1, 2, 2);
        ctx.fillRect(p2x - 1, p2y - 1, 2, 2);
      }

      // 4. YOLO AI Bounding Box & Target HUD
      if (this.options.showBoundingBoxes) {
        let boxColor = '#00ff9d'; // Normal
        if (agent.isPanic) boxColor = '#ff0055';
        else if (agent.inRestricted) boxColor = '#ef4444';
        else if (agent.isLoitering) boxColor = '#facc15';

        const bw = agent.radius * 2.8;
        const bh = agent.radius * 3.4;
        const bx = agent.x - bw / 2;
        const by = agent.y - bh / 2 - 2;

        // Tactical Corner Brackets
        ctx.strokeStyle = boxColor;
        ctx.lineWidth = 1.2;
        const bracketLen = 5;

        // Top-left
        ctx.beginPath();
        ctx.moveTo(bx, by + bracketLen);
        ctx.lineTo(bx, by);
        ctx.lineTo(bx + bracketLen, by);
        ctx.stroke();

        // Top-right
        ctx.beginPath();
        ctx.moveTo(bx + bw - bracketLen, by);
        ctx.lineTo(bx + bw, by);
        ctx.lineTo(bx + bw, by + bracketLen);
        ctx.stroke();

        // Bottom-left
        ctx.beginPath();
        ctx.moveTo(bx, by + bh - bracketLen);
        ctx.lineTo(bx, by + bh);
        ctx.lineTo(bx + bracketLen, by + bh);
        ctx.stroke();

        // Bottom-right
        ctx.beginPath();
        ctx.moveTo(bx + bw - bracketLen, by + bh);
        ctx.lineTo(bx + bw, by + bh);
        ctx.lineTo(bx + bw, by + bh - bracketLen);
        ctx.stroke();

        // AI Label Pill
        if (this.options.showPersonIds) {
          ctx.fillStyle = 'rgba(10, 14, 23, 0.85)';
          ctx.fillRect(bx, by - 12, bw + 18, 11);

          ctx.fillStyle = boxColor;
          ctx.font = 'bold 8px monospace';
          const confText = `${Math.floor(agent.confidence * 100)}%`;
          ctx.fillText(`PED#${agent.id} ${confText}`, bx + 2, by - 3);
        }

        // Anomaly Tagging
        if (agent.isPanic) {
          ctx.fillStyle = 'rgba(255, 0, 85, 0.9)';
          ctx.fillRect(bx, by + bh + 2, bw + 20, 11);
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 7.5px monospace';
          ctx.fillText('⚠ STAMPEDE', bx + 2, by + bh + 10);
        } else if (agent.inRestricted) {
          ctx.fillStyle = 'rgba(239, 68, 68, 0.9)';
          ctx.fillRect(bx, by + bh + 2, bw + 22, 11);
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 7.5px monospace';
          ctx.fillText('⛔ INTRUSION', bx + 2, by + bh + 10);
        } else if (agent.isLoitering) {
          ctx.fillStyle = 'rgba(245, 158, 11, 0.9)';
          ctx.fillRect(bx, by + bh + 2, bw + 24, 11);
          ctx.fillStyle = '#000000';
          ctx.font = 'bold 7.5px monospace';
          ctx.fillText(`⏱ LOITER ${Math.floor(agent.dwellTime)}s`, bx + 2, by + bh + 10);
        }
      }

      ctx.restore();
    }
  }

  renderHeatmapLayer(ctx, sector) {
    const w = sector.bounds.w;
    const h = sector.bounds.h;

    // Reset offscreen canvas
    this.heatCtx.clearRect(0, 0, w, h);

    // Splat radial gradients for every agent
    for (const agent of sector.agents) {
      this.heatCtx.drawImage(
        this.brush,
        agent.x - 45,
        agent.y - 45,
        90,
        90
      );
    }

    // Colorize alpha grayscale to Thermal Gradient Palette
    const imgData = this.heatCtx.getImageData(0, 0, w, h);
    const data = imgData.data;
    const len = data.length;

    for (let i = 0; i < len; i += 4) {
      const alpha = data[i + 3];
      if (alpha > 0) {
        const offset = alpha * 4;
        data[i] = this.palette[offset];
        data[i + 1] = this.palette[offset + 1];
        data[i + 2] = this.palette[offset + 2];
        data[i + 3] = (alpha * this.options.heatmapOpacity);
      }
    }

    this.heatCtx.putImageData(imgData, 0, 0);

    // Composite offscreen heatmap onto target canvas
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.drawImage(this.heatCanvas, 0, 0, w, h);
    ctx.restore();
  }

  /**
   * Fruin Standard & Threat Metrics
   */
  computeMetrics(sector) {
    const totalCount = sector.agents.length;
    // Calibrated area in m² (e.g. 180 m² per camera zone)
    const areaM2 = 180;
    const density = totalCount / areaM2;

    // Flow rate estimation (persons crossing per minute)
    let flowRate = Math.round(totalCount * 0.42 * 60 / 10);

    // Calculate Fruin Level of Service (LoS)
    let losGrade = 'A';
    let losColor = '#00ff9d';
    let losDescription = 'Free Circulation';

    if (density < 0.27) {
      losGrade = 'A';
      losColor = '#00ff9d';
      losDescription = 'Free Circulation';
    } else if (density < 0.43) {
      losGrade = 'B';
      losColor = '#38bdf8';
      losDescription = 'Normal Flow';
    } else if (density < 0.72) {
      losGrade = 'C';
      losColor = '#facc15';
      losDescription = 'Restricted Movement';
    } else if (density < 1.08) {
      losGrade = 'D';
      losColor = '#fb923c';
      losDescription = 'Dense Queuing';
    } else if (density < 2.17) {
      losGrade = 'E';
      losColor = '#f43f5e';
      losDescription = 'Severe Congestion';
    } else {
      losGrade = 'F';
      losColor = '#ff0055';
      losDescription = 'EXTREME CRUSH HAZARD';
    }

    // Crush Pressure Index (Density + Speed Inward Variance)
    let panicCount = 0;
    let loiteringCount = 0;
    let breachCount = 0;

    for (const a of sector.agents) {
      if (a.isPanic) panicCount++;
      if (a.isLoitering) loiteringCount++;
      if (a.inRestricted) breachCount++;
    }

    const crushPressure = Math.min(100, Math.round((density / 2.0) * 60 + panicCount * 8));
    
    // Overall Anomaly Threat Index (0-100)
    let threatScore = Math.min(100, Math.round(
      (panicCount * 25) +
      (breachCount * 35) +
      (sector.unattendedObjects.length * 20) +
      (loiteringCount * 10) +
      (density > 1.2 ? (density - 1.2) * 30 : 0)
    ));

    // Threat Level Classification
    let threatLevel = 'NORMAL (DEFCON 5)';
    let threatBadgeColor = 'emerald';
    if (threatScore > 75) {
      threatLevel = 'CRITICAL (DEFCON 1)';
      threatBadgeColor = 'red';
    } else if (threatScore > 45) {
      threatLevel = 'HIGH THREAT (DEFCON 2)';
      threatBadgeColor = 'orange';
    } else if (threatScore > 20) {
      threatLevel = 'ELEVATED SURGE (DEFCON 3)';
      threatBadgeColor = 'amber';
    }

    return {
      totalCount,
      density: density.toFixed(2),
      flowRate,
      losGrade,
      losColor,
      losDescription,
      crushPressure,
      threatScore,
      threatLevel,
      threatBadgeColor,
      panicCount,
      loiteringCount,
      breachCount,
      unattendedCount: sector.unattendedObjects.length
    };
  }

  /**
   * Real-Time Live Webcam Computer Vision & Threat Perception Engine
   */
  processWebcamFeed(videoEl, ctx, width, height) {
    if (!videoEl || videoEl.readyState < 2) return null;

    // Initialize motion buffer canvas on first call
    if (!this.motionCanvas) {
      this.motionCanvas = document.createElement('canvas');
      this.motionCanvas.width = 160;
      this.motionCanvas.height = 90;
      this.motionCtx = this.motionCanvas.getContext('2d', { willReadFrequently: true });
      this.prevWebcamPixels = null;
      this.trackedWebcamTargets = [];
      this.lastWebcamTripwireState = false;
      this.webcamThreatState = { active: false, type: 'NORMAL', message: '' };
    }

    const mWidth = this.motionCanvas.width;
    const mHeight = this.motionCanvas.height;

    // 1. Render base webcam video onto destination canvas
    ctx.save();
    ctx.drawImage(videoEl, 0, 0, width, height);

    // 2. Optical Flow & Motion Analysis on downscaled frame
    this.motionCtx.drawImage(videoEl, 0, 0, mWidth, mHeight);
    const currImageData = this.motionCtx.getImageData(0, 0, mWidth, mHeight);
    const currPixels = currImageData.data;

    let motionPixelCount = 0;
    let sumX = 0;
    let sumY = 0;
    let minX = mWidth, maxX = 0, minY = mHeight, maxY = 0;

    if (this.prevWebcamPixels) {
      const len = currPixels.length;
      for (let i = 0; i < len; i += 4) {
        // Pixel difference
        const dr = Math.abs(currPixels[i] - this.prevWebcamPixels[i]);
        const dg = Math.abs(currPixels[i+1] - this.prevWebcamPixels[i+1]);
        const db = Math.abs(currPixels[i+2] - this.prevWebcamPixels[i+2]);
        const delta = dr + dg + db;

        if (delta > 65) {
          const pixelIndex = i / 4;
          const px = pixelIndex % mWidth;
          const py = Math.floor(pixelIndex / mWidth);

          motionPixelCount++;
          sumX += px;
          sumY += py;

          if (px < minX) minX = px;
          if (px > maxX) maxX = px;
          if (py < minY) minY = py;
          if (py > maxY) maxY = py;
        }
      }
    }

    // Save current pixels for next frame comparison
    this.prevWebcamPixels = new Uint8ClampedArray(currPixels);

    // Compute active target metrics
    const scaleX = width / mWidth;
    const scaleY = height / mHeight;

    let detectedTargets = [];
    let isSurgeThreat = false;
    let isTripwireThreat = false;

    // Tripwire coordinates on webcam (vertical laser at center-right)
    const tripwireX = width * 0.55;

    if (motionPixelCount > 35) {
      // Valid motion cluster detected
      const avgX = (sumX / motionPixelCount) * scaleX;
      const avgY = (sumY / motionPixelCount) * scaleY;
      const boxW = Math.max(120, (maxX - minX + 18) * scaleX);
      const boxH = Math.max(180, (maxY - minY + 24) * scaleY);
      const boxX = Math.max(10, Math.min(width - boxW - 10, avgX - boxW / 2));
      const boxY = Math.max(10, Math.min(height - boxH - 10, avgY - boxH / 2));

      // Calculate motion velocity intensity
      const motionIntensity = motionPixelCount / (mWidth * mHeight);
      isSurgeThreat = motionIntensity > 0.16; // Rapid erratic movement / surge

      // Check Virtual Tripwire Crossing
      if (boxX < tripwireX && (boxX + boxW) > tripwireX) {
        isTripwireThreat = true;
      }

      detectedTargets.push({
        id: '01',
        x: boxX,
        y: boxY,
        w: boxW,
        h: boxH,
        centerX: avgX,
        centerY: avgY,
        intensity: motionIntensity,
        confidence: 0.94 + Math.min(0.05, motionIntensity),
        isThreat: isSurgeThreat || isTripwireThreat
      });

      this.trackedWebcamTargets = detectedTargets;
    } else if (this.trackedWebcamTargets.length > 0) {
      // Retain stationary presence if motion paused (loitering)
      detectedTargets = this.trackedWebcamTargets;
    }

    // 3. Render Virtual Tripwire on Webcam
    if (this.options.showTripwires) {
      const time = Date.now() / 1000;
      const pulse = 0.5 + Math.sin(time * 8) * 0.4;
      const lineColor = isTripwireThreat ? 'rgba(255, 0, 85, 0.95)' : `rgba(0, 240, 255, ${0.4 + pulse * 0.4})`;

      ctx.save();
      ctx.strokeStyle = lineColor;
      ctx.lineWidth = isTripwireThreat ? 3 : 2;
      ctx.beginPath();
      ctx.moveTo(tripwireX, 20);
      ctx.lineTo(tripwireX, height - 20);
      ctx.stroke();

      // Tripwire HUD Tag
      ctx.fillStyle = isTripwireThreat ? '#ff0055' : '#00f0ff';
      ctx.font = 'bold 10px monospace';
      ctx.fillText(
        isTripwireThreat ? '⛔ TRIPWIRE BREACH DETECTED' : '⚡ SENSOR TRIPWIRE TR-LIVE',
        tripwireX + 8,
        50
      );
      ctx.restore();
    }

    // 4. Render Thermal Heatmap on Webcam
    if (this.options.showHeatmap && detectedTargets.length > 0) {
      this.heatCtx.clearRect(0, 0, width, height);
      for (const t of detectedTargets) {
        this.heatCtx.drawImage(this.brush, t.centerX - 80, t.centerY - 80, 160, 160);
      }
      const imgData = this.heatCtx.getImageData(0, 0, width, height);
      const data = imgData.data;
      for (let i = 0; i < data.length; i += 4) {
        const alpha = data[i + 3];
        if (alpha > 0) {
          const offset = alpha * 4;
          data[i] = this.palette[offset];
          data[i + 1] = this.palette[offset + 1];
          data[i + 2] = this.palette[offset + 2];
          data[i + 3] = (alpha * this.options.heatmapOpacity);
        }
      }
      this.heatCtx.putImageData(imgData, 0, 0);
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.drawImage(this.heatCanvas, 0, 0, width, height);
      ctx.restore();
    }

    // 5. Render YOLO Tactical Bounding Box & Target Brackets
    if (this.options.showBoundingBoxes) {
      for (const t of detectedTargets) {
        ctx.save();
        let boxColor = '#00ff9d'; // Normal
        if (isTripwireThreat) boxColor = '#ff0055';
        else if (isSurgeThreat) boxColor = '#f59e0b';

        // Tactical Corner Brackets
        ctx.strokeStyle = boxColor;
        ctx.lineWidth = 2;
        const bLen = 14;

        // Top Left
        ctx.beginPath();
        ctx.moveTo(t.x, t.y + bLen);
        ctx.lineTo(t.x, t.y);
        ctx.lineTo(t.x + bLen, t.y);
        ctx.stroke();

        // Top Right
        ctx.beginPath();
        ctx.moveTo(t.x + t.w - bLen, t.y);
        ctx.lineTo(t.x + t.w, t.y);
        ctx.lineTo(t.x + t.w, t.y + bLen);
        ctx.stroke();

        // Bottom Left
        ctx.beginPath();
        ctx.moveTo(t.x, t.y + t.h - bLen);
        ctx.lineTo(t.x, t.y + t.h);
        ctx.lineTo(t.x + bLen, t.y + t.h);
        ctx.stroke();

        // Bottom Right
        ctx.beginPath();
        ctx.moveTo(t.x + t.w - bLen, t.y + t.h);
        ctx.lineTo(t.x + t.w, t.y + t.h);
        ctx.lineTo(t.x + t.w, t.y + t.h - bLen);
        ctx.stroke();

        // Header Identification Pill
        ctx.fillStyle = 'rgba(10, 14, 23, 0.9)';
        ctx.fillRect(t.x, t.y - 18, Math.min(t.w, 180), 16);
        ctx.fillStyle = boxColor;
        ctx.font = 'bold 9px monospace';
        const confStr = `${Math.round(t.confidence * 100)}%`;
        ctx.fillText(`TARGET #${t.id} [${confStr}] // HUMAN`, t.x + 4, t.y - 6);

        // Motion Vector Arrow
        if (this.options.showVectors) {
          ctx.strokeStyle = '#00f0ff';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(t.centerX, t.centerY);
          ctx.lineTo(t.centerX + (isSurgeThreat ? 35 : 15), t.centerY - 10);
          ctx.stroke();
        }

        // Face Privacy Blur Mask
        if (this.options.privacyMask) {
          ctx.fillStyle = 'rgba(15, 23, 42, 0.96)';
          const faceW = t.w * 0.45;
          const faceH = t.h * 0.35;
          const faceX = t.x + (t.w - faceW) / 2;
          const faceY = t.y + 10;
          ctx.fillRect(faceX, faceY, faceW, faceH);
          ctx.strokeStyle = '#00f0ff';
          ctx.strokeRect(faceX, faceY, faceW, faceH);
          ctx.fillStyle = '#00f0ff';
          ctx.font = '8px monospace';
          ctx.fillText('ANONYMIZED', faceX + 4, faceY + faceH / 2 + 3);
        }

        // Threat Alert Banner
        if (isTripwireThreat) {
          ctx.fillStyle = '#ff0055';
          ctx.fillRect(t.x, t.y + t.h + 2, 160, 14);
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 8.5px monospace';
          ctx.fillText('⛔ PERIMETER INTRUSION', t.x + 4, t.y + t.h + 12);
        } else if (isSurgeThreat) {
          ctx.fillStyle = '#f59e0b';
          ctx.fillRect(t.x, t.y + t.h + 2, 150, 14);
          ctx.fillStyle = '#000000';
          ctx.font = 'bold 8.5px monospace';
          ctx.fillText('⚠ HIGH-SPEED MOTION', t.x + 4, t.y + t.h + 12);
        }

        ctx.restore();
      }
    }

    // 6. Night Vision Tint if enabled
    if (this.options.nightVisionMode) {
      ctx.fillStyle = 'rgba(0, 255, 120, 0.12)';
      ctx.fillRect(0, 0, width, height);
    }

    ctx.restore();

    // Compute live metrics from webcam feed
    const count = detectedTargets.length;
    const density = (count * 0.35).toFixed(2);
    let threatScore = 5;
    let threatLevel = 'NORMAL (DEFCON 5)';
    let threatBadgeColor = 'emerald';
    let threatReason = null;

    if (isTripwireThreat) {
      threatScore = 95;
      threatLevel = 'CRITICAL (DEFCON 1)';
      threatBadgeColor = 'red';
      threatReason = 'TRIPWIRE BREACH DETECTED ON WEBCAM';
    } else if (isSurgeThreat) {
      threatScore = 65;
      threatLevel = 'HIGH THREAT (DEFCON 2)';
      threatBadgeColor = 'orange';
      threatReason = 'RAPID MOTION SURGE DETECTED ON WEBCAM';
    } else if (count > 0) {
      threatScore = 15;
    }

    return {
      totalCount: count,
      density,
      flowRate: count > 0 ? 32 : 0,
      losGrade: count > 1 ? 'B' : 'A',
      losColor: '#00ff9d',
      losDescription: count > 0 ? 'Live Optical Detection' : 'Zero Subjects in Frame',
      crushPressure: isSurgeThreat ? 78 : 12,
      threatScore,
      threatLevel,
      threatBadgeColor,
      isThreatActive: isTripwireThreat || isSurgeThreat,
      threatReason
    };
  }
}

window.aiVision = new AIVisionEngine();

