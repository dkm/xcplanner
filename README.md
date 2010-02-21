XC Planner Google Maps cross country flight planning tool
=========================================================

XC Planner is a web application for planning cross country flights.  Notable features include:

* Based on [Google Maps](http://maps.google.com)
* Intuitive user interface
* Support for many flight types including open distance, out-and-returns and triangles
* Support for [XContest](http://www.xcontest.org/)&quot;s airspace and SkyWays maps
* Generation of GPX files for easy upload to your GPS, including accurate waypoint elevations
* Generation of links so you can share your flight planning with others

You install it on a web server and then can access it from anywhere using your web browser.  This document is for system administrators who wish to install XC Planner on their own servers, if you&quot;re a pilot then it&quot;s easiest to use an existing installation such as the one at http://www.paraglidingforum.com/xcplanner/.


Basic Installation
------------------

1. Unpack XC Planner in to a suitable directory on your webserver, e.g. `/var/www/html/xcplanner`.

2. Get a [Google Maps API key](http://code.google.com/apis/maps/signup.html) for your website and set `$GOOGLE_MAPS_API_KEY` to this in `config.php`.  The default key distributed with XC Planner is for `http://localhost/`.

3. Install the [Smarty](http://www.smarty.net/) PHP template library and set `$SMARTY_DIR` in `config.php` to point to the directory containing `Smarty.class.php`.  Packages for Smarty are available in most Linux distributions. The RedHat package is called `php-Smarty` and the Debian package is called `smarty`.

4. Make sure that the `templates_c` directory is writeable by the webserver, e.g. `chown apache:apache templates_c`.

5. Point your web browser at `http://localhost/xcplanner/`.


Linking to XC Planner
---------------------

If you&quot;re hosting XC Planner on your own server then you can edit `config.php` to set suitable defaults.  If you prefer to use an existing installation (e.g. http://www.paraglidingforum.com/xcplanner/) then you can set suitable defaults with a query string.  The available options are:

* `location=`_name_
* `flightType=`_type_
* `turnpoints=[[`_lat1_`,`_lng1_`],[`_lat2_`,`_lng2_`],`...`]`
* `start=[`_lat_`,`_lng_`]`

These can be used to set sensible defaults if you want to link to XC planner from your XC league&quot;s website.  For example:

* OLC 5-point flight around Interlaken: `http://www.paraglidingforum.com/xcplanner/?location=Interlaken&flightType=olc5`
* CFD FAI triangle around Chamonix: `http://www.paraglidingforum.com/xcplanner/?location=Chamonix&flightType=cfd3c`


Advanced Installation
---------------------

### Elevation data ###

XC Planner can use [CGIAR-CSI](http://srtm.csi.cgiar.org/) data to determine turnpoint elevations.  The program `bin/srtm-download` can be used to download and prepare this data for use.  It is advisable to download the CGIAR-CSI tiles for the areas you wish to cover. For example, to download the data for Europea, run

	bin/srtm-download --europe

To download the the data for the entire world, run

	bin/srtm-download --all --ignore-errors

XC Planner will, by default, use an simple compressed format for the elevation data.  Individual rows of elevation data are compressed separately which gives a disk space saving of approximately 70% over uncompressed data at the expense of having to uncompress one row (12000 bytes) each time an elevation datum is requested.  For popular areas, you may wish to store uncompressed tiles which are larger (72MB per tile) but are much faster to access.

The recommended configuration is to use compressed tiles for all areas except the European Alps.  This can be achieved with the two commands:

	bin/srtm-download --all --ignore-errors
	bin/srtm-download --european-alps --tile

The compressed tiles require approximately 17GB of disk space, the four uncompressed European Alps tiles require an additional 276MB.

XC Planner can use a USGS webservice to retrieve elevation data if the SRTM tiles are not available.  Set `$get_elevation` in `config.php` to `get_elevation_usgs` to enable it.  However, this is not recommended because it is very slow.

The `--ignore-errors` option causes `srtm-download` to ignore errors due to slow downloads, corrupt zip files, and so on.  It&quot;s useful if you want to start downloading tiles and then grab a coffee.  After it has completed, you can run `srtm-download` again but without the `--ignore-errors` option to see where it encountered problems.

Note that `srtm-download` assumes that individual CGIAR-CSI tiles are 6000&times;6000 points.  For an unknown reason, some tiles have different sizes.

### XContest airspace and SkyWays ###

[XContest](http://www.xcontest.org/) have kindly made their airspace and SkyWays overlays available for use by XC Planner hosted on a limited number of sites.  XC Planner currently has a hard coded list of these sites and will automatically enable the XContest overlays if it detectes that it running on one of them.  If you wish to override this, set the `$XCONTEST` variable to `true` in `config.php`.  Note that simply overriding this will not make XContest&quot;s airspace data availble on your site!  XContest&quot;s webservers will not serve this data to unauthorized sites. To request permission to use the XContest data contact info@xcontest.org.
