R = Bangle.appRect;

function redraw() {
  print("Benchmark");
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

function introScreen() {
  g.reset().clearRect(R);
  g.setColor(0,0,0).setFont("Vector",25);
  g.setFontAlign(0,0);
  g.drawString("Benchmark", 85,35);
  g.setColor(0,0,0).setFont("Vector",18);
  g.drawString("Press button", 85,55);
  g.drawString("(hello)");
}

introScreen();
emptyMap();
