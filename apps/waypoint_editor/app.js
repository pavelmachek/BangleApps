/* Thanks to pinsafe apps from BangleApps repository */

var Layout = require("Layout");

const W = g.getWidth();
const H = g.getHeight();

var wp = require('Storage').readJSON("waypoints.json", true) || [];
var mode = 0; /* 0 .. DD.ddddd, */

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
  done=false;
  function addDigit(digit) {
    key+=digit;
    if (1) {
      l = text[key.length];
      switch (l) {
        case '.': case ' ': 
          key+=l;
          break;
        case 'd': case 'D': default:
          break;
      }
    }
    Bangle.buzz(20);
    update();
  }
  function update() {
    g.reset();
    g.clearRect(0,0,g.getWidth(),23);
    s = key + text.substr(key.length, 999);
    g.setFont("Vector:24").setFontAlign(1,0).drawString(s,g.getWidth(),12);
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
    showNumpad("DDD.dddd", function() {
      switch (mode) {
        case 0:
          i = key.substr(0, 3);
          i += key.substr(4, 99);
          res = parseInt(i) / 10000;
      }
      res = sign * res;
      print("Coordinate", res);
      callback(res);
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
