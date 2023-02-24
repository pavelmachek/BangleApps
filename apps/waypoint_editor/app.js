/* Thanks to scicalc and pinsafe apps from BangleApps repository */

var Layout = require("Layout");

const W = g.getWidth();
const H = g.getHeight();

const dispH = H/5;
const butH = H-dispH;

const buttons = [[['7', '8', '9'],
                  ['4', '5', '6'],
                  ['1', '2', '3'],
                  ['<', '0', '.']],
                 [[' ', ' ', ' '],
                  [' ', ' ', ' '],
                  [' ', ' ', ' '],
                  [' ', ' ', ' ']],
                 [[' ', ' ',  ' '],
                  [' ', ' ', ' '],
                  [' ', ' ', ' '],
                  [' ', ' ', ' ']
                 ]];

var curPage = 0;
var inputStr = '';
var memory = '';
var qResult = false;

function drawPage (p) {
  g.clearRect(0, dispH, W-1, H-1);
  g.setFont('Vector', butH/5).setFontAlign(0, 0, 0).setColor(g.theme.fg);
  for (x=0; x<3; ++x)
    for (y=0; y<4; ++y)
      g.drawString(buttons[p][y][x], (x+0.5)*W/3, dispH+(y+0.7)*butH/4);
  g.setColor(0.5, 0.5, 0.5);
  for (x=1; x<3; ++x) g.drawLine(x*W/3, dispH+0.2*butH/4-2, x*W/3, H-1);
  for (y=1; y<4; ++y) g.drawLine(0, dispH+(y+0.2)*butH/4, W-1, dispH+(y+0.2)*butH/4);
  g.setColor(g.theme.fg).drawLine(0, dispH+0.2*butH/4-2, W-1, dispH+0.2*butH/4-2);
}

function updateDisp(s, len) {
  var fh = butH/5; 
  if (s.toString().length>len) s = s.toString().substr(0,len);
  g.setFont("Vector", butH/5).setColor(g.theme.fg).setFontAlign(1, 0, 0);
  while (g.stringWidth(s) > W-1) {
    fh /= 1.05;
    g.setFont("Vector", fh);
  }
  g.clearRect(0, 0, W-1, dispH-1).drawString(s, W-2, dispH/2);
  g.setColor(g.theme.fg).drawLine(0, dispH+0.2*butH/4-2, W-1, dispH+0.2*butH/4-2);
}

function processInp (s) {
  return s;
}

function compute() {
  var res;
  updateDisp(inputStr, 19);
}

function touchHandler(e, d) {
  var x = Math.floor(d.x/(W/3));
  var y = Math.floor((d.y-dispH-0.2*butH/4)/(butH/4));
  var c = buttons[curPage][y][x];
  if (c=="=") { // do the computation
    compute();
    return;
  }
  else if (c=="<" && inputStr.length>0) inputStr = inputStr.slice(0, -1); // delete last character
  else inputStr += c;
  
  qResult = false;
  updateDisp(inputStr, 32);
}

function swipeHandler(e,d) {
  curPage -= e;
  if (curPage>buttons.length-1) curPage = 0;
  if (curPage<0) curPage = buttons.length-1;
  drawPage(curPage);
}

function getCoordinates() {
  Bangle.on("touch", touchHandler);
  Bangle.on("swipe", swipeHandler);
  g.clear();
  drawPage(curPage);
}

var wp = require('Storage').readJSON("waypoints.json", true) || [];

function writeWP() {
  require('Storage').writeJSON("waypoints.json", wp);
}

function mainMenu() {
  var menu = {
    "< Back" : Bangle.load
  };
  if (Object.keys(wp).length==0) Object.assign(menu, {"NO WPs":""});
  else for (let id in wp) {
    let i = id;
    menu[wp[id]["name"]]=()=>{ decode(i); };
  }
  menu["Add"]=addCard;
  menu["Remove"]=removeCard;
  g.clear();
  E.showMenu(menu);
}

function decode(pin) {
      print(pin);
      var i = wp[pin];
      var pinDecrypted=i["name"] + "\n" + i["lat"] + "\n" + i["lon"];
      var showPin = new Layout ({
        type:"v", c: [
          {type:"txt", font:"10%", pad:1, fillx:1, filly:1, label: pinDecrypted},
          {type:"btn", font:"10%", pad:1, fillx:1, filly:1, label:"OK", cb:l=>{mainMenu();}}
        ], lazy:true});
      g.clear();
      showPin.render();
}

