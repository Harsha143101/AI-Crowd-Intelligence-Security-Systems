/**
 * AEGIS AI CROWD INTELLIGENCE SYSTEM
 * Autonomous Pedestrian Dynamics & Multi-Sector Simulation Engine
 * High-performance 60FPS Social Force & Crowd Anomaly Model
 */

class PedestrianAgent {
  constructor(id, x, y, options = {}) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.vx = (Math.random() - 0.5) * 0.8;
    this.vy = (Math.random() - 0.5) * 0.8;
    this.radius = options.radius || (6 + Math.random() * 2);
    this.baseSpeed = options.speed || (1.1 + Math.random() * 0.7);
    this.speedMax = this.baseSpeed;
    this.targetX = options.targetX || x;
    this.targetY = options.targetY || y;
    this.type = options.type || 'commuter'; // commuter, guard, suspicious, visitor
    this.gender = Math.random() > 0.48 ? 'M' : 'F';
    this.age = Math.floor(18 + Math.random() * 55);
    this.clothingColor = options.clothingColor || this.getRandomClothingColor();
    
    // Anomaly & tracking states
    this.isPanic = false;
    this.panicIntensity = 0;
    this.isLoitering = false;
    this.dwellTime = 0;
    this.inRestricted = false;
    this.confidence = 0.92 + Math.random() * 0.07;
    
