<?php

$GOOGLE_MAPS_API_KEY = "ABQIAAAAmoyS70qBKY-s72ZC4TaYjBT2yXp_ZAY8_ufC3CFXhHIE1NvwkxTaKKlB6EIqEuXqoufaOaKPR7O_6Q";
$SMARTY_DIR = "smarty/";

function get_elevation($lat, $lon) {
	$query_string = "X_Value=$lon&Y_Value=$lat&Elevation_Units=METERS&Source_Layer=-1&Elevation_Only=";
	$url = "http://gisdata.usgs.net/XMLWebServices2/Elevation_Service.asmx/getElevation?$query_string";
	$response = file_get_contents($url);
	if (preg_match("/<Elevation>\s*(\d+)\s*<\/Elevation>/", $response, $matches)) {
		return (int) $matches[1];
	} else {
		return 0;
	}
}

?>
