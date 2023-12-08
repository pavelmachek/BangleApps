var  on = false;
setInterval(function() {
  on = !on;
  LED1.write(on);
}, 500);

// made using https://www.espruino.com/Making+Music
// Manic Monday tone by The Bangles

  function freq(f) {
    if (f===0) digitalWrite(D19, 0);
    else analogWrite(D19, 0.1, {freq: f});
  }


freq(1000);
freq(1500);
freq(0);

var pitches = {
  'G': 207.65,
  'a': 220.00,
  'b': 246.94,
  'c': 261.63,
  'd': 293.66,
  'e': 329.63,
  'f': 369.99,
  'g': 392.00,
  'A': 440.00,
  'B': 493.88,
  'C': 523.25,
  'D': 587.33,
  'E': 659.26,
  'F': 698.46
};

function step() {
  var ch = tune[pos];
  if (ch !== undefined) pos++;
  if (ch in pitches) freq(pitches[ch]);
  else freq(0); // off
}

var tune = "aggffefed";
var pos = 0;

  var playing = setInterval(step, 500);
