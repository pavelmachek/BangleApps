#!/usr/bin/python3

# https://wiki.gnome.org/WeatherApplet
# https://lazka.github.io/pgi-docs/

# usage:
# ./weather.py | grep -v '^//' | ./bluepy_uart.py i

import time
import gi
import re
import datetime

gi.require_version('Gtk', '3.0')
gi.require_version('GWeather', '4.0')
from gi.repository import GWeather
from gi.repository import GLib
from gi.repository import Gtk

lo = GWeather.Location.new_detached("", None, 50.00, 15.00)
print(lo)
print("// Country:" , lo.get_country_name())
print("// City:" , lo.get_city_name())
print("// Code:" , lo.get_code())

i = GWeather.Info.new(lo)
i.set_enabled_providers( GWeather.Provider.ALL )
i.connect("updated", lambda x: signal_updated())

def to_ts(i):
    # gnome uses some kind of strange character instead of :
    i = re.sub("[∶]", " ", i)
    da = datetime.datetime(*time.strptime(i, "%a, %b %d / %H %M")[0:6])
    dn = datetime.datetime.today()
    # 0123456789012345678
    # Sun, Apr 02 / 20∶00
    y = dn.year
    if da.month < dn.month:
        y = dn.year + 1
    print(da, y)
    da = da.replace(year = y)
    return da.timestamp()

def hack():
    month = i[5:8]
    day = i[9:11]
    hour = int(i[14:16])
    minu = int(i[17:19])
    print(month, day, hour, minu)


def print_weather_info(i):
    print("// Weather information")
    if not i.is_valid():
        print("//... invalid")
        return
    print("//  for location:", i.get_location_name())
    d = i.get_update()
    print("//  time:", d, to_ts(d), (to_ts(d) - time.time()) / 3600.)

    print("//  provided by:", i.get_enabled_providers())
    print("//  provided by:", i.get_attribution())
    print()
    print("//  conditions:", i.get_conditions())
    print("//  summary:", i.get_weather_summary())

    print("//apparent", i.get_apparent())
    print("//dew", i.get_dew())
    print("//humidity", i.get_humidity())
    print("//icon", i.get_icon_name())
    print("//symbolic icon", i.get_symbolic_icon_name())

    txt = i.get_symbolic_icon_name()
    txt = re.sub("-", " ", txt)
    txt = re.sub("weather", " ", txt)
    txt = re.sub("symbolic", " ", txt)
    txt = re.sub("night", " ", txt)
    txt = re.sub(" overcast ", " clouds ", txt)
#    txt = re.sub(" severe alert ", " tornado ", txt)
    txt = re.sub(" storm ", " thunderstorm ", txt)

    
    print("//--txt", txt)
    #x weather-clear-night-symbolic.svg
    #x weather-clear-symbolic.svg
    #x weather-few-clouds-night-symbolic.svg
    #x weather-few-clouds-symbolic.svg
    #x weather-fog-symbolic.svg
    #x weather-overcast-symbolic.svg
    #weather-severe-alert-symbolic.svg
    #x weather-showers-scattered-symbolic.svg
    #x weather-showers-symbolic.svg
    #x weather-snow-symbolic.svg
    #x weather-storm-symbolic.svg
    #x weather-tornado-symbolic.svg
    #weather-windy-symbolic.svg

    print("//pressure", i.get_pressure())
    print("//radar", i.get_radar())
    print("//sky", i.get_sky())

    print("//update", i.get_update())
    print("//moon phase", i.get_value_moonphase())
    print("//visibility", i.get_visibility())
    print("//wind", i.get_wind())
    print("//wind", i.get_value_wind(GWeather.SpeedUnit.KPH))
    s = GWeather.WindDirection.to_string(i.get_value_wind(GWeather.SpeedUnit.KPH)[2])
    print("//wind dir", GWeather.WindDirection.to_string(i.get_value_wind(GWeather.SpeedUnit.KPH)[2]))
    angle = -1
    if s == "West": angle = 270
    elif s == "East": angle = 90
    elif s == "North": angle = 0
    elif s == "South": angle = 180
    elif s == "Northwest": angle = 270+45
    elif s == "Southwest": angle = 180+45
    elif s == "Northeast": angle = 45
    elif s == "Southeast": angle = 90+45
    
    print("//--wind angle", angle)
    print("//is day", i.is_daytime())
    #print("moonphases", i.get_upcoming_moonphases())

    s = '''
var current = {};
current.txt = "%s";
// Really assumes plain text.
// "thunderstorm" "snow" "shower" "rain" "clear" "few clouds" "scattered clouds" "clouds" "mist"
//current.code = 999;
// https://openweathermap.org/weather-conditions#Weather-Condition-Codes-2
// 200 -- lightning, 300 -- rain, 511 -- snow, 520..522, 531 rain+sun, 
current.temp = %f+273.15; // celsius
current.hum = %s; // percent
current.wind = %f; // km/h
//current.wrose = "N";
current.wdir = %d; // deg
current.time = %d; // Unix time * 1000?
current.expiry = 2*3600000; // Time in msec?
''' % ( txt,
        i.get_value_temp(GWeather.TemperatureUnit.CENTIGRADE)[1],
        i.get_humidity()[:-1],
        i.get_value_wind(GWeather.SpeedUnit.KPH)[1],
        angle,
        to_ts(d) * 1000)
    print(s)
    #help(i)

def signal_updated():
    print("// Got signal")
    print_weather_info(i)

    print('''
var json = {};
json.weather = current;
json.forecast = {};
''');

    print("//Forecasts: ", len(i.get_forecast_list()))
    num = 0
    for l in i.get_forecast_list()[:10]:
        print_weather_info(l)
        print("json.forecast[%d] = current;" % num)
        num = num+1

    print('''    
const storage = require('Storage');
storage.write('weather.json', json);
''')
    
    Gtk.main_quit()

Gtk.main()


