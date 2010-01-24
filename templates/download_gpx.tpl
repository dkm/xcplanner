<?xml version="1.0" encoding="utf-8"?>
<gpx version="1.0" creator="http://github.com/twpayne/xcplanner/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns="http://www.topografix.com/GPX/1/0" xsi:schemaLocation="http://www.topografix.com/GPX/1/0 http://www.topografix.com/GPX/1/0/gpx.xsd">
{foreach from=$route.turnpoints item=turnpoint}
	<wpt lat="{$turnpoint.lat}" lng="{$turnpoint.lng}">
{if $turnpoint.ele}
		<ele>{$turnpoint.ele}</ele>
{/if}
		<name>{$turnpoint.name|escape}</name>
	</wpt>
{/foreach}
	<rte>
		<name>{$route.location|escape} {$route.distance} {$route.description|escape}</name>
{foreach from=$route.turnpoints item=turnpoint}
		<rtept lat="{$turnpoint.lat}" lng="{$turnpoint.lng}">
{if $turnpoint.ele}
			<ele>{$turnpoint.ele}</ele>
{/if}
			<name>{$turnpoint.name|escape}</name>
		</rtept>
{/foreach}
{if $route.circuit}
		<rtept lat="{$route.turnpoints[0].lat}" lng="{$route.turnpoints[0].lng}">
{if $turnpoint.ele}
			<ele>{$route.turnpoints[0].ele}</ele>
{/if}
			<name>{$route.turnpoints[0].name|escape}</name>
		</rtept>
{/if}
	</rte>
</gpx>
