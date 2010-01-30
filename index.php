<?php

require_once("config.php");
require_once("$SMARTY_DIR/Smarty.class.php");

$smarty = new Smarty;
$smarty->assign("GOOGLE_MAPS_API_KEY", $GOOGLE_MAPS_API_KEY);
$smarty->assign("location", isset($_GET["location"]) ? $_GET["location"] : $DEFAULT_LOCATION);
$smarty->assign("flightType", isset($_GET["flightType"]) ? $_GET["flightType"] : $DEFAULT_FLIGHT_TYPE);
$smarty->assign("turnpoints", json_encode(isset($_GET["turnpoints"]) ? json_decode($_GET["turnpoints"]) : $DEFAULT_TURNPOINTS));
$smarty->assign("sector", json_encode(isset($_GET["sector"]) ? json_decode($_GET["sector"]) : $DEFAULT_SECTOR));
$smarty->display("index.tpl");

?>
