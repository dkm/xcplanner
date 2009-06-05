<?xml version="1.0" encoding="utf-8"?>
<gpx version="1.0" creator="http://github.com/twpayne/xcplanner/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns="http://www.topografix.com/GPX/1/0" xsi:schemaLocation="http://www.topografix.com/GPX/1/0 http://www.topografix.com/GPX/1/0/gpx.xsd">
{foreach from=$route->turnpoints item=turnpoint}
	<wpt lat="{$turnpoint->lat}" lon="{$turnpoint->lon}">
{if $turnpoint->ele}
		<ele>{$turnpoint->ele}</ele>
{/if}
		<name>{$turnpoint->name}</name>
	</wpt>
{/foreach}
	<rte>
{if $route->name}
		<name>{$route->name}</name>
{/if}
{foreach from=$route->turnpoints item=turnpoint}
		<rtept lat="{$turnpoint->lat}" lon="{$turnpoint->lon}">
{if $turnpoint->ele}
			<ele>{$turnpoint->ele}</ele>
{/if}
			<name>{$turnpoint->name}</name>
		</rtept>
{/foreach}
{if $route->circuit}
		<rtept lat="{$route->turnpoints[0]->lat}" lon="{$route->turnpoints[0]->lon}">
{if $turnpoint->ele}
			<ele>{$route->turnpoints[0]->ele}</ele>
{/if}
			<name>{$route->turnpoints[0]->name}</name>
		</rtept>
{/if}
	</rte>
</gpx>
