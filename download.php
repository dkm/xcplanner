<?php

require_once("config.php");
require_once("$SMARTY_DIR/Smarty.class.php");

class Turnpoint {
	var $name;
	var $lat;
	var $lon;
	var $ele;

	function Turnpoint($name, $lat, $lon, $ele) {
		$this->name = $name;
		$this->lat = $lat;
		$this->lon = $lon;
		$this->ele = $ele;
	}

}

class Route {
	var $turnpoints;

	function Route($name, $turnpoints, $circuit) {
		$this->name = $name;
		$this->turnpoints = $turnpoints;
		$this->circuit = $circuit;
	}

}

$name = preg_replace("/[^\\s\\w]+/", "", $_GET["name"]);
$turnpoints = array();
if ($_GET["turnpoints"]) {
	foreach (split(",", $_GET["turnpoints"]) as $turnpoint) {
		list($turnpoint_name, $lat, $lon, $ele) = split(":", $turnpoint);
		$turnpoint_name = preg_replace("/[^\\s\\w]+/", "", $turnpoint_name); 
		$lat = (float) $lat;
		$lon = (float) $lon;
		$ele = (int) $ele;
		if (!$ele) {
			$ele = get_elevation($lat, $lon);
		}
		array_push($turnpoints, new Turnpoint($turnpoint_name, $lat, $lon, $ele));
	}
}
$circuit = (boolean) $_GET["circuit"];
$route = new Route($name, $turnpoints, $circuit);

$smarty = new Smarty;
$smarty->assign("route", $route);
if ($_GET["format"] == "gpx") {
	header("Content-Type: application/octet-stream");
	header("Content-Disposition: inline; filename=\"$route->name.gpx\"");
	$smarty->display("download_gpx.tpl");
}

?>
