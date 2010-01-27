<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
	<head>
		<meta http-equiv="content-type" content="text/html; charset=utf-8"/>
		<title>XC Planner</title>
		<link rel="stylesheet" href="css/xcplanner.css" type="text/css"/>
		<link rel="icon" href="favicon.ico" type="image/png"/>
		<script src="http://maps.google.com/maps?file=api&amp;v=2&amp;key={$GOOGLE_MAPS_API_KEY}" type="text/javascript"></script>
		<script src="js/jscoord-1.1.1.js" type="text/javascript"></script>
		<script src="js/json2.js" type="text/javascript"></script>
		<script src="js/mapiconmaker.js" type="text/javascript"></script>
		<script src="js/prototype.js" type="text/javascript"></script>
		<script src="js/xcplanner.js" type="text/javascript"></script>
	</head>
	<body onload="XCLoad()" onunload="XCUnload()" onresize="XCResize()" scroll="no">
		<div id="left">
			<span id="distance" style="font-size: 36px;">0.0 km</span><br/>
			<span id="description">Open distance</span> (&times;<span id="multiplier">1.0</span>)<br/>
			<span id="score" style="font-size: 24px;">0.0 points</span><br/>
			<hr/>
			<input id="location" type="text"/><input value="Go" type="submit" onclick="XCGo();"/><br/>
			<hr/>
			<select name="flightType" id="flightType" onchange="XCUpdateFlightType();"></select><br/>
			<hr/>
			<b>Route:</b>
			<input type="submit" onclick="XCZoomRoute();" value="&#8853;"/>
			<input type="submit" onclick="XCRotateRoute(1);" value="&#8631;"/>
			<input type="submit" onclick="XCReverseRoute();" value="&#8644;"/>
			<input type="submit" onclick="XCRotateRoute(-1);" value="&#8630;"/>
			<table id="route"></table>
			<hr/>
			<b>Turnpoints:</b>
			<input type="submit" onclick="XCHere();" value="&#9872;"/>
			<table id="turnpoints"></table>
			<hr/>
			<b>Save:</b>
			<input type="submit" onclick="XCDownload(&quot;gpx&quot;);" value="GPX"/>
			<a id="link">link</a>
			<hr/>
			<b>Preferences:</b>
			<table>
				<tr>
					<td>FAI triangle areas:</td>
					<td><input id="faiSectors" type="checkbox" checked="yes" onchange="XCUpdateRoute();" value="true"/></td>
				</tr>
				<tr>
					<td>Closed circuit area:</td>
					<td>
						<select id="circuit" onchange="XCUpdateRoute();">
							<option label="none" value="none">None</option>
							<option label="sector" value="sector" selected="yes">Sector</option>
							<option label="circle" value="circle">Circle</option>
						</select>
					</td>
				</tr>
				<tr>
					<td>Coordinate format:</td>
					<td><select id="coordFormat" onchange="XCUpdateRoute();"></select></td>
				</tr>
				<tr>
					<td>Distance unit:</td>
					<td><select id="distanceFormat" onchange="XCUpdateRoute();"></select></td>
				</tr>
			</table>
			<hr/>
			<p>XC Planner Copyright &copy; 2009, 2010 Tom Payne &lt;<a href="mailto:twpayne@gmail.com">twpayne@gmail.com</a>&gt;</p>
			<p><a href="http://github.com/twpayne/xcplanner/">http://github.com/twpayne/xcplanner/</a></p>
			<p>Thanks to:
				Victor Berchet &middot;
				Alex Graf &middot;
				Marcus Kroiss &middot;
				Jonty Lawson &middot;
				Marc Poulhies
			</p>
			<input id="defaultLocation" type="hidden" value="{$location|escape}"/>
			<input id="defaultFlightType" type="hidden" value="{$flightType|escape}"/>
			<input id="defaultCoordFormat" type="hidden" value="{$coordFormat|escape}"/>
			<input id="defaultDistanceFormat" type="hidden" value="{$distanceFormat|escape}"/>
			<input id="defaultTurnpoints" type="hidden" value="{$turnpoints|escape}"/>
			<input id="defaultSector" type="hidden" value="{$sector|escape}"/>
		</div>
		<div id="right">
			<div id="map"></div>
		</div>
	</body>
</html>
