<?php

$GOOGLE_MAPS_API_KEY = "ABQIAAAAmoyS70qBKY-s72ZC4TaYjBT2yXp_ZAY8_ufC3CFXhHIE1NvwkxTaKKlB6EIqEuXqoufaOaKPR7O_6Q";
$SMARTY_DIR = "smarty";
$SRTM_TILE_DIR = "srtm/tile";
$SRTM_TILEZ_DIR = "srtm/tilez";
$DEFAULT_LOCATION = "Fiesch";
$DEFAULT_FLIGHT_TYPE = "olc5";
$DEFAULT_TURNPOINTS = null;
$DEFAULT_START = null;
$XCONTEST = in_array($_SERVER["SERVER_NAME"], array("localhost", "paraglidingforum.com", "www.paraglidingform.com", "xcontest.org", "www.xcontest.org"));
$get_elevation = "get_elevation_srtm";

if (function_exists("date_default_timezone_set"))
    date_default_timezone_set("UTC");

function get_elevation_srtm_tile($lat, $lng) {
	global $SRTM_TILE_DIR;
	$x = intval(1200 * ($lng + 185) + 0.5);
	$y = intval(1200 * (65 - $lat) + 0.5);
	$tile_filename = sprintf("%s/srtm_%02d_%02d.tile", $SRTM_TILE_DIR, intval($x / 6000), intval($y / 6000));
	if (file_exists($tile_filename)) {
		if (!filesize($tile_filename)) {
			return -9999;
		}
		$file = fopen($tile_filename, "rb");
		fseek($file, 2 * (6000 * ($y % 6000) + ($x % 6000)));
		$ele = unpack("s", fread($file, 2));
		fclose($file);
		return $ele[1];
	}
	return -9999;
}

function get_elevation_srtm_tilez($lat, $lng) {
	global $SRTM_TILEZ_DIR;
	$x = intval(1200 * ($lng + 185) + 0.5);
	$y = intval(1200 * (65 - $lat) + 0.5);
	$tilez_filename = sprintf("%s/srtm_%02d_%02d.tilez", $SRTM_TILEZ_DIR, intval($x / 6000), intval($y / 6000));
	if (file_exists($tilez_filename)) {
		if (!filesize($tilez_filename)) {
			return -9999;
		}
		$file = fopen($tilez_filename, "rb");
		fseek($file, 4 * ($y % 6000));
		$offset = unpack("L", fread($file, 4));
		if (!$offset[1]) {
			fclose($file);
			return -9999;
		}
		fseek($file, $offset[1]);
		$buffer = fread($file, 16384);
		fclose($file);
		$length = unpack("L", substr($buffer, 0, 4));
		$row = gzuncompress(substr($buffer, 4, $length[1]));
		$ele = unpack("s", substr($row, 2 * ($x % 6000), 2));
		return $ele[1];
	}
	return -9999;
}

function get_elevation_srtm($lat, $lng) {
	$ele = get_elevation_srtm_tile($lat, $lng);
	if ($ele != -9999) {
		return $ele;
	}
	return get_elevation_srtm_tilez($lat, $lng);
}

function get_elevation_usgs($lat, $lng) {
	$query_string = "X_Value=$lng&Y_Value=$lat&Elevation_Units=METERS&Source_Layer=-1&Elevation_Only=";
	$url = "http://gisdata.usgs.net/XMLWebServices2/Elevation_Service.asmx/getElevation?$query_string";
	$response = file_get_contents($url);
	if (preg_match("/<Elevation>\s*(\d+)\s*<\/Elevation>/", $response, $matches)) {
		return (int) $matches[1];
	}
	return -9999;
}

function get_elevation_combined($lat, $lng) {
	$ele = get_elevation_srtm_tile($lat, $lng);
	if ($ele != -9999) {
		return $ele;
	}
	$ele = get_elevation_srtm_tilez($lat, $lng);
	if ($ele != -9999) {
		return $ele;
	}
	return get_elevation_usgs($lat, $lng);
}

?>
