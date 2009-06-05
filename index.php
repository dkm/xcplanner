<?php

require_once("config.php");
require_once("$SMARTY_DIR/Smarty.class.php");

$smarty = new Smarty;
$smarty->assign("GOOGLE_MAPS_API_KEY", $GOOGLE_MAPS_API_KEY);
$smarty->display("index.tpl");

?>
