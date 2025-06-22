/* Sky spy */

/*
   Four phases of GPS acquision:

   search for sky -- not enough sattelites
   wait for signal -- have 5 sattelites with good SNR
     .. good snr is like 26, with maybe 24 time goes up twice, maybe 22 for three times, less than that and many times more
   2D fix
   3D fix

   How to tell good signal
   # satelites
   hdop
   diff to barometer altitude
   variations in diff to barometer altitude

*/

/* fmt library v0.2.3 */
let fmt = {
  icon_alt : "\0\x08\x1a\1\x00\x00\x00\x20\x30\x78\x7C\xFE\xFF\x00\xC3\xE7\xFF\xDB\xC3\xC3\xC3\xC3\x00\x00\x00\x00\x00\x00\x00\x00",
  icon_m : "\0\x08\x1a\1\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\xC3\xE7\xFF\xDB\xC3\xC3\xC3\xC3\x00\x00\x00\x00\x00\x00\x00\x00",
  icon_km : "\0\x08\x1a\1\xC3\xC6\xCC\xD8\xF0\xD8\xCC\xC6\xC3\x00\xC3\xE7\xFF\xDB\xC3\xC3\xC3\xC3\x00\x00\x00\x00\x00\x00\x00\x00",
  icon_kph : "\0\x08\x1a\1\xC3\xC6\xCC\xD8\xF0\xD8\xCC\xC6\xC3\x00\xC3\xE7\xFF\xDB\xC3\xC3\xC3\xC3\x00\xFF\x00\xC3\xC3\xFF\xC3\xC3",
  icon_c : "\0\x08\x1a\1\x00\x00\x60\x90\x90\x60\x00\x7F\xFF\xC0\xC0\xC0\xC0\xC0\xFF\x7F\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00",
  icon_hpa : "\x00\x08\x16\x01\x00\x80\xb0\xc8\x88\x88\x88\x00\xf0\x88\x84\x84\x88\xf0\x80\x8c\x92\x22\x25\x19\x00\x00",
  icon_9 : "\x00\x08\x16\x01\x00\x00\x00\x00\x38\x44\x44\x4c\x34\x04\x04\x38\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00",
  icon_10 : "\x00\x08\x16\x01\x00\x08\x18\x28\x08\x08\x08\x00\x00\x18\x24\x24\x24\x24\x18\x00\x00\x00\x00\x00\x00\x00",

  /* 0 .. DD.ddddd
     1 .. DD MM.mmm'
     2 .. DD MM'ss"
  */
  geo_mode : 1,

  init: function() {},
  fmtDist: function(km) {
    if (km >= 1.0) return km.toFixed(1) + this.icon_km;
    return (km*1000).toFixed(0) + this.icon_m;
  },
  fmtSteps: function(n) { return this.fmtDist(0.001 * 0.719 * n); },
  fmtAlt: function(m) { return m.toFixed(0) + this.icon_alt; },
  fmtTemp: function(c) { return c.toFixed(1) + this.icon_c; },
  fmtPress: function(p) {
    if (p < 900 || p > 1100)
      return p.toFixed(0) + this.icon_hpa;
    if (p < 1000) {
      p -= 900;
      return this.icon_9 + this.add0(p.toFixed(0)) + this.icon_hpa;
    }
    p -= 1000;
    return this.icon_10 + this.add0(p.toFixed(0)) + this.icon_hpa;
  },
  draw_dot : 1,
  add0: function(i) {
    if (i > 9) {
      return ""+i;
    } else {
      return "0"+i;
    }
  },
  fmtTOD: function(now) {
    this.draw_dot = !this.draw_dot;
    let dot = ":";
    if (!this.draw_dot)
      dot = ".";
    return now.getHours() + dot + this.add0(now.getMinutes());
  },
  fmtNow: function() { return this.fmtTOD(new Date()); },
  fmtTimeDiff: function(d) {
    if (d < 180)
      return ""+d.toFixed(0);
    d = d/60;
    return ""+d.toFixed(0)+"m";
  },
  fmtAngle: function(x) {
    switch (this.geo_mode) {
    case 0:
      return "" + x;
    case 1: {
      let d = Math.floor(x);
      let m = x - d;
      m = m*60;
      return "" + d + " " + m.toFixed(3) + "'";
    }
    case 2: {
      let d = Math.floor(x);
      let m = x - d;
      m = m*60;
      let mf = Math.floor(m);
      let s = m - mf;
      s = s*60;
      return "" + d + " " + mf + "'" + s.toFixed(0) + '"';
    }
    }
    return "bad mode?";
  },
  fmtPos: function(pos) {
    let x = pos.lat;
    let c = "N";
    if (x<0) {
      c = "S";
      x = -x;
    }
    let s = c+this.fmtAngle(x) + "\n";
    x = pos.lon;
    c = "E";
    if (x<0) {
      c = "W";
      x = -x;
    }
    return s + c + this.fmtAngle(x);
  },
  fmtFix: function(fix, t) {
    if (fix && fix.fix && fix.lat) {
      return this.fmtSpeed(fix.speed) + " " +
        this.fmtAlt(fix.alt);
    } else {
      return "N/FIX " + this.fmtTimeDiff(t);
    }
  },
  fmtSpeed: function(kph) {
    return kph.toFixed(1) + this.icon_kph;
  },
  radians: function(a) { return a*Math.PI/180; },
  degrees: function(a) { return a*180/Math.PI; },
  // distance between 2 lat and lons, in meters, Mean Earth Radius = 6371km
  // https://www.movable-type.co.uk/scripts/latlong.html
  // (Equirectangular approximation)
  // returns value in meters
  distance: function(a,b) {
    var x = this.radians(b.lon-a.lon) * Math.cos(this.radians((a.lat+b.lat)/2));
    var y = this.radians(b.lat-a.lat);
    return Math.sqrt(x*x + y*y) * 6371000;
  },
  // thanks to waypointer
  bearing: function(a,b) {
    var delta = this.radians(b.lon-a.lon);
    var alat = this.radians(a.lat);
    var blat = this.radians(b.lat);
    var y = Math.sin(delta) * Math.cos(blat);
    var x = Math.cos(alat) * Math.sin(blat) -
        Math.sin(alat)*Math.cos(blat)*Math.cos(delta);
    return Math.round(this.degrees(Math.atan2(y, x)));
  },
};

