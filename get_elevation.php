<?php

require_once("config.php");

$DEBUG = 0;

if ($_SERVER["REQUEST_METHOD"] == "GET") {
	$lat = floatval($_GET["lat"]);
	$lng = floatval($_GET["lng"]);
	$rev = floatval($_GET["rev"]);
} else if ($_SERVER["REQUEST_METHOD"] == "POST") {
	$lat = floatval($_POST["lat"]);
	$lng = floatval($_POST["lng"]);
	$rev = floatval($_POST["rev"]);
}

$result = array(ele => $get_elevation($lat, $lng), rev => $rev);

if ($DEBUG) {
	print "<pre>";
	print json_encode($result);
	print "</pre>";
} else {
	header("Content-type: application/json");
	print json_encode($result);
}

?>