    // Breadcrumbs trail for velocity vectors
    this.history = [];
    this.historyMaxLength = 6;
  }

  getRandomClothingColor() {
    const palette = ['#38bdf8', '#fb7185', '#34d399', '#facc15', '#a78bfa', '#cbd5e1', '#f97316', '#64748b'];
    return palette[Math.floor(Math.random() * palette.length)];
  }

  update(bounds, obstacles, otherAgents, attractions) {
    // Record position for motion history
    if (Math.random() > 0.4) {
      this.history.push({ x: this.x, y: this.y });
      if (this.history.length > this.historyMaxLength) this.history.shift();
    }

    // Desired directional force toward target
    let dx = this.targetX - this.x;
    let dy = this.targetY - this.y;
    let distToTarget = Math.hypot(dx, dy);

    // If reached target, pick next attraction point
    if (distToTarget < 25 && attractions && attractions.length > 0) {
      const next = attractions[Math.floor(Math.random() * attractions.length)];
      this.targetX = next.x + (Math.random() - 0.5) * 40;
      this.targetY = next.y + (Math.random() - 0.5) * 40;
      dx = this.targetX - this.x;
      dy = this.targetY - this.y;
      distToTarget = Math.hypot(dx, dy);
    }

    let fx = 0;
    let fy = 0;

    if (distToTarget > 0.001) {
      const currentMax = this.isPanic ? this.baseSpeed * 2.8 : (this.isLoitering ? 0.15 : this.baseSpeed);
      const desiredVx = (dx / distToTarget) * currentMax;
      const desiredVy = (dy / distToTarget) * currentMax;
      
      // Acceleration relaxation
      fx += (desiredVx - this.vx) * 0.25;
      fy += (desiredVy - this.vy) * 0.25;
    }

    // Social repulsive force between pedestrians (Helbing social force model simplified)
    const checkRadius = 35;
    for (let i = 0; i < otherAgents.length; i++) {
      const other = otherAgents[i];
      if (other.id === this.id) continue;

      const sepX = this.x - other.x;
      const sepY = this.y - other.y;
      const d = Math.hypot(sepX, sepY);

      if (d > 0.001 && d < checkRadius) {
        const comfortDist = (this.radius + other.radius) * 1.8;
        const repFactor = Math.exp((comfortDist - d) / 10);
        fx += (sepX / d) * repFactor * 0.6;
        fy += (sepY / d) * repFactor * 0.6;

        // Panic contagion: fear spreads to nearby agents
        if (other.isPanic && !this.isPanic && Math.random() < 0.08) {
          this.triggerPanic(other.x, other.y);
        }
      }
    }

    // Obstacle repulsive force
    for (const obs of obstacles) {
      // Circle or rectangle obstacle
      if (obs.type === 'circle') {
        const ox = this.x - obs.x;
        const oy = this.y - obs.y;
        const od = Math.hypot(ox, oy);
        const minDist = this.radius + obs.radius + 6;
        if (od < minDist && od > 0.001) {
          const push = (minDist - od) * 0.5;
          fx += (ox / od) * push;
          fy += (oy / od) * push;
        }
      } else if (obs.type === 'rect') {
        // Nearest point on rect
        const nearestX = Math.max(obs.x, Math.min(this.x, obs.x + obs.w));
        const nearestY = Math.max(obs.y, Math.min(this.y, obs.y + obs.h));
        const rx = this.x - nearestX;
        const ry = this.y - nearestY;
        const rd = Math.hypot(rx, ry);
        const minDist = this.radius + 6;
        if (rd < minDist && rd > 0.001) {
          const push = (minDist - rd) * 0.6;
          fx += (rx / rd) * push;
          fy += (ry / rd) * push;
        }
      }
    }

    // Apply forces
    this.vx += fx;
    this.vy += fy;

    // Speed limiter
    const speed = Math.hypot(this.vx, this.vy);
    const maxAllowed = this.isPanic ? this.baseSpeed * 3.2 : this.baseSpeed * 1.3;
    if (speed > maxAllowed && speed > 0.001) {
      this.vx = (this.vx / speed) * maxAllowed;
      this.vy = (this.vy / speed) * maxAllowed;
    }

    // Update coordinates
    this.x += this.vx;
    this.y += this.vy;

    // Check dwell time for loitering
    if (speed < 0.3) {
      this.dwellTime += 1 / 60;
      if (this.dwellTime > 15) {
        this.isLoitering = true;
      }
    } else {
      this.dwellTime = Math.max(0, this.dwellTime - 0.5 / 60);
      if (this.dwellTime < 5) this.isLoitering = false;
    }

    // Perimeter boundary wrap or bounce
    if (this.x < 15) { this.x = 15; this.vx *= -0.5; }
    if (this.x > bounds.w - 15) { this.x = bounds.w - 15; this.vx *= -0.5; }
    if (this.y < 15) { this.y = 15; this.vy *= -0.5; }
    if (this.y > bounds.h - 15) { this.y = bounds.h - 15; this.vy *= -0.5; }
  }

  triggerPanic(fromX, fromY) {
    this.isPanic = true;
    this.panicIntensity = 1.0;
    // Flee away from panic epicenter
    const fleeX = this.x - fromX;
    const fleeY = this.y - fromY;
    const dist = Math.hypot(fleeX, fleeY) || 1;
    this.targetX = this.x + (fleeX / dist) * 450 + (Math.random() - 0.5) * 100;
    this.targetY = this.y + (fleeY / dist) * 450 + (Math.random() - 0.5) * 100;
  }
}

/**
 * Camera Sector Simulation Definition
 */
class CameraSector {
  constructor(config) {
    this.id = config.id;
    this.name = config.name;
    this.location = config.location;
    this.fov = config.fov || '85° Wide Angle';
    this.resolution = '3840x2160 UHD @ 60 FPS';
    this.bitrate = '14.2 Mbps H.265';
    this.status = 'ONLINE';
    this.bounds = { w: 960, h: 540 };
    
    this.agents = [];
    this.obstacles = config.obstacles || [];
    this.attractions = config.attractions || [];
    this.restrictedZones = config.restrictedZones || [];
    this.tripwires = config.tripwires || [];
    this.unattendedObjects = [];
    
    this.targetPopulation = config.initialAgents || 60;
    this.initAgents();
  }

  initAgents() {
    this.agents = [];
    for (let i = 0; i < this.targetPopulation; i++) {
      const x = 30 + Math.random() * (this.bounds.w - 60);
      const y = 30 + Math.random() * (this.bounds.h - 60);
      const target = this.attractions[Math.floor(Math.random() * this.attractions.length)] || { x: 480, y: 270 };
      
      const agent = new PedestrianAgent(
        `${this.id.split('-')[1]}-${(100 + i).toString().slice(1)}`,
        x, y,
        {
          targetX: target.x,
          targetY: target.y,
          speed: 0.9 + Math.random() * 0.8
        }
      );
      this.agents.push(agent);
    }
  }

