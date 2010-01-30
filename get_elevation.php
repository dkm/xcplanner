<?php

require_once("config.php");

if ($_SERVER["REQUEST_METHOD"] == "GET") {
	print $get_elevation(floatval($_GET["lat"]), floatval($_GET["lng"]));
} else if ($_SERVER["REQUEST_METHOD"] == "POST") {
	print $get_elevation(floatval($_POST["lat"]), floatval($_POST["lng"]));
}

?>
