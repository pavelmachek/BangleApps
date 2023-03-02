//var Layout = require("Layout");

const W = g.getWidth();
const H = g.getHeight();

var cx = 100; cy = 105; sc = 70;
var buzz = "", msg = "";
temp = 0; alt = 0; bpm = 0;

function touchHandler(d) {
  let x = Math.floor(d.x);
  let y = Math.floor(d.y);
  
  print("drag:", d);
 
  g.setColor(0.25, 0, 0);
  g.fillCircle(W-x, W-y, 5);
}

function add0(i) {
  if (i > 9) {
    return ""+i;
  } else {
    return "0"+i;
  }
}

function draw() {
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
  g.drawString("S" + step + " B" + bat, 3, 160);  
  g.drawString("S" + step + " B" + bat, 3, 180);
     
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
  //Bangle.on("accel", accelHandler);
  Bangle.setCompassPower(1, "cyborg");
  Bangle.setBarometerPower(1, "cyborg");
  Bangle.setHRMPower(1, "cyborg");
  Bangle.setGPSPower(1, "cyborg");
  Bangle.on("HRM", (hrm) => { bpm = hrm.bpm; } );
  //Bangle.on("mag", magHandler);
  
  draw();
  buzzTask();
  accelTask();
}


g.reset();
Bangle.setUI();
start();