/* gps library v0.2.0 */
/* Sensor base class */
function Sensor() {
  this.state = {};
}

Sensor.prototype.init = function() {};
Sensor.prototype.start = function() {};
Sensor.prototype.stop = function() {};

/* Gps class derived from Sensor */
function Gps() {
  Sensor.call(this);
  this.emulator = -1;
  this.gps_start = -1;
}

Gps.prototype = Object.create(Sensor.prototype);
Gps.prototype.constructor = Gps;

Gps.prototype.init = function(x) {
  print("Gps init");
  this.emulator = (process.env.BOARD === "EMSCRIPTEN" || process.env.BOARD === "EMSCRIPTEN2") ? 1 : 0;
};

Gps.prototype.onGps = function(f) {
  let fix = this.getGPSFix();
  f(fix);
  this.state.timeout = setTimeout(this.onGps.bind(this), 1000, f);
};

Gps.prototype.offGps = function() {
  clearTimeout(this.state.timeout);
};

Gps.prototype.getGPSFix = function() {
  if (!this.emulator)
    return Bangle.getGPSFix();

  let fix = {
    fix: 1,
    lat: 50,
    lon: 14 - (getTime() - this.gps_start) / 1000, // Go West!
    alt: 200,
    speed: 5,
    course: 30,
    time: Date(),
    satellites: 5,
    hdop: 12
  };

  return fix;
};

Gps.prototype.start = function() {
  Bangle.setGPSPower(1, "libgps");
  this.gps_start = getTime();
};

Gps.prototype.stop = function() {
  Bangle.setGPSPower(0, "libgps");
};

// Example usage:
// let gps = new Gps();
// gps.init();
// gps.start();
// gps.onGps((fix) => print(fix));

