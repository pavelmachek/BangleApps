//var Layout = require("Layout");

const W = g.getWidth();
const H = g.getHeight();

var cx = 100; cy = 105; sc = 70;
var buzz = "", msg = "";
temp = 0; alt = 0; bpm = 0;
var buzz = "", msg = "", inm = "", l = "", note = "";

function toMorse(x) {
  r = "";
  for (var i = 0; i < x.length; i++) {
    c = x[i];
    if (c == " ") {
      r += " ";
      continue;
    }
    r += asciiToMorse(c) + " ";
  }
  return r;
}

function aload(s) {
  buzz += toMorse(' E');
  load(s);
}

function inputHandler(s) {
  print("Ascii: ", s);
  note = note + s;
  switch(s) {
    case 'B':
      s = ' B';
      bat = E.getBattery();
      if (bat > 45)
        s += 'E';
      else
        s = s+(bat/5);
      buzz += toMorse(s);
      break;
    case 'L': aload("altimeter.app.js"); break;
    case 'O': aload("orloj.app.js"); break;
    case 'T':
      s = ' T';
      d = new Date();
      s += d.getHours() % 10;
      s += add0(d.getMinutes());
      buzz += toMorse(s);
      break;
    case 'R': aload("run.app.js"); break;
  }
}

const morseDict = {
    '.-': 'A',
    '-...': 'B',
    '-.-.': 'C',
    '-..': 'D',
    '.': 'E',
    '..-.': 'F',
    '--.': 'G',
    '....': 'H',
    '..': 'I',
    '.---': 'J',
    '-.-': 'K',
    '.-..': 'L',
    '--': 'M',
    '-.': 'N',
    '---': 'O',
    '.--.': 'P',
    '--.-': 'Q',
    '.-.': 'R',
    '...': 'S',
    '-': 'T',
    '..-': 'U',
    '...-': 'V',
    '.--': 'W',
    '-..-': 'X',
    '-.--': 'Y',
    '--..': 'Z',
    '.----': '1',
    '..---': '2',
    '...--': '3',
    '....-': '4',
    '.....': '5',
    '----.': '9',
    '---..': '8',
    '--...': '7',
    '-....': '6',
    '-----': '0',
  };

let asciiDict = {};

for (let k in morseDict) {
  print(k, morseDict[k]);
  asciiDict[morseDict[k]] = k;
}


function morseToAscii(morse) {
  return morseDict[morse];
}

function asciiToMorse(char) {
  return asciiDict[char];
}

function morseHandler() {
  inputHandler(morseToAscii(inm));
  inm = "";
  l = "";
}

function touchHandler(d) {
  let x = Math.floor(d.x);
  let y = Math.floor(d.y);

  g.setColor(0.25, 0, 0);
  g.fillCircle(W-x, W-y, 5);

  if (d.b) {
  if (x < W/2 && y < H/2 && l != ".u") {
    inm = inm + ".";
    l = ".u";
  }
  if (x > W/2 && y < H/2 && l != "-u") {
    inm = inm + "-";
    l = "-u";
  }
  if (x < W/2 && y > H/2 && l != ".d") {
    inm = inm + ".";
    l = ".d";
  }
  if (x > W/2 && y > H/2 && l != "-d") {
    inm = inm + "-";
    l = "-d";
  }
    
  } else
    morseHandler();
  
  print(inm, "drag:", d);
}

function add0(i) {
  if (i > 9) {
    return ""+i;
  } else {
    return "0"+i;
  }
}

var lastHour = -1, lastMin = -1;

function hourly() {
  print("hourly");
  s = ' T';
  buzz += toMorse(s);
}

function fivemin() {
  print("fivemin");
  s = ' B';
  bat = E.getBattery();
  if (bat < 45) {
      s = s+(bat/5);
      buzz += toMorse(s);
  }
}

function draw() {
  g.setColor(1, 1, 1);
  g.fillRect(0, 25, W, H);
  g.setFont('Vector', 60);

  g.setColor(0, 0, 0);
  g.setFontAlign(-1, 1);
  let now = new Date();
  g.drawString(now.getHours() + ":" + add0(now.getMinutes()), 10, 90);
  if (lastHour != now.getHours()) {
    lastHour = now.getHours();
    hourly();
  }
  if (lastMin / 5 != now.getMinutes() / 5) {
    lastMin = now.getMinutes();
    fivemin();
  }

  g.setFont('Vector', 26);
  g.drawString(note, 10, 120);
  
  queueDraw();
}