function showNumpad(text, callback) {
  E.showMenu();
  key="";
  function addDigit(digit) {
    key+=digit;
    Bangle.buzz(20);
    update();
  }
  function update() {
    g.reset();
    g.clearRect(0,0,g.getWidth(),23);
    g.setFont("Vector:24").setFontAlign(1,0).drawString(text+key,g.getWidth(),12);
  }
  ds="12%";
  var numPad = new Layout ({
      type:"v", c: [{
        type:"v", c: [
          {type:"", height:24},
          {type:"h",filly:1, c: [
            {type:"btn", font:ds, width:58, label:"7", cb:l=>{addDigit("7");}},
            {type:"btn", font:ds, width:58, label:"8", cb:l=>{addDigit("8");}},
            {type:"btn", font:ds, width:58, label:"9", cb:l=>{addDigit("9");}}
          ]},
          {type:"h",filly:1, c: [
            {type:"btn", font:ds, width:58, label:"4", cb:l=>{addDigit("4");}},
            {type:"btn", font:ds, width:58, label:"5", cb:l=>{addDigit("5");}},
            {type:"btn", font:ds, width:58, label:"6", cb:l=>{addDigit("6");}}
          ]},
          {type:"h",filly:1, c: [
            {type:"btn", font:ds, width:58, label:"1", cb:l=>{addDigit("1");}},
            {type:"btn", font:ds, width:58, label:"2", cb:l=>{addDigit("2");}},
            {type:"btn", font:ds, width:58, label:"3", cb:l=>{addDigit("3");}}
          ]},
          {type:"h",filly:1, c: [
            {type:"btn", font:ds, width:58, label:"0", cb:l=>{addDigit("0");}},
            {type:"btn", font:ds, width:58, label:"C", cb:l=>{key=key.slice(0,-1); update();}},
            {type:"btn", font:ds, width:58, id:"OK", label:"OK", cb:callback}
          ]}
        ]}
      ], lazy:true});
  g.clear();
  numPad.render();  
  update();
}

function removeCard() {
  var menu = {
    "" : {title : "select card"},
    "< Back" : mainMenu
  };
  if (Object.keys(wp).length==0) Object.assign(menu, {"NO CARDS":""});
  else for (let c in wp) {
    let card=c;
    menu[c]=()=>{
      E.showMenu();
      var confirmRemove = new Layout (
        {type:"v", c: [
          {type:"txt", font:"15%", pad:1, fillx:1, filly:1, label:"Delete"},
          {type:"txt", font:"15%", pad:1, fillx:1, filly:1, label:card+"?"},
          {type:"h", c: [
            {type:"btn", font:"15%", pad:1, fillx:1, filly:1, label: "YES", cb:l=>{
              delete wp[card];
              writeWP();
              mainMenu();
            }},
            {type:"btn", font:"15%", pad:1, fillx:1, filly:1, label: " NO", cb:l=>{mainMenu();}}
          ]}
        ], lazy:true});
      g.clear();
      confirmRemove.render();
    };
  }
  E.showMenu(menu);
}

function askCoordinate(t1, t2, callback) {
  let sign = 1;
  showNumpad(t1, function() {
    if (key == "0")
      sign = -1;
    showNumpad(t2+" deg:", function() {
      res = parseInt(key);
      showNumpad(t2+" .deg:", function() {
        i = parseInt(key);
        for (j=0; j<key.length; j++)
          i = i / 10;
        res = sign * (res + i);
        print("Coordinate", res);
        callback(res);
      });
    });
  });
}

function askPosition(callback) {
  let full = "";
  askCoordinate("0S 1N", "lat", function(lat) {
    askCoordinate("0W 1E", "lon", function(lon) {
        callback(lat, lon);
    });
  });
}

function addCard() {
  showNumpad("Name:", function() {
    result = "wp"+key;
    if (wp[result]!=undefined) {
            E.showMenu();
            var alreadyExists = new Layout (
              {type:"v", c: [
                {type:"txt", font:Math.min(15,100/result.length)+"%", pad:1, fillx:1, filly:1, label:result},
                {type:"txt", font:"12%", pad:1, fillx:1, filly:1, label:"already exists."},
                {type:"h", c: [
                  {type:"btn", font:"10%", pad:1, fillx:1, filly:1, label: "REPLACE", cb:l=>{encodeCard(result);}},
                  {type:"btn", font:"10%", pad:1, fillx:1, filly:1, label: "CANCEL", cb:l=>{mainMenu();}}
                ]}
              ], lazy:true});
            g.clear();
            alreadyExists.render();
          }
    g.clear();
    askPosition(function(lat, lon) {
      print("position -- ", lat, lon);
      let n = {};
      n["name"] = result;
      n["lat"] = lat;
      n["lon"] = lon;
      wp.push(n);
      print("add -- waypoints", wp);
      writeWP();
      mainMenu();
    });
  });
}


g.reset();
Bangle.setUI();
mainMenu();