/* ui library 0.2.0 */
//Bangle.on("drag", (b) => ui.touchHandler(b));
let ui = {
  display: 0,
  numScreens: 2,
  name: ".oO busy",
  screens: [ "Screen 1", "Screen 2", "Screen 3", "Screen 4", "Screen 5", "Screen 6" ],
  help: [ "F1", "F2", "<", ">" ],
  clear: function() {
    g.reset()
      .setColor(g.theme.bg)
      .fillRect(0, this.wi, this.w, this.y2)
      .setColor(g.theme.fg);
  },
  draw: function(screen) {},
  drawMsg: function(msg) {
    this.clear();
    g.setFont("Vector", 35)
      .drawString(msg, 5, 30)
      .flip();
  },
  drawBusy: function() {
    this.clear();
    g.setFont("Vector", 35);
    let help = this.help;
    g.setFontAlign(-1, -1).drawString(help[0], 0, this.wi);
    g.setFontAlign(1, -1).drawString(help[1], this.w, this.wi);
    g.setFontAlign(-1, 1).drawString(help[2], 0, this.h+this.wi);
    g.setFontAlign(1, 1).drawString(help[3], this.w, this.h+this.wi);
    g.setFontAlign(0, 0)
      .drawString(this.name, this.w/2, this.h/2);
    g.reset();
  },
  drawScreen: function() {
    this.drawMsg(this.screens[this.display]);
    let t1 = getTime();
    this.draw();
    let t = getTime() - t1;
    if (t > 30) {
      print("Draw took", t, "msec");
    }
  },
  nextScreen: function() {
    print("nextS");
    this.display = this.display + 1;
    if (this.display == this.numScreens)
      this.display = 0;
    this.drawScreen();
  },
  prevScreen: function() {
    print("prevS");
    this.display = this.display - 1;
    if (this.display < 0)
      this.display = this.numScreens - 1;
    this.drawScreen();
  },
  onSwipe: function(dir) {
    this.nextScreen();
  },
  wi: 24,
  y2: 176,
  h: 152,
  w: 176,
  last_b: 0,
  topLeft: function() { this.drawMsg("Unimpl"); },
  topRight: function() { this.drawMsg("Unimpl"); },
  touchHandler: function(d) {
    let x = Math.floor(d.x);
    let y = Math.floor(d.y);
    
    if (d.b != 1 || this.last_b != 0) {
      this.last_b = d.b;
      return;
    }
    
    print("touch", x, y, this.h, this.w);

    if ((x<this.w/2) && (y<this.y2/2))
      this.topLeft();
    if ((x>this.w/2) && (y<this.y2/2))
      this.topRight();
    if ((x<this.w/2) && (y>this.y2/2)) {
      print("prev");
      this.prevScreen();
    }
    if ((x>this.w/2) && (y>this.y2/2)) {
      print("next");
      this.nextScreen();
    }
  },
  init: function() {
    this.h = this.y2 - this.wi;
    this.drawBusy();
  }
};

let uir = {
  /* FIXME: should really move somewhere else */
  /* radial angle -- convert 0..1 to 0..2pi */
  radA: function(p) { return p*(Math.PI*2); },
  /* radial distance -- convert 0..1 to something that fits on screen */
  radD: function(d) { return d*(ui.h/2); },

  /* given angle/distance, get X coordinate */
  radX: function(p, d) {
    let a = this.radA(p);
    return ui.w/2 + Math.sin(a)*this.radD(d);
  },
  /* given angle/distance, get Y coordinate */
  radY: function(p, d) {
    let a = this.radA(p);
    return ui.h/2 - Math.cos(a)*this.radD(d) + ui.wi;
  },
  radLine: function(a1, d1, a2, d2) {
    g.drawLine(this.radX(a1, d1), this.radY(a1, d1), this.radX(a2, d2), this.radY(a2, d2));
  },
  radCircle: function(d) {
    g.drawCircle(this.radX(0, 0), this.radY(0, 0), this.radD(d));
    if (1)
      return;
    let step = 0.05;
    for (let i = 0; i < 1; i += 0.05) {
      this.radLine(i - step, d, i, d);
    }
  },
};

/* pie library v0.1.0 */

function Widget() {}

Widget.prototype.radians = function(a) {
  return a * Math.PI / 180;
};

function Pie() {}

Pie.prototype = Object.create(Widget.prototype);
Pie.prototype.constructor = Pie;

Pie.prototype.fillArc = function(g, centerX, centerY, radius, startAngle, endAngle) {
  const points = [];
  points.push(centerX, centerY);
  for (let angle = startAngle; angle <= endAngle; angle += 15) {
    const x = centerX + Math.sin(this.radians(angle)) * radius;
    const y = centerY - Math.cos(this.radians(angle)) * radius;
    points.push(x, y);
  }
  points.push(centerX + Math.sin(this.radians(endAngle)) * radius);
  points.push(centerY - Math.cos(this.radians(endAngle)) * radius);
  g.fillPoly(points);
};

