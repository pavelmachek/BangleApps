/* sun version 0.0.3 */
let sun	= {
  SunCalc: null,
  lat: 50,
  lon: 14,
  rise: 0,  /* Unix time of sunrise/sunset */
  set: 0,
  init: function() {  
    try {
      this.SunCalc = require("suncalc"); // from modules folder
    } catch (e) {
      print("Require error", e);
    }
    print("Have suncalc: ", this.SunCalc);
  },
  sunPos: function() {
    let d = new Date();
    if (!this.SunCalc) {
      let sun = {};
      sun.azimuth = 175;
      sun.altitude = 15;
      return sun;
    }
    let sun = this.SunCalc.getPosition(d, this.lat, this.lon);
    print(sun.azimuth, sun.altitude);
    return sun;
  },
  sunTime: function() {
    let d = new Date();
    if (!this.SunCalc) {
      let sun = {};
      sun.sunrise = d;
      sun.sunset = d;
      return sun;
    }
    let sun = this.SunCalc.getTimes(d, this.lat, this.lon);
    return sun;
  },
  adj: function (x) {
    if (x < 0)
      return x + 24*60*60;
    return x;
  },
  toSunrise: function () {
    return this.adj(this.rise - getTime());
  },
  toSunset: function () {
    return this.adj(this.set - getTime());
  },
  update: function () {
    let t = this.sunTime();
    this.rise = t.sunrise.getTime() / 1000;
    this.set  = t.sunset.getTime() / 1000;
  },
  // < 0 : next is sunrise, in abs(ret) seconds
  // > 0 
  getNext: function () {
    let rise = this.toSunrise();
    let set = this.toSunset();
    if (rise < set) {
      return -rise;
    }
    return set;
 //   set = set / 60;
 //   return s + (set / 60).toFixed(0) + ":" + (set % 60).toFixed(0);
  },
};

sun.init();

const defaultSettings = {
  loadWidgets    : false,
  textAboveHands : false,
  shortHrHand    : true,
  white          : 0
};
const settings = Object.assign(defaultSettings, require('Storage').readJSON('andark.json',1)||{});

const c={"x":g.getWidth()/2,"y":g.getHeight()/2};
const l2 = 24;

const zahlpos=(function() {
  let z=[];
  let sk=1;
  let step = 5;
  if (l2==24) step=2.5;
  let i=-10;
  if (l2==24) i=-12.5;
  for(;i<50;i+=step){
     let win=i*2*Math.PI/60;
     let xsk =c.x+2+Math.cos(win)*(c.x-10),
         ysk =c.y+2+Math.sin(win)*(c.x-10);
    if (l2==12) {
      if(sk==3){xsk-=10;}
      if(sk==6){ysk-=10;}
      if(sk==9){xsk+=10;}
      if(sk==12){ysk+=10;}
      if(sk==10){xsk+=3;}
    }
    z.push([sk,xsk,ysk]);
    sk+=1;
  }
  return z;
})();

const cities=(function() {
  let z=[];
  let sk=1;
  let step = 5;
  if (l2==24) step=2.5;
  let i=-10;
  if (l2==24) i=-12.5;
  for(;i<50;i+=step){
     let win=i*2*Math.PI/60;
     let xsk =c.x+2+Math.cos(win)*(c.x-30),
         ysk =c.y+2+Math.sin(win)*(c.x-30);
    if (l2==12) {
      if(sk==3){xsk-=10;}
      if(sk==6){ysk-=10;}
      if(sk==9){xsk+=10;}
      if(sk==12){ysk+=10;}
      if(sk==10){xsk+=3;}
    }
    z.push([sk,xsk,ysk]);
    sk+=1;
  }
  return z;
})();


let unlock = false;

function zeiger(len,dia,tim){
  const x=c.x+ Math.cos(tim)*len/2,
        y=c.y + Math.sin(tim)*len/2,
        d={"d":3,"x":dia/2*Math.cos(tim+Math.PI/2),"y":dia/2*Math.sin(tim+Math.PI/2)},
        pol=[c.x-d.x,c.y-d.y,c.x+d.x,c.y+d.y,x+d.x,y+d.y,x-d.x,y-d.y];
  return pol;
}

function drawHands(d) {
  let m=d.getMinutes(), h=d.getHours(), s=d.getSeconds();
  g.setColor(settings.white,settings.white,settings.white);

  if (h>l2){
    h=h-l2;
  }
  //calculates the position of the minute, second and hour hand
  h=2*Math.PI/l2*(h+m/60)-Math.PI/2;
  //more accurate
  //m=2*Math.PI/60*(m+s/60)-Math.PI/2;
  m=2*Math.PI/60*(m)-Math.PI/2;

  s=2*Math.PI/60*s-Math.PI/2;
  //g.setColor(1,0,0);
  const hz = zeiger(settings.shortHrHand?88:100,5,h);
  g.fillPoly(hz,true);
  //g.setColor(1,1,1);
  const minz = zeiger(150,5,m);
  g.fillPoly(minz,true);
  if (unlock){
    const sekz = zeiger(150,2,s);
    g.fillPoly(sekz,true);
  }
  g.fillCircle(c.x,c.y,4);
}

