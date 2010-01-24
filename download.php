<?php

require_once("config.php");
require_once("$SMARTY_DIR/Smarty.class.php");

if (get_magic_quotes_gpc()) {
	$route = json_decode(stripslashes($_GET["route"]), true);
} else {
	$route = json_decode($_GET["route"], true);
}

$route["turnpoints"] = json_decode($route["turnpoints"], true);
$filename = preg_replace("/[^\\s\\w\\-.]+/", "", implode(" ", array($route["location"], $route["distance"], $route["description"])));
$smarty = new Smarty;
$smarty->assign("route", $route);
if ($_GET["format"] == "gpx") {
	header("Content-Type: application/octet-stream");
	header("Content-Disposition: inline; filename=\"$filename.gpx\"");
	$smarty->display("download_gpx.tpl");
}

?>
