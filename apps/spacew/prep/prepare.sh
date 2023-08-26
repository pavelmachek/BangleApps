#!/bin/bash
# Whole country
BBOX=10,60,20,30
Z="--maxz 9"
# Prague; 1.2MB map, not really useful
#BBOX=14.25,50.17,14.61,49.97
#Z="--maxz 14"
if [ ".$1" == ".-f" ]; then
    I=/data/gis/osm/dumps/czech_republic-2023-07-24.osm.pbf
    #I=/data/gis/osm/dumps/zernovka.osm.bz2
    O=cr.geojson
    Z=
    rm delme.pbf $O
    ls -al $I
    # http://bboxfinder.com/#0.000000,0.000000,0.000000,0.000000
    # Prague
    time osmium extract $I --bbox $BBOX -f pbf -o delme.pbf
    # Zernovka small
    #time osmium extract $I --bbox 14.7,49.9,14.8,50.1 -f pbf -o delme.pbf
    # Zernovka big
    #time osmium extract $I --bbox 14.6,49.7,14.9,50.1 -f pbf -o delme.pbf
    ls -alh delme.pbf
    time osmium export delme.pbf -c prepare.json -o $O
    ls -alh $O
    echo "Converting to ascii"
    time cstocs utf8 ascii cr.geojson  > cr_ascii.geojson
    mv -f cr_ascii.geojson delme.json
fi
rm -r delme/; mkdir delme
./split.js $Z
./minitar.js
ls -lS delme/*.json  | head -20
cat delme/* | wc -c
ls -l delme.mtar