  addAgents(count) {
    const currentLen = this.agents.length;
    for (let i = 0; i < count; i++) {
      const spawnSide = Math.floor(Math.random() * 4);
      let x = 50, y = 50;
      if (spawnSide === 0) { x = Math.random() * this.bounds.w; y = 20; }
      else if (spawnSide === 1) { x = this.bounds.w - 20; y = Math.random() * this.bounds.h; }
      else if (spawnSide === 2) { x = Math.random() * this.bounds.w; y = this.bounds.h - 20; }
      else { x = 20; y = Math.random() * this.bounds.h; }

      const target = this.attractions[Math.floor(Math.random() * this.attractions.length)] || { x: 480, y: 270 };
      const agent = new PedestrianAgent(
        `${this.id.split('-')[1]}-${currentLen + i + 1}`,
        x, y,
        {
          targetX: target.x,
          targetY: target.y,
          speed: 1.2 + Math.random() * 0.8
        }
      );
      this.agents.push(agent);
    }
  }

  update() {
    // Update all agents
    for (let i = 0; i < this.agents.length; i++) {
      this.agents[i].update(this.bounds, this.obstacles, this.agents, this.attractions);
      
      // Check restricted zone violations
      this.agents[i].inRestricted = false;
      for (const rz of this.restrictedZones) {
        if (
          this.agents[i].x >= rz.x &&
          this.agents[i].x <= rz.x + rz.w &&
          this.agents[i].y >= rz.y &&
          this.agents[i].y <= rz.y + rz.h
        ) {
          this.agents[i].inRestricted = true;
          break;
        }
      }
    }

    // Update unattended objects (e.g. countdown timer for abandoned bags)
    for (const obj of this.unattendedObjects) {
      obj.age += 1 / 60;
    }
  }
}

/**
 * Crowd Simulation Master Engine
 */
class CrowdSimulationEngine {
  constructor() {
    this.sectors = {};
    this.activeSectorId = 'CAM-01';
    this.isPaused = false;
    this.activeIncident = null;
    this.uploadedMedia = null;
    this.isUploadedMode = false;
    
    this.initSectors();
  }