Pie.prototype.drawPieChart1 = function(g, centerX, centerY, radius, data, colors) {
  let startAngle = data[0];
  for (let i = 1; i < data.length; i++) {
    const angle = data[i];
    g.setColor(colors[i]);
    this.fillArc(g, centerX, centerY, radius, startAngle, angle);
    startAngle = angle;
  }
};

// Example usage:
// let pie = new Pie();
// pie.drawPieChart1(g, 88, 88, 60, [0, 90, 180, 270, 360], ["#f00", "#0f0", "#00f", "#ff0", "#0ff"]);

let gpsg = {
  cx: ui.w/2,
  cy: ui.wi+ui.h/2,
  s: ui.h/2 - 1,
  sats: 4,  /* Number of sats with good enough snr */
  sats_bad: 0, /* Sattelites visible but with low snr */
  view_t: getTime(), /* When sky became visible */
  start_t: getTime(), /* When we started acquiring fix */
  dalt: 30, /* Altitude error between barometer and gps */
  fix: {},
  
  init : function() {
  },
  drawCorner(h, v) {
    let cx = this.cx;
    let cy = this.cy;
    let s = this.s;
    let st = 48;
    let a = [cx+h*s, cy+v*s, cx+h*s - h*st, cy+v*s, cx+h*s, cy+v*s - v*st];
    g.fillPoly(a);
  },
  clamp: function(low, v, high) {
    if (v < low)
      v = low;
    if (v > high)
      v = high;
    return [ low, v, high ];
  },
  draw : function() {
    let cx = this.cx;
    let cy = this.cy;
    let s = this.s;
    ui.clear();
    g.fillCircle(cx, cy, s);
    if (!this.fix.fix)
      this.drawCorner(-1, -1);
    if (this.fix.hdop > 10)
      this.drawCorner(1, 1);
    if (this.fix.satellites < 4)
      this.drawCorner(-1, 1);
    if (this.sats < 4)
      this.drawCorner(1, -1);
    
    g.setColor(1, 1, 1);
    let t = getTime();
    let pie = new Pie();
    if (this.fix.fix) { /* Have speed */
      let data = this.clamp(210, 210 + (360*this.fix.speed) / 20, 210+360);
      let colors = [ "ign", "#000", "#fff" ];
      pie.drawPieChart1(g, cx, cy, s * 1, data, colors);
    } else {
      let data = this.clamp(0, (360*(t - this.start_t)) / 600, 360);
      let colors = [ "ign", "#888", "#000" ];
      pie.drawPieChart1(g, cx, cy, s * 1, data, colors);
    }
    if (this.fix.fix) {
      let data = this.clamp(90, 90 + (360*this.dalt) / 200, 90+360);
      let colors = [ "ign", "#000", "#fff" ];
      pie.drawPieChart1(g, cx, cy, s * 0.6, data, colors);
    } else { /* Still waiting for fix */
      let data = this.clamp(0, (360*(t - this.view_t)) / 120, 360);
      let colors = [ "ign", "#888", "#000" ];
      pie.drawPieChart1(g, cx, cy, s * 0.6, data, colors);
    }
    if (this.fix.fix) {
      let slice = 360 / 8;   
      let sats = this.fix.satellites;
      let data = this.clamp( 0, slice * sats, 360 );
      let colors = [ "ign", "#fff", "#000" ];
      pie.drawPieChart1(g, cx, cy, s * 0.3, data, colors);
    } else {
      let slice = 360 / 8;   
      let sats = this.sats;
      let red = sats + this.sats_bad;
      if (sats > 8)
        sats = 8;
      if (red > 8)
        red = 8;      
      let data = [ 0, slice * sats, slice * red, 360 ];
      let colors = [ "ign", "#888", "#800", "#000" ];
      pie.drawPieChart1(g, cx, cy, s * 0.3, data, colors);
    }
  },
};

var debug = 0;
var cur_altitude;
var adj_time = 0, adj_alt = 0;

function GpsAlt() {
  Gps.call(this);
}

GpsAlt.prototype = Object.create(Gps.prototype);
GpsAlt.prototype.constructor = GpsAlt;

GpsAlt.prototype.init = function() {
  print("GpsAlt init");
  Gps.prototype.init.call(this);
};