function setColor() {
   g.setBgColor(!settings.white,!settings.white,!settings.white);
  g.setColor(settings.white,settings.white,settings.white);
}

function drawText(d) {
  g.setFont("Vector",20);
  //let dateStr = require("locale").date(d);
  //g.drawString(dateStr, c.x, c.y+20, true);
  let bat = E.getBattery();
  let batStr = Math.round(bat/5)*5+"%";
  if (Bangle.isCharging()) {
    g.setBgColor(1,0,0);
  }
  if (bat < 30)
    g.drawString(batStr, c.x, c.y+40, true);
}

function drawNumbers(d) {
  let hour = d.getHours();
  if (d.getMinutes() > 30) {
    hour += 1;
  }
  let day = d.getDate();
  if (day > l2) {
    day = day % 10;
    if (!day)
      day = 10;
  }
  //draws the numbers on the screen
  for(let i = 0;i<l2;i++){
     let on = false;
     let j = i+1;
     g.setFont("Vector",20);
     if (j == day) {
       on = true;
       g.setFont("Vector",29);
     }
    if ((j % l2) == (hour % l2))
      on = true;
    setColor();
    if (!on)
      g.setColor(settings.white/2, !settings.white, settings.white);
    if (1 || on)
      g.drawString(zahlpos[i][0],zahlpos[i][1],zahlpos[i][2],true);
    if (l2 == 24) {
      g.setColor();
      g.setFont("Vector",12);
      g.drawString(cities[i][0],cities[i][1],cities[i][2],true);
    }
  }
}

function draw(){
  // draw black rectangle in the middle to clear screen from scale and hands
  g.setColor(!settings.white,!settings.white,!settings.white);
  g.fillRect(10,10,2*c.x-10,2*c.x-10);
  // prepare for drawing the text
  g.setFontAlign(0,0);
  // do drawing
  const d=new Date();
  drawScale(d);		// FIXME: it is enough to do once in 12 hours or so
  drawNumbers(d);
  if (settings.textAboveHands) {
    drawHands(d); drawText(d);
  } else {
    drawText(d); drawHands(d);
  }
}

/* 0..12 -> angle suitable for drawScale */
function conv(m) { return -15 + (m / l2) * 60; }
/* datetime -> 0..12 float */
function hour12(d) {
  let h = d.getHours() + d.getMinutes() / 60;
  if (h > l2)
    h = h - l2;
  return h;
}

//draws the scale once the app is started
function drawScale(d){
  // clear the screen
  g.setBgColor(!settings.white,!settings.white,!settings.white);
  g.clear();
  // Display month as a wider mark
  let m = conv(d.getMonth() + 1);
  print(m);

  let pos = sun.sunPos().azimuth;
  pos = conv(l2*(pos/360));
  
  let t = sun.sunTime();
  // FIXME
  let set = conv(hour12(t.sunset));
  let dark = conv(hour12(t.sunset) + 0.25);
  print(set, dark, pos);
  
  // draw the ticks of the scale
  for(let i=-14;i<47;i++){
    const win=i*2*Math.PI/60;
    let d=2;
    if(i%5==0){d=5;}
    if(i==m){d=10;}
    if (i>=pos && i<=(pos+2))
      g.setColor(!settings.white,!settings.white,settings.white/2);
    else if (i>=set && i<=dark)
      g.setColor(settings.white/2,!settings.white,settings.white/2);
    else
      g.setColor(settings.white,settings.white,settings.white);
    g.fillPoly(zeiger(300,d,win),true);
      g.setColor(!settings.white,!settings.white,!settings.white);
    g.fillRect(10,10,2*c.x-10,2*c.x-10);
  }
}

//// main running sequence ////

// Show launcher when middle button pressed, and widgets that we're clock
Bangle.setUI("clock");
// Load widgets if needed, and make them show swipeable
if (settings.loadWidgets) {
  Bangle.loadWidgets();
  require("widget_utils").swipeOn();
} else if (global.WIDGETS) require("widget_utils").hide();
// Clear the screen once, at startup
print(settings)
print("Scale");
drawScale(new Date());
print("Clock");
draw();
print("Done");

let secondInterval = setInterval(draw, 1000);

// Stop updates when LCD is off, restart when on
Bangle.on('lcdPower',on=>{
  if (secondInterval) clearInterval(secondInterval);
  secondInterval = undefined;
  if (on) {
    secondInterval = setInterval(draw, 1000);
    draw(); // draw immediately
  }
});
Bangle.on('lock',on=>{
  unlock = !on;
  if (secondInterval) clearInterval(secondInterval);
  secondInterval = setInterval(draw, unlock ? 1000 : 60000);
  draw(); // draw immediately
});
Bangle.on('charging',on=>{draw();});
