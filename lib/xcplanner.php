<?php

function get_elevation_srtm($lat, $lng) {
	global $SRTM_TILE_DIR;
	$x = intval(1200 * ($lng + 185) + 0.5);
	$y = intval(1200 * (65 - $lat) + 0.5);
	$tile_filename = sprintf("%s/srtm_%02d_%02d.tile", $SRTM_TILE_DIR, intval($x / 6000), intval($y / 6000));
	if (file_exists($tile_filename) && filesize($tile_filename)) {
		$file = fopen($tile_filename, "rb");
		fseek($file, 2 * (6000 * ($y % 6000) + ($x % 6000)));
		$ele = unpack("n", fread($file, 2));
		fclose($file);
		return $ele[1];
	} else {
		return -9999;
	}
}

function get_elevation_usgs($lat, $lng) {
	$query_string = "X_Value=$lng&Y_Value=$lat&Elevation_Units=METERS&Source_Layer=-1&Elevation_Only=";
	$url = "http://gisdata.usgs.net/XMLWebServices2/Elevation_Service.asmx/getElevation?$query_string";
	$response = file_get_contents($url);
	if (preg_match("/<Elevation>\s*(\d+)\s*<\/Elevation>/", $response, $matches)) {
		return (int) $matches[1];
	} else {
		return -9999;
	}
}

function get_elevation_combined($lat, $lng) {
	$ele = get_elevation_srtm($lat, $lng);
	if ($ele != -9999) {
		return $ele;
	}
	return get_elevation_usgs($lat, $lng);
}

?>
