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
	<body onload="{$xcload}" onunload="XCUnload()" onresize="XCResize()" scroll="no">
		<div id="left">
			<p>
				<span id="distance" style="font-size: 36px;">0.0km</span><br/>
				<span id="description">Open distance</span> (&times;<span id="multiplier">1.0</span>)<br/>
				<span id="score" style="font-size: 24px;">0.0 points</span>
			</p>
			<p>
				<b>Route:</b>
				<span class="action" onclick="XCRotateRoute(1); XCUpdateRoute();" title="Rotate route forward">[&#8631;]</span> &middot;
				<span class="action" onclick="XCReverseRoute(); XCUpdateRoute();" title="Reverse route">[&#8644;]</span> &middot;
				<span class="action" onclick="XCRotateRoute(-1); XCUpdateRoute();" title="Rotate route backward">[&#8630;]</span><br/>
				<span id="route"></span>
			</p>
			<p>
				<b>Turnpoints:</b>
				<a href="#" id="gpx" title="Download GPX file of route and turnpoints">[&darr;gpx]</a> &middot;
				<span class="action" id="bookmark" title="Link to this route">[&#10025;]</span>
				<span id="turnpoints"></span><br/>
				{
					html_options name=coordFormat id="coordFormat"
					onchange="XCUpdateRoute();"
					options=$coordFormats selected=$selCoordFormat
				}
			</p>
		
			<form action="#" onsubmit="return false;">
				<input id="location" type="text" value="{$location}"/>
				<input value="Go!" type="submit" onclick="XCGoto();"/><br/>
				{
					html_options name=flightType id="flightType"
					onchange="XCUpdateFlightType(); XCUpdateRoute();"
					options=$flightTypes selected=$selFligthType
				}
				<br/>
				<input value="Put turnpoints here" type="submit" onclick="XCResetTurnpoints(); XCUpdateRoute();" />
			</form>
			<p>
				<span>Internet Explorer not supported, <a href="http://www.mozilla.com/">Download Firefox</a> instead!</span>
			</p>
			<p>
				<span>Copyright &copy; Tom Payne, <a href="mailto:twpayne@gmail.com">twpayne@gmail.com</a>, 2009</span>
			</p>
			<p>
				<span>Source code is GPL-3 <a href="http://github.com/twpayne/xcplanner">here</a>. Thanks to Alex Graf, Marc Poulhies, Jonty Lawson, Victor Berchet and others for code contributions.</span>
			</p>
		</div>
		<div id="right">
			<div id="map"></div>
		</div>
	</body>
</html>
