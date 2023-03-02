Bangle.setBarometerPower(true, "altimeter");

g.clear(1);
Bangle.loadWidgets();
Bangle.drawWidgets();
var zero = 0;
var R = Bangle.appRect;
var y = R.y + R.h/2;
var MEDIANLENGTH = 20;
var avr = [], median;
var value = 0;

function getStandardPressure(altitude) {
  const P0 = 1013.25; // standard pressure at sea level in hPa
  const T0 = 288.15; // standard temperature at sea level in K
  const g0 = 9.80665; // standard gravitational acceleration in m/s^2
  const R = 8.31432; // gas constant in J/(mol*K)
  const M = 0.0289644; // molar mass of air in kg/mol
  const L = -0.0065; // temperature lapse rate in K/m

  const temperature = T0 + L * altitude; // temperature at the given altitude
  const pressure = P0 * Math.pow((temperature / T0), (-g0 * M) / (R * L)); // pressure at the given altitude

  return pressure;
}

function convertToSeaLevelPressure(pressure, altitude) {
  return 1013.25 * (pressure / getStandardPressure(altitude));
}

Bangle.on('pressure', function(e) {
  while (avr.length>MEDIANLENGTH) avr.pop();
  avr.unshift(e.altitude);
  median = avr.slice().sort();
  g.reset().clearRect(0,y-30,g.getWidth()-10,R.h);
  if (median.length>10) {
    var mid = median.length>>1;
    value = E.sum(median.slice(mid-4,mid+5)) / 9;
    t = value-zero;
    if ((t > -100) && (t < 1000))
      t = t.toFixed(1);
    else
      t = t.toFixed(0);
    g.setFont("Vector",50).setFontAlign(0,0).drawString(t, g.getWidth()/2, y);
    print("alt raw:", value.toFixed(1));
    print("temperature:", e.temperature);
    sea = convertToSeaLevelPressure(e.pressure, value-zero);
    print("pressure:", e.pressure);
    print("sea pressure:", sea);
    t = sea.toFixed(1) + " / " + e.temperature.toFixed(1);
    print("std pressure:", getStandardPressure(value-zero));
    print(t);
    g.setFont("Vector",25).setFontAlign(-1,0).drawString(t,
                                                        10, R.y+R.h - 30);
    
  }
});

print(g.getFonts());
g.reset();
g.setFont("Vector:15").setFontAlign(0,0).drawString(/*LANG*/"ALTITUDE (m)", g.getWidth()/2, y-40);
g.setFont("6x8").setFontAlign(0,0,3).drawString(/*LANG*/"ZERO", g.getWidth()-5, g.getHeight()/2);
Bangle.setUI("clockupdown", btn=> {
  if (btn==0) zero=value;
  if (btn<0) zero+=5;
  if (btn>0) zero-=5;
  draw();
});

setWatch(function() {
  // Buggy: if user presses button before averages are available, he gets NaN.
  zero = value;
}, (process.env.HWVERSION==2) ? BTN1 : BTN2, {repeat:true});
if (process.env.HWVERSION==1) {
  setWatch(function() { zero += 1; }, BTN1, {repeat:true});
  setWatch(function() { zero -= 1; }, BTN3, {repeat:true});
} else {
}
