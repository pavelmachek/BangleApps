const Layout = require('Layout');
const locale = require('locale');
const weather = require('weather');
let current = weather.get();

const storage = require('Storage');

let allw = storage.readJSON('weather.json')||[];
var page = -1;
forecast = allw.forecast;
forecast[-1] = current;

Bangle.loadWidgets();


var layout = new Layout({type:"v", bgCol: g.theme.bg, c: [
  {filly: 1},
  {type: "h", filly: 0, c: [
    {type: "v", width: g.getWidth()/2, c: [  // Vertical container for icon
      {type: "custom", fillx: 1, height: g.getHeight()/2 - 30, valign: -1, txt: "unknown", id: "icon",
        render: l => weather.drawIcon(l, l.x+l.w/2, l.y+l.h/2, l.w/2-5)},
    ]},
    {type: "v", fillx: 1, c: [
      {type: "h", pad: 2, c: [
        {type: "txt", font: "18%", id: "temp", label: "000"},
        {type: "txt", font: "12%", valign: -1, id: "tempUnit", label: "°C"},
      ]},
      {filly: 1},
      {type: "txt", font: "6x8", pad: 2, halign: 1, label: /*LANG*/"Humidity"},
      {type: "txt", font: "9%", pad: 2, halign: 1, id: "hum", label: "000%"},
      {type: "txt", font: "6x8", pad: [2, 2, 2, 2], halign: -1, label: /*LANG*/"Wind"},
      {type: "h", pad: [0, 2, 2, 2], halign: -1, c: [
        {type: "txt", font: "9%", pad: 2, id: "wind",  label: "00"},
        {type: "txt", font: "6x8", pad: 2, valign: -1, id: "windUnit", label: "km/h"},
      ]},
      {type: "custom", fillx: 1, height: 15, id: "uvDisplay",
        render: l => {
          if (!current || current.uv === undefined || current.uv === 0) return;
          const uv = Math.min(parseInt(current.uv), 11); // Cap at 11
          
          // UV color thresholds: [max_value, color] based on WHO standards
          const colors = [[2,"#0F0"], [5,"#FF0"], [7,"#F80"], [10,"#F00"], [11,"#F0F"]];
          const color = colors.find(c => uv <= c[0])[1];
          const blockH = 8, blockW = 3;
          
          // Draw UV title and blocks on same line
          g.setFont("6x8").setFontAlign(-1, 0);
          const label = "UV";
          const labelW = g.stringWidth(label);
          
          const x = l.x + 2;
          const y = l.y + l.h / 2;
          
          // Draw title
          g.setColor(g.theme.fg).drawString(label, x, y);
          
          // Draw UV blocks after title
          g.setColor(color);
          for (let i = 0; i < uv; i++) {
            const blockX = x + labelW + 4 + i * (blockW + 2);
            g.fillRect(blockX, y - blockH/2, blockX + blockW, y + blockW/2);
          }
          
          // Reset graphics state to prevent interference
          g.reset();
        }
      },
    ]},
  ]},
  {filly: 1},
  {type: "txt", font: "9%", wrap: true, height: g.getHeight()*0.18, fillx: 1, id: "cond", label: /*LANG*/"Weather condition"},
  {filly: 1},
  {type: "h", c: [
    {type: "txt", font: "6x8", pad: 4, id: "loc", label: "Toronto"},
    {fillx: 1},
    {type: "txt", font: "6x8", pad: 4, id: "updateTime", label: /*LANG*/"15 minutes ago"},
  ]},
  {filly: 1},
]}, {lazy: true});

function formatDuration(millis) {
  let pluralize = (n, w) => n + " " + w + (n == 1 ? "" : "s");
  if (millis > -60000 && millis < 60000) return /*LANG*/"< 1 minute";
  if (millis > -3600000 && millis < 3600000) return pluralize(Math.floor(millis/60000), /*LANG*/"minute");
  if (millis > -86400000 && millis < 86400000) return pluralize(Math.floor(millis/3600000), /*LANG*/"hour");
  return pluralize(Math.floor(millis/86400000), /*LANG*/"day");
}

function draw(current) {
  layout.icon.txt = current.txt;
  layout.icon.code = current.code;
  const temp = locale.temp(current.temp-273.15).match(/^(\D*\d*)(.*)$/);
  layout.temp.label = temp[1];
  layout.tempUnit.label = temp[2];
  layout.hum.label = current.hum+"%";
  const wind = locale.speed(current.wind).match(/^(\D*\d*)(.*)$/);
  layout.wind.label = wind[1];
  layout.windUnit.label = wind[2] + " " + (current.wrose||'').toUpperCase();
  layout.cond.label = current.txt.charAt(0).toUpperCase()+(current.txt||'').slice(1);
  layout.loc.label = current.loc;
  layout.updateTime.label = `${formatDuration(Date.now() - current.time)} ago`; // How to autotranslate this and similar?
  layout.update();
  layout.forgetLazyState();
  layout.render();
}

function drawUpdateTime() {
  if (!current || !current.time) return;
  layout.updateTime.label = `${formatDuration(Date.now() - current.time)} ago`;
  layout.update();
  layout.render();
}

function update() {
  current = weather.get();
  NRF.removeListener("connect", update);
  if (current) {
    draw(current);
  } else {
    layout.forgetLazyState();
    if (NRF.getSecurityStatus().connected) {
      E.showMessage(/*LANG*/"Weather\nunknown\n\nIs Gadgetbridge\nweather\nreporting set\nup on your\nphone?");
    } else {
      E.showMessage(/*LANG*/"Weather\nunknown\n\nGadgetbridge\nnot connected");
      NRF.on("connect", update);
    }
  }
}

let interval = setInterval(drawUpdateTime, 60000);
Bangle.on('lcdPower', (on) => {
  if (interval) {
    clearInterval(interval);
    interval = undefined;
  }
  if (on) {
    drawUpdateTime();
    interval = setInterval(drawUpdateTime, 60000);
  }
});

weather.on("update", update);

update();

// We want this app to behave like a clock:
// i.e. show launcher when middle button pressed
Bangle.setUI("clockupdown", btn=> {
  if (btn<0) page--;
  if (btn>0) page++;
  if (page<-1) page=-1;
  draw(forecast[page]);
});

// But the app is not actually a clock
// This matters for widgets that hide themselves for clocks, like widclk or widclose
delete Bangle.CLOCK;

Bangle.drawWidgets();