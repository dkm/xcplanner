<?php if (!isset($rendering)) die();?><?xml version="1.0" encoding="utf-8"?>
<kml xmlns="http://earth.google.com/kml/2.0">
	<Folder>
		<name><?php printf("%s %s %s",
      view_escape($route["location"]),
      $route["distance"],
      view_escape($route["description"]));
    ?></name>
		<Placemark>
			<name>Route</name>
			<LineString>
				<coordinates>
<?php foreach ($route["turnpoints"] as $turnpoint) : ?>
          <?php echo sprintf("%f, %f, %d\n",
            $turnpoint["lng"], 
            $turnpoint["lat"],
            isset($turnpoint["ele"])?$turnpoint["ele"]: 0
          ); ?>
<?php endforeach; ?>
<?php if (isset($route["circuit"])) : ?>
          <?php echo sprintf("%f, %f, %d\n",
            $route["turnpoint"][0]["lng"],
            $route["turnpoint"][0]["lat"],
            isset($route["turnpoint"][0]["ele"])?$route["turnpoint"][0]["ele"]: 0
          ); ?>
<?php endif; ?>
				</coordinates>
				<tessellate>1</tessellate>
			</LineString>
		</Placemark>
		<Folder>
			<name>Waypoints</name>
<?php foreach ($route["turnpoints"] as $turnpoint) : ?>
			<Placemark>
				<name><?php echo view_escape($turnpoint["name"]); ?></name>
				<Point>
					<coordinates><?php echo sprintf("%f, %f, %d",
            $turnpoint["lng"],
            $turnpoint["lat"],
            isset($turnpoint["ele"])?$turnpoint["ele"]: 0
          ); ?></coordinates>
				</Point>
			</Placemark>
<?php endforeach; ;?>
		</Folder>
	</Folder>
</kml>
