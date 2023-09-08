R = Bangle.appRect;

function introScreen() {
  g.reset().clearRect(R);
  g.setColor(0,0,0).setFont("Vector",25);
  g.setFontAlign(0,0);
  g.drawString("Benchmark", 85,35);
  g.setColor(0,0,0).setFont("Vector",18);
  g.drawString("Press button", 85,55);
}
function lineBench() {
  for (let i=0; i<1000; i++) {
    let x1 = Math.random() * 160;
    let y1 = Math.random() * 160;
    let x2 = Math.random() * 160;
    let y2 = Math.random() * 160;
    
    g.drawLine(x1, y1, x2, y2);
  }
}
function runBench(b) {
  b();
}
function redraw() {
  g.reset().clearRect(R);
  g.setColor(0,0,0).setFont("Vector",25);
  g.setFontAlign(0,0);
  g.drawString("Running", 85,35);
  g.setColor(0,0,0).setFont("Vector",18);
  g.drawString("Press button", 85,55);
  
  runBench(lineBench);
}
function showMap() {
  g.reset().clearRect(R);
  redraw();
  emptyMap();
}
function emptyMap() {
  Bangle.setUI({mode:"custom",drag:e=>{
      g.reset().clearRect(R);
      redraw();    
  }, btn: btn=>{
    mapVisible = false;
    var menu = {"":{title:"Benchmark"},
    "< Back": ()=> showMap(),
    /*LANG*/"Run": () =>{
      showMap();
    }};
    E.showMenu(menu);
  }});
}

const st = require('Storage');
const hs = require('heatshrink');

introScreen();
emptyMap();