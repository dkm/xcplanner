<?php if (!isset($rendering)) die();?><?xml version="1.0" encoding="utf-8"?>
<gpx version="1.0" creator="http://github.com/twpayne/xcplanner/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns="http://www.topografix.com/GPX/1/0" xsi:schemaLocation="http://www.topografix.com/GPX/1/0 http://www.topografix.com/GPX/1/0/gpx.xsd">
<?php foreach ($route["turnpoints"] as $turnpoint) : ?>
	<wpt lat="<?php echo $turnpoint["lat"]?>" lon="<?php echo $turnpoint["lng"]?>">
<?php if (isset($turnpoint["ele"])) : ?>
		<ele><?php echo $turnpoint["ele"];?></ele>
<?php endif; ?>
    <name><?php echo view_escape($turnpoint["name"]); ?></name>
	</wpt>
<?php endforeach; ?>
	<rte>
		<name><?php printf("%s %s %s", 
      view_escape($route["location"]),
      $route["distance"],
      view_escape($route["description"]));
    ?></name>
<?php foreach ($route["turnpoints"] as $turnpoint) : ?>
		<rtept lat="<?php echo $turnpoint["lat"]?>" lon="<?php echo $turnpoint["lng"]?>">
<?php if (isset($turnpoint["ele"])) : ?>
		<ele><?php echo $turnpoint["ele"];?></ele>
<?php endif; ?>
    <name><?php echo view_escape($turnpoint["name"]); ?></name>
		</rtept>
<?php endforeach; ?>
<?php if (isset($route["circuit"])) : ?>
		<rtept lat="<?php echo $route["turnpoints"][0]["lat"]; ?>" lon="<?php echo $route["turnpoints"][0]["lng"]; ?>">
<?php if (isset($turnpoint["ele"])) : ?>
			<ele><?php echo $route["turnpoints"][0]["ele"]; ?></ele>
<?php endif; ?>
			<name><?php echo view_escape($route["turnpoints"][0]["name"]); ?></name>
		</rtept>
<?php endif; ?>
	</rte>
</gpx>
