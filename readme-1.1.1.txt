-------------------------------------------------------------------------- JScoord
 readme.txt 
 (c) 2005 Jonathan Stott  Created on 21-Dec-2005 
 1.1.1 - 16 Jan 2006
  - Fixed radix bug in getOSRefFromSixFigureReference that would return
    the incorrect reference if either the northing or the easting started
    with a leading zero.
 1.1 - 23 Dec 2005
  - Added getOSRefFromSixFigureReference function.
 1.0 - 21 Dec 2005  - Initial version created from PHPcoord v1.1.--------------------------------------------------------------------------

JScoord is a JavaScript script that provides functions for handling
various co-ordinate systems and converting between them. Currently, OSGB
(Ordnance Survey of Great Britain) grid references, UTM (Universal
Transverse Mercator) references and latitude/longitude are supported. A
function is also provided to find the surface distance between two points
of latitude and longitude.

When using the OSGB conversions, the majority of applications use the
WGS84 datum rather than the OSGB36 datum. Conversions between the two
data are therefore required. The conversions should be accurate to within
5m or so. If accuracy is not important (i.e. to within 200m or so),
then it isn't necessary to perform the conversions.

Examples of how to use the functions provided in jscoord.php can be
found on the JScoord website.

See http://www.jstott.me.uk/jscoord/ for latest releases and information.


DISCLAIMER

Whilst every effort has been made to ensure accuracy, accuracy of the
co-ordinate conversions contained within the JScoord package is not
guaranteed. Use of the conversions is entirely at your own risk and I
cannot be held responsible for any consequences of errors created by
the conversions. I do not recommend using the package for mission-
critical applications.


LICENSING

This software product is available under the GNU General Public License
(GPL). Terms of the GPL can be read at http://www.jstott.me.uk/gpl/.
Any commercial use requires the purchase of a license - contact me at
jscoord@jstott.me.uk for details.