  initSectors() {
    // CAM-01: Terminal Concourse (High-Traffic Commuter Interchange)
    this.sectors['CAM-01'] = new CameraSector({
      id: 'CAM-01',
      name: 'CENTRAL CONCOURSE - TERMINAL A',
      location: 'Level 2 Main Transit Hub',
      initialAgents: 75,
      obstacles: [
        { type: 'rect', x: 420, y: 210, w: 120, h: 120, name: 'Info Hub & Digital Kiosk' },
        { type: 'circle', x: 200, y: 150, radius: 24, name: 'Pillar A1' },
        { type: 'circle', x: 760, y: 150, radius: 24, name: 'Pillar A2' },
        { type: 'circle', x: 200, y: 390, radius: 24, name: 'Pillar B1' },
        { type: 'circle', x: 760, y: 390, radius: 24, name: 'Pillar B2' },
        { type: 'rect', x: 280, y: 440, w: 140, h: 25, name: 'Waiting Benches' },
        { type: 'rect', x: 540, y: 440, w: 140, h: 25, name: 'Waiting Benches' }
      ],
      attractions: [
        { x: 900, y: 80, name: 'Gate 1-12' },
        { x: 900, y: 460, name: 'Gate 13-24' },
        { x: 60, y: 270, name: 'Train Transfer Concourse' },
        { x: 480, y: 60, name: 'Baggage Claim Express' },
        { x: 480, y: 480, name: 'Ground Transport & Taxis' },
        { x: 480, y: 270, name: 'Flight Display Board' }
      ],
      tripwires: [
        { x1: 720, y1: 40, x2: 720, y2: 500, label: 'SECTOR-A DENSITY TRIPWIRE' }
      ]
    });

    // CAM-02: Stadium Entry Chokepoint (Funnel & Bottleneck)
    this.sectors['CAM-02'] = new CameraSector({
      id: 'CAM-02',
      name: 'GATE B - SECURITY TURNSTILES',
      location: 'Arena North Entrance Promenade',
      initialAgents: 85,
      obstacles: [
        // Funnel barriers forcing crowd into turnstiles
        { type: 'rect', x: 0, y: 0, w: 400, h: 180, name: 'Outer Barrier Wall North' },
        { type: 'rect', x: 0, y: 360, w: 400, h: 180, name: 'Outer Barrier Wall South' },
        { type: 'rect', x: 500, y: 160, w: 20, h: 60, name: 'Turnstile #1' },
        { type: 'rect', x: 500, y: 240, w: 20, h: 60, name: 'Turnstile #2' },
        { type: 'rect', x: 500, y: 320, w: 20, h: 60, name: 'Turnstile #3' }
      ],
      attractions: [
        { x: 460, y: 270, name: 'Queue Entry Buffer' },
        { x: 580, y: 270, name: 'Ticket Scanner' },
        { x: 880, y: 270, name: 'Grandstand Arena Entrance' }
      ],
      tripwires: [
        { x1: 540, y1: 150, x2: 540, y2: 390, label: 'INGRESS FLOW VELOCITY LINE' }
      ]
    });

    // CAM-03: City Center Plaza (Open Public Gathering Area)
    this.sectors['CAM-03'] = new CameraSector({
      id: 'CAM-03',
      name: 'CIVIC PLAZA - FOUNTAIN COURT',
      location: 'Public Gathering & Metro Concourse',
      initialAgents: 70,
      obstacles: [
        { type: 'circle', x: 480, y: 270, radius: 70, name: 'Civic Fountain Memorial' },
        { type: 'rect', x: 120, y: 100, w: 100, h: 50, name: 'Cafe Seating Terrace' },
        { type: 'rect', x: 740, y: 390, w: 100, h: 50, name: 'Sculpture Garden' }
      ],
      attractions: [
        { x: 100, y: 450, name: 'Metro Exit 4' },
        { x: 860, y: 90, name: 'Shopping Arcade' },
        { x: 480, y: 150, name: 'North Promenade' },
        { x: 480, y: 390, name: 'South Promenade' },
        { x: 380, y: 270, name: 'Plaza Fountain Gathering' },
        { x: 580, y: 270, name: 'Street Performer Spot' }
      ]
    });

    // CAM-04: Restricted Perimeter Corridor (High Security)
    this.sectors['CAM-04'] = new CameraSector({
      id: 'CAM-04',
      name: 'RESTRICTED CORRIDOR - SECTOR 7G',
      location: 'Server Vault & Power Substation Access',
      initialAgents: 25,
      obstacles: [
        { type: 'rect', x: 0, y: 0, w: 960, h: 90, name: 'Reinforced Perimeter Wall' },
        { type: 'rect', x: 0, y: 450, w: 960, h: 90, name: 'Security Perimeter Fence' },
        { type: 'rect', x: 460, y: 100, w: 40, h: 120, name: 'Control Pillar 1' },
        { type: 'rect', x: 460, y: 320, w: 40, h: 120, name: 'Control Pillar 2' }
      ],
      attractions: [
        { x: 100, y: 270, name: 'Checkpoint Alpha' },
        { x: 860, y: 270, name: 'Secure Vault Gate' }
      ],
      restrictedZones: [
        { x: 600, y: 120, w: 320, h: 300, name: 'ZONE DELTA: AUTHORIZED CREDENTIALS ONLY' }
      ],
      tripwires: [
        { x1: 580, y1: 100, x2: 580, y2: 440, label: 'LASER TRIPWIRE TR-702' }
      ]
    });
  }

  getActiveSector() {
    return this.sectors[this.activeSectorId];
  }

