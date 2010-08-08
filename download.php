<?php

$DEBUG = 0;

require_once("xcplanner.php");

if (get_magic_quotes_gpc()) {
	$route = json_decode(stripslashes($_GET["route"]), true);
} else {
	$route = json_decode($_GET["route"], true);
}

$route["turnpoints"] = json_decode($route["turnpoints"], true);
foreach ($route["turnpoints"] as $key => $turnpoint) {
	if (!isset($turnpoint["ele"])) {
		$route["turnpoints"][$key]["ele"] = $get_elevation($turnpoint["lat"], $turnpoint["lng"]);
	}
}
$filename = preg_replace("/[^\\s\\w\\-.]+/", "", implode(" ", array($route["location"], $route["distance"], $route["description"])));
if ($_GET["format"] == "gpx") {
	if ($DEBUG) {
		print "<pre>";
		print htmlentities(view_render("download_gpx.tpl", array('route' => $route)));
		print "</pre>";
	} else {
		header("Content-Type: application/octet-stream");
		header("Content-Disposition: inline; filename=\"$filename.gpx\"");
		echo view_render("download_gpx.tpl", array('route' => $route));
	}
} elseif ($_GET["format"] == "kml") {
	if ($DEBUG) {
		print "<pre>";
		print htmlentities(view_render("download_kml.tpl", array('route' => $route)));
		print "</pre>";
	} else {
		header("Content-Type: application/octet-stream");
		header("Content-Disposition: inline; filename=\"$filename.kml\"");
		echo view_render("download_kml.tpl", array('route' => $route));
	}
}
