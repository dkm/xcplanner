<?xml version="1.0" encoding="utf-8"?>
<kml xmlns="http://earth.google.com/kml/2.0">
	<Folder>
		<name>{$route.location|escape} {$route.distance} {$route.description|escape}</name>
		<Placemark>
			<name>Route</name>
			<LineString>
				<coordinates>
{foreach from=$route.turnpoints item=turnpoint}
					{$turnpoint.lng},{$turnpoint.lat},{$turnpoint.ele}
{/foreach}
{if $route.circuit}
					{$route.turnpoints[0].lng},{$route.turnpoints[0].lat},{$route.turnpoints[0].ele}
{/if}
				</coordinates>
				<tessellate>1</tessellate>
			</LineString>
		</Placemark>
		<Folder>
			<name>Waypoints</name>
{foreach from=$route.turnpoints item=turnpoint}
			<Placemark>
				<name>{$turnpoint.name|escape}</name>
				<Point>
					<coordinates>{$turnpoint.lng},{$turnpoint.lat},{$turnpoint.ele|default:0}</coordinates>
				</Point>
			</Placemark>
{/foreach}
		</Folder>
	</Folder>
</kml>