// Converted from QualitySensor class to prototype-based GpsAlt object
function GpsAlt() {
  this.min_dalt = 9999;
  this.max_dalt = -9999;
  this.step = 0;
  this.dalt = 0;
  this.fix_start = -1;
  this.f3d_start = -1;
}

GpsAlt.prototype.resetAlt = function() {
  this.min_dalt = 9999;
  this.max_dalt = -9999;
  this.step = 0;
};

GpsAlt.prototype.calcAlt = function(alt, cur_altitude) {
  let dalt = alt - cur_altitude;
  this.dalt = dalt;
  if (this.min_dalt > dalt) this.min_dalt = dalt;
  if (this.max_dalt < dalt) this.max_dalt = dalt;
  return this.max_dalt - this.min_dalt;
};

GpsAlt.prototype.updateGps = function() {
  let lat = "lat ", alt = "?", speed = "speed ", hdop = "?",
      adelta = "adelta ", tdelta = "tdelta ";

  fix = gps.getGPSFix();
  if (!fix.fix || !fix.lat) {
    print("...no fix\n");
    this.fix_start = getTime();
  }
  if (qalt < 0 || qalt > 10)
    this.f3d_start = getTime();

  if (adj_time) {
    print("Adjusting time");
    setTime(fix.time.getTime()/1000);
    adj_time = 0;
  }
  if (adj_alt) {
    print("Adjust altitude");
    this.adjustAltitude();
  }

  this.updateAltitude();
  this.displayData(lat, alt, speed, hdop, adelta, tdelta);
};

GpsAlt.prototype.adjustAltitude = function() {
  if (qalt < 5) {
    let rest_altitude = fix.alt;
    let alt_adjust = cur_altitude - rest_altitude;
    let abs = Math.abs(alt_adjust);
    print("adj", alt_adjust);
    let o = Bangle.getOptions();
    if (abs > 10 && abs < 150) {
      let a = 0.01;
      if (cur_altitude > rest_altitude) a = -a;
      o.seaLevelPressure = o.seaLevelPressure + a;
      Bangle.setOptions(o);
    }
    print(o.seaLevelPressure.toFixed(1) + "hPa");
  }
};

GpsAlt.prototype.updateAltitude = function() {
  try {
    Bangle.getPressure().then((x) => {
      cur_altitude = x.altitude;
    }, print);
  } catch (e) {}
};

GpsAlt.prototype.displayData = function(lat, alt, speed, hdop, adelta, tdelta) {
  if (fix && fix.time) {
    tdelta = "" + (getTime() - fix.time.getTime()/1000).toFixed(0);
  }
  if (fix && fix.fix && fix.lat) {
    lat = "" + fmt.fmtPos(fix);
    alt = "" + fix.alt.toFixed(0);
    adelta = "" + (cur_altitude - fix.alt).toFixed(0);
    speed = "" + fix.speed.toFixed(1);
    hdop = "" + fix.hdop.toFixed(0);
  } else {
    lat = "NO FIX\n" + (getTime() - gps.gps_start).toFixed(0) + "s " +
          sky.all.sats_used + "/" + sky.all.snum;
    if (cur_altitude) adelta = "" + cur_altitude.toFixed(0);
  }

  let ddalt = this.calcAlt(alt, cur_altitude);
  let msg = this.formatDisplayMessage(lat, alt, speed, hdop, adelta, ddalt, tdelta);

  if (msg != "") {
    g.reset().setFont("Vector", 31)
      .setColor(g.theme.bg).fillRect(0, ui.wi, ui.w, ui.y2)
      .setColor(g.theme.fb).drawString(msg, 3, 25);
  }
  if (debug > 0) print(fix);
  if (ui.display == 3)
    sky.all.drawSnrGraph();
};

