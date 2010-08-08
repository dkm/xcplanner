<?php

require_once("xcplanner.php");

$view = array(
  "GOOGLE_MAPS_API_KEY" => $GOOGLE_MAPS_API_KEY,
  "ELEVATION" => $ELEVATION,
  "LEONARDO" => $LEONARDO,
  "XCONTEST" => $XCONTEST,
  "location" => isset($_GET["location"]) ? $_GET["location"] : $DEFAULT_LOCATION,
  "flightType" => isset($_GET["flightType"]) ? $_GET["flightType"] : $DEFAULT_FLIGHT_TYPE,
  "turnpoints" => json_encode(isset($_GET["turnpoints"]) ? json_decode($_GET["turnpoints"]) : $DEFAULT_TURNPOINTS),
  "start" => json_encode(isset($_GET["start"]) ? json_decode($_GET["start"]) : $DEFAULT_START)
);

echo view_render("index.tpl", $view);