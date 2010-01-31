<?php

require_once("config.php");
require_once("$SMARTY_DIR/Smarty.class.php");

if (function_exists("date_default_timezone_set"))
    date_default_timezone_set("UTC");

$smarty = new Smarty;
$smarty->assign("GOOGLE_MAPS_API_KEY", $GOOGLE_MAPS_API_KEY);

// location
if(isset($_GET['location']))
{
	$smarty->assign('location', $_GET['location']);
}
else
{
	$smarty->assign('location', 'Doussard, France');
}

// turnpoints
if(isset($_GET['turnpoints']))
{
	$turnpoints = '[';
	$first = true;

	foreach(split(",", $_GET["turnpoints"]) as $turnpoint)
	{
		if(!$first)
		{
			$turnpoints .= ',';
		}

		$first = false;
		list($turnpoint_name, $lat, $lon) = split(":", $turnpoint);
		$turnpoints .= '[' . $lat . ',' . $lon . ']';
	}

	$turnpoints .= ']';

	$smarty->assign('xcload', 'XCLoad(' . $turnpoints . ')');
}
else
{
	$smarty->assign('xcload', 'XCLoad([])');
}

// flight type
$flightTypes['Leonardo'] = array
	(
		'leonardo,2,,' => 'Open distance',
		'leonardo,3,,' => 'Open distance via one turnpoint',
		'leonardo,4,,' => 'Open distance via two turnpoints',
		'leonardo,5,,' => 'Open distance via three turnpoints',
		'leonardo,3,circuit,' => 'Flat or FAI triangle'
	);

$flightTypes['Coupe Fédérale de Distance'] = array
	(
		'cfd,2,,' => 'Distance libre',
		'cfd,3,,' => 'Distance libre (1 point)',
		'cfd,4,,' => 'Distance libre (2 points)',
		'cfd,2,circuit,' => 'Aller-retour',
		'cfd,3,circuit,' => 'Triangle plat ou FAI',
		'cfd,4,circuit,' => 'Quadrilatère'
	);

$flightTypes['UK National XC League'] = array
	(
		'ukxcl-national,2,,' => 'Open distance',
		'ukxcl-national,3,,' => 'Turnpoint flight via one turnpoint',
		'ukxcl-national,4,,' => 'Turnpoint flight via two turnpoints',
		'ukxcl-national,5,,' => 'Turnpoint flight via three turnpoints',
		'ukxcl-national,2,circuit,' => 'Out and return',
		'ukxcl-national,3,circuit,' => 'Flat or FAI triangle',
		'ukxcl-national,2,,declared' => 'Flight to goal',
		'ukxcl-national,2,circuit,declared' => 'Declared out and return',
		'ukxcl-national,3,circuit,declared' => 'Declared FAI triangle'
	);

$flightTypes['XContest'] = array
	(
		'xcontest,2,,' => 'Free flight',
		'xcontest,3,,' => 'Free flight via a turnpoint',
		'xcontest,4,,' => 'Free flight via two turnpoints',
		'xcontest,5,,' => 'Free flight via three turnpoints',
		'xcontest,3,circuit,' => 'Flat or FAI triangle '
	);

$smarty->assign('flightTypes', $flightTypes);

if(isset($_GET['flightType']))
{
	$smarty->assign('selFligthType', $_GET["flightType"]);
}
else
{
	$smarty->assign('selFligthType', 'leonardo,3,circuit,');
}

// coordinate format
$smarty->assign('coordFormats', array
	(
		'd' => 'dd.ddddd&deg;',
		'dm' => 'dd&deg; mm.mmm&prime;',
		'dms' => 'dd&deg; mm&prime; ss&Prime;',
		'utm' => 'UTM',
		'os' => 'OS grid'
  ));

if(isset($_GET['coordFormat']))
{
	$smarty->assign('selCoordFormat', $_GET["coordFormat"]);
}
else
{
	$smarty->assign('selCoordFormat', 'd');
}

// display template
$smarty->display("index.tpl");
?>