GpsAlt.prototype.formatDisplayMessage = function(lat, alt, speed, hdop, adelta, ddalt, tdelta) {
  let msg = "";
  if (ui.display == 1) {
    msg = lat + "\ne" + hdop + "m " + tdelta + "s\n" + 
          speed + "km/h\n" + alt + "m+" + adelta + "\nmsghere";
  } else if (ui.display == 2) {
    msg = speed + "km/h\n" + "e" + hdop + "m" + "\ndd " +
          qalt.toFixed(0) + "\n(" + this.step + "/" + 
          ddalt.toFixed(0) + ")" + "\n" + alt + "m+" + adelta;
  } else if (ui.display == 3) {
    let t = getTime();
    msg = "St: " + fmt.fmtTimeDiff(t-gps.gps_start) + "\n";
    msg += "Sky: " + fmt.fmtTimeDiff(t-sky.all.sky_start) + "\n";
    msg += "2D: " + fmt.fmtTimeDiff(t-this.fix_start) + "\n";
    msg += "3D: " + fmt.fmtTimeDiff(t-this.f3d_start) + "\n";
  } else if (ui.display == 5) {
    gpsg.start_t = gps.gps_start;
    gpsg.view_t = sky.all.sky_start;
    gpsg.sats = sky.all.sats_used;
    gpsg.sats_bad = sky.all.sats_weak;
    gpsg.fix = fix;
    gpsg.dalt = Math.abs(adelta);
    gpsg.draw();
  }
  this.step++;
  if (this.step == 10) {
    qalt = this.max_dalt - this.min_dalt;
    this.resetAlt();
  }
  return msg;
};


var qalt = 9999; /* global, altitude quality */

/* sky library v0.2.3
   needs ui */

let fix = {}; /* Global for sky library */


function deepCopy(obj) {
  if (obj === null || typeof obj !== "object") {
    return obj; // Return primitive values as-is
  }

  if (Array.isArray(obj)) {
    return obj.map(deepCopy); // Handle arrays recursively
  }

  const copy = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      copy[key] = deepCopy(obj[key]); // Recursively copy properties
    }
  }
  return copy;
}
/* Constellation class (formerly skys) */
function Constellation() {
  this.sats = [];
  this.snum = 0;
  this.sats_used = 0;
  this.sats_weak = 0;
  this.sky_start = -1;
  this.snrLim = 25;
  this.snr_history = [
    10, 11, 12, 13, 14, 13, 14, 15, 18, 19,
    23, 25, 27, 11, 20, 15, 10, 3, 1, 3,
    23, 25, 27, 11, 20, 15, 10, 3, 1, 3,
    23, 25, 27, 11, 20, 15, 10, 3, 1, 3,
    23, 25, 27, 11, 20, 15, 10, 3, 1, 3,
    15
  ];
  this.snr_history_long = [19, 18, 19, 18, 25, 25];
  this.snr_len = 60;
  this.satVisibility = [];
}

Constellation.prototype.reset = function() {
  this.snum = 0;
  this.sats = [];
  this.sats_used = 0;
  this.sats_weak = 0;
};

Constellation.prototype.parseSats = function(s) {
  let view = 1 * s[3];
  let k = Math.min(4, view - this.snum);
  for (let i = 4, j = 0; j < k; j++) {
    let sat = { id: s[i++], ele: 1 * s[i++], azi: 1 * s[i++], snr: s[i++] };
    if (sat.snr === "") sat.snr = 0;
    if (sat.snr >= this.snrLim) this.sats_used++;
    if (sat.snr > 0) this.sats_weak++;
    this.sats[this.snum++] = sat;
  }
};

Constellation.prototype.snrSort = function() {
  return this.sats.slice(0, this.snum).sort((a, b) => b.snr - a.snr);
};

Constellation.prototype.getSatSNR = function(n) {
  if (n <= 0 || n > this.sats.length) return -1;
  return this.snrSort()[n - 1].snr;
};

Constellation.prototype.qualest = function() {
  let sorted = this.snrSort();
  if (sorted[4] && sorted[4].snr) return sorted[4].snr + "dB";
  for (let i = 4; i >= 0; i--) if (sorted[i] && sorted[i].snr) return "S" + (i + 1);
  return "U" + this.snum;
};

Constellation.prototype.trackSatelliteVisibility = function() {
  const now = getTime();
  let newVisibility = [];
  for (let i = 0; i < this.snum; i++) {
    let sat = this.sats[i];
    if (sat.snr >= this.snrLim) {
      newVisibility[sat.id] = this.satVisibility[sat.id] || { start: now, visible: true };
    }
  }
  this.satVisibility = newVisibility;
};

Constellation.prototype.getnthLowestStartTimeSat = function(n) {
  let satellites = Object.values(this.satVisibility);
  if (satellites.length < n) return -1;
  satellites.sort((a, b) => a.start - b.start);
  return satellites[n - 1];
};

Constellation.prototype.goodest = function() {
  let s = this.getnthLowestStartTimeSat(5);
  if (s === -1) return "";
  return (getTime() - s.start) + "s";
};