  setActiveSector(id) {
    if (this.sectors[id]) {
      this.activeSectorId = id;
      if (window.tacticalAudio) {
        window.tacticalAudio.playRadarPing();
      }
    }
  }

  updateAll() {
    if (this.isPaused) return;
    for (const key in this.sectors) {
      this.sectors[key].update();
    }
  }

  // Tactical Injections
  triggerScenario(type) {
    const sec = this.getActiveSector();
    this.activeIncident = type;

    switch (type) {
      case 'surge':
        // Spawn 40 high-speed incoming pedestrians
        sec.addAgents(40);
        if (window.tacticalAudio) {
          window.tacticalAudio.playWarningBeep();
          window.tacticalAudio.speak(`Crowd Surge Alert triggered in ${sec.name}. Ingress rate increasing.`);
        }
        break;

      case 'panic':
        // Epicenter in center of active sector
        const epiX = sec.bounds.w / 2 + (Math.random() - 0.5) * 100;
        const epiY = sec.bounds.h / 2 + (Math.random() - 0.5) * 100;
        sec.agents.forEach(a => {
          const dist = Math.hypot(a.x - epiX, a.y - epiY);
          if (dist < 260) {
            a.triggerPanic(epiX, epiY);
          }
        });
        if (window.tacticalAudio) {
          window.tacticalAudio.playCriticalAlarm();
          window.tacticalAudio.speak(`Critical Alert: Panic stampede detected in ${sec.name}. Rapid crowd divergence detected.`);
        }
        break;

      case 'baggage':
        // Drop an unattended suspicious bag
        const bagX = sec.bounds.w * 0.45 + (Math.random() - 0.5) * 120;
        const bagY = sec.bounds.h * 0.55 + (Math.random() - 0.5) * 120;
        sec.unattendedObjects.push({
          id: `OBJ-${Math.floor(Math.random() * 9000 + 1000)}`,
          x: bagX,
          y: bagY,
          type: 'Unattended Luggage / Backpack',
          age: 0,
          threatLevel: 'HIGH',
          ownerDistance: 85
        });
        if (window.tacticalAudio) {
          window.tacticalAudio.playWarningBeep();
          window.tacticalAudio.speak(`Warning: Unattended object detected in ${sec.name}. Monitoring dwell timer.`);
        }
        break;

      case 'breach':
        // Perimeter intrusion on Sector 7 or active sector
        if (this.activeSectorId !== 'CAM-04') {
          this.setActiveSector('CAM-04');
        }
        const s4 = this.sectors['CAM-04'];
        const intruder = new PedestrianAgent('INTRUDER-99', 400, 270, {
          targetX: 800,
          targetY: 270,
          speed: 2.2,
          type: 'suspicious',
          clothingColor: '#ef4444'
        });
        s4.agents.push(intruder);
        if (window.tacticalAudio) {
          window.tacticalAudio.playCriticalAlarm();
          window.tacticalAudio.speak(`High Priority Incursion: Restricted perimeter tripwire violated in Sector 7G.`);
        }
        break;

      case 'loitering':
        // Force 3 agents to stand stationary in high-security zone
        for (let i = 0; i < Math.min(3, sec.agents.length); i++) {
          sec.agents[i].isLoitering = true;
          sec.agents[i].dwellTime = 25;
          sec.agents[i].vx = 0.05;
          sec.agents[i].vy = 0.05;
        }
        if (window.tacticalAudio) {
          window.tacticalAudio.playWarningBeep();
          window.tacticalAudio.speak(`Suspicious Loitering detected. Static dwell time threshold exceeded.`);
        }
        break;

      case 'clear':
        // Reset sector to standard baseline
        sec.initAgents();
        sec.unattendedObjects = [];
        this.activeIncident = null;
        if (window.tacticalAudio) {
          window.tacticalAudio.playClick();
          window.tacticalAudio.speak(`Sector reset to standard baseline operations.`);
        }
        break;
    }
  }
}

window.crowdEngine = new CrowdSimulationEngine();
