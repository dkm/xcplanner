XC Planner Google Maps cross country flight planning tool
=========================================================

XC Planner is a web application.  You install it on a web server and then can access it from anywhere using your web browser.


Basic Installation
------------------

1. Unpack XC Planner in to a suitable directory on your webserver, e.g. `/var/www/html/xcplanner`.

2. Get a Google Maps API key for your website from http://code.google.com/apis/maps/signup.html and set `$GOOGLE_MAPS_API_KEY` to this in `config.php`.  The default key distributed with XC Planner is for `http://localhost/`.

3. Install the [Smarty](http://www.smarty.net/) PHP template library and set `$SMARTY_DIR` in `config.php` to point to the directory containing `Smarty.class.php`.  Packages for Smarty are available in most Linux distributions. The RedHat package is called `php-Smarty` and the Debian package is called `smarty`.

4. Make sure that the templates_c directory is writeable by the webserver, e.g. `chown apache:apache templates_c`.

5. Point your web browser at `http://localhost/xcplanner/`.


Linking to XC Planner
---------------------

XC Planner accepts a query string which is used to set the initial state.  These are:

* `location=`_name_
* `flightType=`_type_
* `turnpoints=[[`_lat1_`,`_lng1_`],[`_lat2_`,`_lng2_`],`...`]`
* `start=[`_lat_`,`_lng_`]`

These can be used to set sensible defaults if you want to link to XC planner from your XC league&quot;s website.  For example:

* OLC 5-point flight around Interlaken: `http://localhost/xcplanner/?location=Interlaken&flightType=olc5`
* CFD FAI triangle around Chamonix: `http://localhost/xcplanner/?location=Chamonix&flightType=cfd3c`


Advanced Installation
---------------------

### Elevation data ###

XC Planner can use [CGIAR-CSI](http://srtm.csi.cgiar.org/) data to determine turnpoint elevations.  The program `bin/srtm-get` can be used to download and prepare this data for use.  It is advisable to download the CGIAR-CSI tiles for the areas you wish to cover. For example, to download the data for European, use

	for i in 35 42; do
		for j in 1 5; do
			bin/srtm-get -i $i -j $j
		done
	done

XC Planner can use a USGS webservice to retrieve elevation data if the SRTM tiles are not available.  Set `$get_elevation` in `config.php` to `get_elevation_usgs` to enable it.  However, this is not recommended because this is very slow.