Constellation.prototype.summary = function() {
  let s = this.goodest();
  return s !== "" ? s : this.qualest();
};

Constellation.prototype.onEnd = function() {
  this.trackSatelliteVisibility();
  if (this.sats_used < 4) this.sky_start = getTime();
  let sorted = this.snrSort();
  let val = (sorted[4] && sorted[4].snr) || -1;
  this.snr_history.push(val);
  if (this.snr_history.length > this.snr_len) {
    val = Math.min.apply(this.snr_history);
    this.snr_history = [];
    this.snr_history_long.push(val);
  }
  if (this.snr_history_long.length > this.snr_len)
    this.snr_history_long.shift();
  this.reset();
};

/* RawGps class (formerly sky) */
function RawGps() {
  this.this_usable = 0;
  this.debug = 0;
  this.all = new Constellation();
  this.split = 0;
  this.old_msg = {};
  this.msg = {};
  this.sys = 3;
}

RawGps.prototype.init = function () {
  if (this.split) {
    this.s_gp = new Constellation();
    this.s_gl = new Constellation();
    this.s_bd = new Constellation();
  }
};

RawGps.prototype.drawGrid = function() {
  g.setColor(g.theme.fg);
  uir.radLine(0, 1, 0.5, 1);
  uir.radLine(0.25, 1, 0.75, 1);
  uir.radCircle(0.5);
  uir.radCircle(1.0);
};

RawGps.prototype.drawSat = function(s) {
  let a = s.azi / 360;
  let e = ((90 - s.ele) / 90);
  let x = uir.radX(a, e);
  let y = uir.radY(a, e);

  if (s.snr == 0)
    g.setColor(1, 0.25, 0.25);
  else if (s.snr < this.all.snrLim)
    g.setColor(0.25, 0.5, 0.25);
  else
    g.setColor(0, 0, 0);
  g.drawString(s.id, x, y);
};

RawGps.prototype.decorate = function() {};

RawGps.prototype.drawSats = function(sats) {
  g.reset()
    .setColor(g.theme.bg)
    .fillRect(0, ui.wi, ui.w, ui.y2)
    .setFont("Vector", 20)
    .setFontAlign(0, 0);
  this.drawGrid();
  sats.forEach(s => this.drawSat(s));

  if (fix && fix.fix && fix.lat) {
    g.setColor(g.theme.fg)
      .setFontAlign(-1, 1);
    g.drawString(fix.satellites + "/" + fix.hdop, 5, ui.y2);
  }
  this.decorate();
};

RawGps.prototype.tof = function(v, n) { return (1*v).toFixed(n); };
RawGps.prototype.tof0 = function(v) { return this.tof(v, 0); };
RawGps.prototype.tof1 = function(v) { return this.tof(v, 1); };

RawGps.prototype.fmtSys = function(sys, sats) {
  if (!sys.sent) return " off\n";
  let r = sys.sent + " ";
  if (sats) r += sats.summary();
  return r + "\n";
};

RawGps.prototype.drawRace = function() {
  let m = this.old_msg;
  let msg = "gmt" + this.tof0(m.time) + "\n" +
            "q" + m.quality + " S" + m.in_view + " h" + this.tof0(m.hdop) + "m\n" +
            this.all.summary() + "\n" +
            "gp" + this.fmtSys(m.gp, this.s_gp) +
            "bd" + this.fmtSys(m.bd, this.s_bd) +
            "gl" + this.fmtSys(m.gl, this.s_gl);
  if (this.msg.finished != 1) msg += "!";
  g.reset().clear().setFont("Vector", 30)
    .setColor(g.theme.fg)
    .setFontAlign(-1, -1)
    .drawString(msg, 0, 0);
};

RawGps.prototype.drawEstimates = function() {
  let r = this.all.qualest();
  let r1 = this.all.goodest();
  print(r, r1, this.old_msg.hdop, this.old_msg.quality);
  ui.drawMsg(r + "\n" + r1 + "\n" + this.old_msg.hdop + "-" + this.old_msg.quality + "d\n" + (getTime() - this.all.sky_start));
};

RawGps.prototype.onMessageEnd = function() {};

RawGps.prototype.messageEnd = function() {
  this.old_msg = this.msg;
  this.msg = { gp: {}, bd: {}, gl: {} };
  this.onMessageEnd();
  this.all.onEnd();
  if (this.split) {
    this.s_gp.onEnd();
    this.s_gl.onEnd();
    this.s_bd.onEnd();
  }
};

