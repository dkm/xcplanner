<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml">
	<head>
		<meta http-equiv="content-type" content="text/html; charset=utf-8"/>
		<title>XC Planner</title>
		<link rel="stylesheet" href="css/xcplanner.css" type="text/css"/>
		<script src="http://maps.google.com/maps?file=api&amp;v=2&amp;key={$GOOGLE_MAPS_API_KEY}" type="text/javascript"></script>
		<script src="js/jscoord-1.1.1.js" type="text/javascript"></script>
		<script src="js/mapiconmaker.js" type="text/javascript"></script>
		<script src="http://ajax.googleapis.com/ajax/libs/prototype/1.6.0.3/prototype.js" type="text/javascript"></script>
		<script src="js/xcplanner.js" type="text/javascript"></script>
	</head>
	<body onload="{$xcload}" onunload="XCUnload()">
		<table>
			<tr>
				<td rowspan="2" valign="top" width="280px">
					<p>
						<span id="distance" style="font-size: 36px;">0.0km</span><br/>
						<span id="description">Open distance</span> (&times;<span id="multiplier">1.0</span>)<br/>
						<span id="score" style="font-size: 24px;">0.0 points</span>
					</p>
					<p>
						<b>Route:</b>
						<a href="javascript:XCRotateRoute(1); XCUpdateRoute();" title="Rotate turnpoints clockwise">&#8631;</a>
						<a href="javascript:XCReverseRoute(); XCUpdateRoute();" title="Reverse turnpoints">&#8644;</a>
						<a href="javascript:XCRotateRoute(-1); XCUpdateRoute();" title="Rotate turnpoints anti-clockwise">&#8630;</a>
						<a name="bm" href="javascript:XCBookmark()" title="Bookmark route">&#10025;</a>
						<a href="#" id="gpx" title="Download GPX file of waypoints and route">gpx</a><br/>
						<a href="#" id="link" title="Link for sharing this route">link</a><br/>
						<span id="route"></span>
					</p>
					<p>
						<b>Turnpoints:</b>
						<span id="turnpoints"></span><br>
						{
							html_options name=coordFormat id="coordFormat"
							onchange="XCUpdateRoute();"
							options=$coordFormats selected=$selCoordFormat
						}
					</p>

					<!-- <p>
						<b>Instructions:</b><br/>
						<span style="font-size: 12px">
						Go to your flying area by typing the name of the nearest town above and clicking Go!
						Choose the type of flight you want to plan using the drop-down menu.
						Drag the markers around to choose your turnpoints.
						Press the "Put turnpoints here" button to put the turnpoints on the area of the map that you are looking at.</span>
					</p> -->
					<p>
						<span style="font-size: 12px">Internet Explorer not supported, <a href="http://www.mozilla.com/">Download Firefox</a> instead!</span>
					</p>
					<p>
						<span style="font-size: 12px">Copyright &copy; Tom Payne, <a href="mailto:twpayne@gmail.com">twpayne@gmail.com</a>, 2009</span>
					</p>
					<p>
						<span style="font-size: 12px">Source code is GPL-3 <a href="http://github.com/twpayne/xcplanner">here</a>, contributions welcome! Thanks to Alex Graf for the FAI sectors and to Jonty Lawson for the GPX download.</span>
					</p>
				</td>
				<td>
					<form action="#" onsubmit="return false;">
						<input id="location" type="text" value="{$location}" />
						<input value="Go!" type="submit" onclick="XCGoto();" />
						{
							html_options name=flightType id="flightType"
							onchange="XCUpdateFlightType(); XCUpdateRoute();"
							options=$flightTypes selected=$selFligthType
						}
						<input value="Put turnpoints here" type="submit" onclick="XCResetTurnpoints(); XCUpdateRoute();" />
					</form>
				</td>
			</tr>
			<tr>
				<td>
					<div id="map" style="width: 800px; height: 600px"></div>
				</td>
			</tr>
		</table>
	</body>
</html>
