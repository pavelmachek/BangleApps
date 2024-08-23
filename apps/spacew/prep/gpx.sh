#!/bin/bash

Z=4

ogr2ogr -f "GeoJSON" delme.json input.gpx -sql "SELECT * FROM tracks"

rm -r delme/; mkdir delme
time ./split.js $Z
./minitar.js
ls -lS delme/*.json  | head -20
cat delme/* | wc -c
ls -l delme.mtar