function draw_all() {
  g.setColor(0, 0, 0);
  g.fillRect(0, 0, W, H);
  g.setFont('Vector', 36);

  g.setColor(1, 1, 1);
  g.setFontAlign(-1, 1);
  let now = new Date();
  g.drawString(now.getHours() + ":" + add0(now.getMinutes()) + ":" + add0(now.getSeconds()), 10, 40);
  
  acc = Bangle.getAccel();
  let ax = 0 + acc.x, ay = 0.75 + acc.y, az = 0.75 + acc.y;
  let diff = ax * ax + ay * ay + az * az;
  diff = diff * 3;
  if (diff > 1)
    diff = 1;

  co = Bangle.getCompass();
  step = Bangle.getStepCount();
  bat = E.getBattery();
  Bangle.getPressure().then((x) => { alt = x.altitude; temp = x.temperature; },
                                 print);
  //print(acc.x, acc.y, acc.z);
  
  g.setColor(0, 1, 0);
  g.drawCircle(cx, cy, sc);
  
  if (0) {
    g.setColor(0, 0.25, 0);
    g.fillCircle(cx + sc * acc.x, cy + sc * acc.y, 5);
    g.setColor(0, 0, 0.25);
    g.fillCircle(cx + sc * acc.x, cy + sc * acc.z, 5);
  }
  if (0) {
    print(co.dx, co.dy, co.dz);
    g.setColor(0, 0.25, 0);
    g.fillCircle(cx + sc * co.dx / 300, cy + sc * co.dy / 1500, 5);
    g.setColor(0, 0, 0.25);
    g.fillCircle(cx + sc * co.dx / 300, cy + sc * co.dz / 400, 5);
  }
  if (1) {
    //print(co.heading);
    h = co.heading / 360 * 2 * Math.PI;
    g.setColor(0, 0, 0.5);
    g.fillCircle(cx + sc * Math.sin(h), cy + sc * Math.cos(h), 5);
  }
  
  //g.setColor(diff, diff, diff);
  g.setColor(1, 1, 1);
  
  g.setFont('Vector', 22);
  g.drawString(now.getDate()+"."+(now.getMonth()+1)+" "+now.getDay(), 3, 60);
  g.drawString(msg, 3, 80);
  g.drawString("S" + step + " B" + Math.round(bat/10) + (Bangle.isCharging()?"c":""), 3, 100);
  g.drawString("A" + Math.round(alt) + " T" + Math.round(temp), 3, 120);
  g.drawString("C" + Math.round(co.heading) + " B" + bpm, 3, 140);
  //g.drawString("S" + step + " B" + bat, 3, 160);  
  //g.drawString("S" + step + " B" + bat, 3, 180);
     
  queueDraw();
}

function accelTask() {
  tm = 100;
  acc = Bangle.getAccel();
  en = !Bangle.isLocked();
  if (en && acc.z < -0.95) {
    msg = "Level";
    buzz = ".-..";
    tm = 3000;
  }
  if (en && acc.x < -0.80) {
    msg = "Down";
    buzz = "-..";
    tm = 3000;
  }
  if (en && acc.x > 0.95) {
    msg = "Up";
    buzz = "..-";
    tm = 3000;
  }

  setTimeout(accelTask, tm);
}

function buzzTask() {
  if (buzz != "") {
    now = buzz[0];
    buzz = buzz.substring(1);
    dot = 100;
    if (now == " ") {
      setTimeout(buzzTask, 300);
    } else if (now == ".") {
      Bangle.buzz(dot, 1);
      setTimeout(buzzTask, 2*dot);
    } else if (now == "-") {
      Bangle.buzz(3*dot, 1);
      setTimeout(buzzTask, 4*dot);
    } else if (now == "/") {
      setTimeout(buzzTask, 6*dot);
    } else print("Unknown character -- ", now, buzz);
  } else
  setTimeout(buzzTask, 50);
}

function aliveTask() {
  function cmp(s) {
    let d = acc[s] - last_acc[s];
    //print(d);
    return d < -0.03 || d > 0.03;
  }
  // HRM seems to detect hand quite nicely
  acc = Bangle.getAccel();
  if (cmp("x") || cmp("y") || cmp("z"))
    print("active");
  last_acc = acc;
  
  setTimeout(aliveTask, 500);
}

var drawTimeout;

function queueDraw() {
  if (drawTimeout) clearTimeout(drawTimeout);
  next = 50;
  drawTimeout = setTimeout(function() {
    drawTimeout = undefined;
    draw();
  }, next - (Date.now() % next));

}

function start() {
  Bangle.on("drag", touchHandler);
  if (0)
    Bangle.on("accel", accelHandler);
  if (0) {
    Bangle.setCompassPower(1, "cyborg");
    Bangle.setBarometerPower(1, "cyborg");
    Bangle.setHRMPower(1, "cyborg");
    Bangle.setGPSPower(1, "cyborg");
    Bangle.on("HRM", (hrm) => { bpm = hrm.bpm; } );
  //Bangle.on("mag", magHandler);
  }
  
  draw();
  buzzTask();
  //accelTask();
  
  if (1) {
    last_acc = Bangle.getAccel();
    aliveTask();
  }
}


g.reset();
Bangle.setUI();
Bangle.loadWidgets();
Bangle.drawWidgets();

start();