RawGps.prototype.parseRaw = function(msg, lost) {
  if (lost) print("## data lost");
  let s = msg.split(",");
  let cmd = s[0].slice(3);
  if (cmd === "RMC") return this.messageEnd();
  if (cmd === "GGA") {
    this.msg.time = s[1];
    this.msg.quality = s[6];
    this.msg.in_view = s[7];
    this.msg.hdop = s[8];
    if (this.debug > 0) {
      print("-----------------------------------------------");
      print("GGA Time", s[1], "fix quality", s[4], "sats in view ", s[5]);
    }
    return;
  }
  if (cmd === "GLL") return;
  if (cmd === "GSA") {
    let sys = s[18];
    let add = { d23: s[2], pdop: s[15], hdop: s[16], vdop: s[17] };
    sys = sys[0];
    if (sys == 1) this.msg.gp = add;
    else if (sys == 2) this.msg.gl = add;
    else if (sys == 4) this.msg.bd = add;
    else {
      print("GSA Unknown system -- ", sys);
      print(msg);
    }
    return;
  }
  if (s[0] === "$GPGSV") {
    if (this.debug > 0) print("Have gps sentences", s[1], "/", s[2]);
    this.all.parseSats(s);
    if (this.split) this.s_gp.parseSats(s);
    this.msg.gp.sent = "" + s[2];
    return;
  }
  if (s[0] === "$BDGSV") {
    if (this.debug > 0) print("Have baidu sentences", s[1], "/", s[2]);
    this.all.parseSats(s);
    if (this.split) this.s_bd.parseSats(s);
    this.msg.bd.sent = "" + s[2];
    return;
  }
  if (s[0] === "$GLGSV") {
    if (this.debug > 0) print("Have glonass sentences", s[1], "/", s[2]);
    this.all.parseSats(s);
    if (this.split) this.s_gl.parseSats(s);
    this.msg.gl.sent = "" + s[2];
    return;
  }
  if (["VTG", "ZDA", "TXT"].includes(cmd)) return;
  print(msg);
};

RawGps.prototype.casic_cmd = function(cmd) {
  var cs = 0;
  for (var i = 1; i < cmd.length; i++)
    cs ^= cmd.charCodeAt(i);
  Serial1.println(cmd + "*" + cs.toString(16).toUpperCase().padStart(2, '0'));
};

RawGps.prototype.selectSpace = function() {
  this.sys += 1;
  if (this.sys == 4) this.sys = 0;
  let val = this.sys ? 1 << (this.sys - 1) : 7;
  this.casic_cmd("$PCAS04," + val);
  ui.drawMsg("Sys " + val);
};


function markGps() {
  gps.start();
  Bangle.on('GPS-raw', (msg, lost) => sky.parseRaw(msg, lost));
}

function onMessage() {
  gps.updateGps();
  if (ui.display == 4)
    sky.drawEstimates();
  
  if (ui.display == 0)
    sky.drawSats(sky.all.sats);
  /*
  if (ui.display == 1)
    sky.drawRace();
    */
}


ui.init();
ui.numScreens = 6;
/* 0.. sat drawing
   1.. position, basic data
   2.. fix quality estimation
   3.. times from ...
   4.. time to fix experiment
   5.. gps graph
*/
gps = new GpsAlt();
gps.init();
sky = new RawGps();
gps.resetAlt();
fmt.init();
sky.onMessageEnd = onMessage;
sky.init();
gpsg.init();

sky.decorate = () => { 
  let p = 15;
  if (0)
    pie.twoPie(p, p+ui.wi, p, gps.dalt, qalt);
};
ui.topLeft = () => { ui.drawMsg("Clock\nadjust"); adj_time = 1; };
ui.topRight = () => { ui.drawMsg("Alt\nadjust"); adj_alt = 1; };

setTimeout(() => sky.casic_cmd("$PCAS04,7"), 1000); /* Enable gps + beidou + glonass */
setTimeout(() => sky.casic_cmd("$PCAS03,1,1,1,1,1,1,1,1"), 1000); 

Bangle.on("drag", (b) => ui.touchHandler(b));
Bangle.setUI({
  mode : "custom",
  clock : 0
});

Bangle.loadWidgets();
Bangle.drawWidgets();
//markGps();
