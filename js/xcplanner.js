//  XC Planner  Google Maps XC planning tool
//  Copyright (C) 2009, 2010  Tom Payne
//
//  This program is free software: you can redistribute it and/or modify
//  it under the terms of the GNU General Public License as published by
//  the Free Software Foundation, either version 3 of the License, or
//  (at your option) any later version.
//
//  This program is distributed in the hope that it will be useful,
//  but WITHOUT ANY WARRANTY; without even the implied warranty of
//  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//  GNU General Public License for more details.
//
//  You should have received a copy of the GNU General Public License
//  along with this program.  If not, see <http://www.gnu.org/licenses/>.

var R = 6371000.0;
var COLOR = {
	good: "#ff00ff",
	better: "#00ffff",
	best: "#ffff00",
	invalid: "#ff0000",
	marker: "#ff00ff",
	circuit: "#ffff00",
	faiSectors: ["#00ff00", "#0000ff", "#ff0000"]
};

var triangleMarkerColors = COLOR.faiSectors;
var olc5MarkerColors = [COLOR.marker, COLOR.faiSectors[0], COLOR.faiSectors[1], COLOR.faiSectors[2], COLOR.marker];

var flightType = null;
var flight = null;

var geocoder = null;
var map = null;
var takeoffLatLng = null;
var takeoffIcon = null;
var takeoffMarkers = {};
var takeoffDrag = null;
var defaultTurnpointLatLngs = [];
var defaultStartLatLng = null;
var turnpointMarkers = [];
var overlays = null;
var startMarker = null;
var rev = 0;
var elevationCache = {};
var airspaceTileLayerOverlay = null;
var corrTileLayerOverlay = null;

var leagues = {
	"Coupe F\u00e9d\u00e9rale de Distance": {
		cfd2: {
			description: "Distance libre",
			n: 2
		},
		cfd3: {
			description: "Distance libre (1 point)",
			n: 3
		},
		cfd4: {
			description: "Distance libre (2 points)",
			n: 4
		},
		cfd2c: {
			circuit: true,
			description: "Aller-retour",
			multiplier: 1.2,
			n: 2,
			score: XCScoreOutAndReturn,
			circuitSize: 3000.0
		},
		cfd3c: {
			circuit: true,
			description: "Triangle plat ou FAI",
			markerColors: triangleMarkerColors,
			n: 3,
			score: XCScoreTriangleCFD,
			circuitSize: 3000.0
		},
		cfd4c: {
			circuit: true,
			description: "Quadrilat\u00e8re",
			n: 4,
			score: XCScoreQuadrilateralCFD,
			circuitSize: 3000.0
		}
	},
	"Leonardo / OLC": {
		olc2: {
			description: "Free flight",
			multiplier: 1.5,
			n: 2
		},
		olc3: {
			description: "Free flight via a turnpoint",
			multiplier: 1.5,
			n: 3
		},
		olc4: {
			description: "Free flight via 2 turnpoints",
			multiplier: 1.5,
			n: 4
		},
		olc5: {
			description: "Free flight via 3 turnpoints",
			markerColors: olc5MarkerColors,
			multiplier: 1.5,
			n: 5,
			score: XCScoreOLC
		},
		olc3c: {
			circuit: true,
			description: "Flat or FAI triangle",
			markerColors: triangleMarkerColors,
			n: 3,
			score: XCScoreTriangleOLC
		}
	},
	"UK National XC League": {
		ukxcl2: {
			description: "Open distance",
			n: 2
		},
		ukxcl3: {
			description: "Turnpoint flight",
			n: 3
		},
		ukxcl4: {
			description: "Turnpoint flight (2 turnpoints)",
			n: 4
		},
		ukxcl5: {
			description: "Turnpoint flight (3 turnpoints)",
			n: 5
		},
		ukxcl2c: {
			circuit: true,
			description: "Out and return",
			n: 2,
			score: XCScoreOutAndReturnUKXCL,
			circuitSize: 400.0
		},
		ukxcl3c: {
			circuit: true,
			description: "Flat or FAI triangle",
			markerColors: triangleMarkerColors,
			n: 3,
			score: XCScoreTriangleUKXCL,
			circuitSize: 400.0
		},
		ukxcl2d: {
			description: "Flight to goal",
			multiplier: 1.25,
			n: 2,
			circuitSize: 400.0
		}
	},
	"XContest": {
		xc2: {
			description: "Free flight",
			n: 2
		},
		xc3: {
			description: "Free flight via a turnpoint",
			n: 3
		},
		xc4: {
			description: "Free flight via 2 turnpoints",
			n: 4
		},
		xc5: {
			description: "Free flight via 3 turnpoints",
			markerColors: olc5MarkerColors,
			n: 5,
			score: XCScoreXC
		},
		xc3c: {
			circuit: true,
			description: "Flat or FAI triangle",
			markerColors: triangleMarkerColors,
			n: 3,
			score: XCScoreTriangleXC
		}
	}
};

var coordFormats = {
	d: "dd.ddddd\u00b0",
	dm: "dd\u00b0 mm.mmm\u2032",
	dms: "dd\u00b0 mm\u2032 ss\u2033",
	utm: "UTM",
	os: "OS grid"
};

var elevationFormats = {
	m: function(m) { return m.toString() + " m"; },
	feet: function(m) { return (m * 3.2808399).toFixed(0) + " ft"; }
};

var distanceFormats = {
	km: function(m) { return (m / 1000.0).toFixed(2) + " km"; },
	miles: function(m) { return (m / 1609.0).toFixed(2) + " mi"; },
	nm: function(m) { return (m / 1852.0).toFixed(2) + " nm"; }
};

function sum(enumerable) {
	return enumerable.inject(0, function(a, x) { return a + x; });
}

function initialBearingTo(latLng1, latLng2) {
	var y = Math.sin(latLng1.lngRadians() - latLng2.lngRadians()) * Math.cos(latLng2.latRadians());
	var x = Math.cos(latLng1.latRadians()) * Math.sin(latLng2.latRadians()) - Math.sin(latLng1.latRadians()) * Math.cos(latLng2.latRadians()) * Math.cos(latLng1.lngRadians() - latLng2.lngRadians());
	return -Math.atan2(y, x);
}

function latLngAt(latLng, bearing, distance) {
	var lat = Math.asin(Math.sin(latLng.latRadians()) * Math.cos(distance) + Math.cos(latLng.latRadians()) * Math.sin(distance) * Math.cos(bearing));
	var lng = latLng.lngRadians() + Math.atan2(Math.sin(bearing) * Math.sin(distance) * Math.cos(latLng.latRadians()), Math.cos(distance) - Math.sin(latLng.latRadians()) * Math.sin(lat));
	return new GLatLng(180.0 * lat / Math.PI, 180.0 * lng / Math.PI);
}

function formatElevation(m) {
	return m == -9999 ? "" : elevationFormats[$F("elevationFormat")](m);
}

function formatDistance(m) {
	return distanceFormats[$F("distanceFormat")](m);
}

function formatLatLng(latLng, tr) {
	var coordFormat = $F("coordFormat");
	if (coordFormat == "utm") {
		var utmref = new LatLng(latLng.lat(), latLng.lng()).toUTMRef();
		tr.appendChild(new Element("td").update(utmref.lngZone + utmref.latZone));
		tr.appendChild(new Element("td", {align: "right"}).update(utmref.easting.toFixed(0)));
		tr.appendChild(new Element("td", {align: "right"}).update(utmref.northing.toFixed(0)));
	} else if (coordFormat == "os") {
		var ll = new LatLng(latLng.lat(), latLng.lng());
		ll.WGS84ToOSGB36();
		tr.appendChild(new Element("td", {align: "right"}).update(ll.toOSRef().toSixFigureString()));
	} else {
		var formatter = Prototype.K;
		if (coordFormat == "d") {
			formatter = function(deg) {
				tr.appendChild(new Element("td", {align: "right"}).update(deg.toFixed(5) + "\u00b0"));
			};
		} else if (coordFormat == "dm") {
			formatter = function(deg) {
				var d = parseInt(deg, 10);
				var min = 60 * (deg - d);
				tr.appendChild(new Element("td", {align: "right"}).update(d.toString() + "\u00b0"));
				tr.appendChild(new Element("td", {align: "right"}).update(min.toFixed(3) + "\u2032"));
			};
		} else if (coordFormat == "dms") {
			formatter = function(deg) {
				var d = parseInt(deg, 10);
				var min = 60 * (deg - d);
				var m = parseInt(min, 10);
				var sec = 60 * (min - m);
				tr.appendChild(new Element("td", {align: "right"}).update(d.toString() + "\u00b0"));
				tr.appendChild(new Element("td", {align: "right"}).update(m.toString() + "\u2032"));
				tr.appendChild(new Element("td", {align: "right"}).update(sec.toFixed(0) + "\u2033"));
			};
		}
		formatter(Math.abs(latLng.lat()));
		tr.appendChild(new Element("td").update(latLng.lat() < 0.0 ? "S" : "N"));
		formatter(Math.abs(latLng.lng()));
		tr.appendChild(new Element("td").update(latLng.lng() < 0.0 ? "W" : "E"));
	}
}

function isClockwise(pixels) {
	return ((pixels[1].y - pixels[0].y) * (pixels[2].x - pixels[0].x) - (pixels[2].y - pixels[0].y) * (pixels[1].x - pixels[0].x)) < 0;
}

function isConvex(pixels) {
	var prev = pixels[pixels.length - 1];
	var deltas = pixels.map(function(pixel) {
		var delta = new GPoint(pixel.x - prev.x, pixel.y - prev.y);
		prev = pixel;
		return delta;
	});
	prev = deltas[deltas.length - 1];
	var crossProducts = deltas.map(function(delta) {
		crossProduct = delta.x * prev.y - delta.y * prev.x;
		prev = delta;
		return crossProduct;
	});
	return crossProducts.max() < 0 || 0 < crossProducts.min();
}

function arrowhead(latLngs, length, phi) {
	var pixels = latLngs.map(function(latLng) { return map.fromLatLngToContainerPixel(latLng); });
	var delta = new GPoint(pixels[1].x - pixels[0].x, pixels[1].y - pixels[0].y);
	var theta = Math.atan2(delta.y, delta.x);
	var result = [];
	result.push(pixels[1]);
	result.push(new GPoint(pixels[1].x - length * Math.cos(theta + phi), pixels[1].y - length * Math.sin(theta + phi)));
	result.push(new GPoint(pixels[1].x - 0.5 * length * Math.cos(theta), pixels[1].y - 0.5 * length * Math.sin(theta)));
	result.push(new GPoint(pixels[1].x - length * Math.cos(theta - phi), pixels[1].y - length * Math.sin(theta - phi)));
	result.push(pixels[1]);
	return result.map(function(pixel) { return map.fromContainerPixelToLatLng(pixel); });
}

function circle(latLng, r, n) {
	return $R(0, n).map(function(i) { return latLngAt(latLng, 2.0 * Math.PI * i / n, r / R); });
}

function faiSector(pixels) {
	var flip = isClockwise(pixels) ? 1 : -1;
	var delta = new GPoint(pixels[1].x - pixels[0].x, pixels[1].y - pixels[0].y);
	var theta = flip * Math.atan2(delta.y, delta.x);
	var cos_theta = Math.cos(theta);
	var sin_theta = Math.sin(theta);
	var a, b, x, y;
	var c = Math.sqrt(delta.x * delta.x + delta.y * delta.y);
	var result = [];
	for (ap = 28; ap < 44; ++ap) {
		a = c * ap / 28.0;
		b = c * (72.0 - ap) / 28.0;
		x = (b * b + c * c - a * a) / (2 * c);
		y = Math.sqrt(b * b - x * x);
		result.push(new GPoint(pixels[0].x + x * cos_theta - y * sin_theta, pixels[0].y + flip * (x * sin_theta + y * cos_theta)));
	}
	for (cp = 28; cp < 44; ++cp) {
		a = c * (72.0 - cp) / cp;
		b = c * 28.0 / cp;
		x = (b * b + c * c - a * a) / (2 * c);
		y = Math.sqrt(b * b - x * x);
		result.push(new GPoint(pixels[0].x + x * cos_theta - y * sin_theta, pixels[0].y + flip * (x * sin_theta + y * cos_theta)));
	}
	for (cp = 44; cp >= 28; --cp) {
		a = c * 28.0 / cp;
		b = c * (72.0 - cp) / cp;
		x = (b * b + c * c - a * a) / (2 * c);
		y = Math.sqrt(b * b - x * x);
		result.push(new GPoint(pixels[0].x + x * cos_theta - y * sin_theta, pixels[0].y + flip * (x * sin_theta + y * cos_theta)));
	}
	return result.map(function(pixel) { return map.fromContainerPixelToLatLng(pixel); });
}

function sector(latLng, theta, r, phi, n) {
	var result = [];
	result.push(latLng);
	$R(0, n).each(function(i) {
		result.push(latLngAt(latLng, theta + (i / n - 0.5) * phi, r / R));
	});
	result.push(latLng);
	return result;
}

function XCGo() {
	geocoder.getLatLng($F("location"), function(latLng) {
		map.setCenter(latLng);
	});
}

function XCGoOnEnter(e) {
	if (window.event) {
		if (window.event.keyCode == 13) {
			XCGo();
		}
	} else if (e) {
		if (e.which == 13) {
			XCGo();
		}
	}
}

function XCLoad() {
	if (!GBrowserIsCompatible()) {
		return;
	}
	$("location").setValue($F("defaultLocation"));
	$H(leagues).each(function(leaguePair) {
		var optgroup = new Element("optgroup", {label: leaguePair[0]});
		$H(leaguePair[1]).each(function(flightTypePair) {
			optgroup.appendChild(new Element("option", {label: flightTypePair[1].description, value: flightTypePair[0]}).update(flightTypePair[1].description));
		});
		$("flightType").appendChild(optgroup);
	});
	$("flightType").setValue($F("defaultFlightType"));
	var bounds = null;
	var defaultTurnpoints = $F("defaultTurnpoints") && JSON.parse($F("defaultTurnpoints"));
	if (defaultTurnpoints) {
		defaultTurnpoints.each(function(pair, i) {
			defaultTurnpointLatLngs[i] = new GLatLng(pair[0], pair[1]);
			if (bounds) {
				bounds.extend(defaultTurnpointLatLngs[i]);
			} else {
				bounds = new GLatLngBounds(defaultTurnpointLatLngs[i], defaultTurnpointLatLngs[i]);
			}
		});
	}
	var defaultStart = $F("defaultStart") && JSON.parse($F("defaultStart"));
	if (defaultStart) {
		defaultStartLatLng = new GLatLng(defaultStart[0], defaultStart[1]);
		if (bounds) {
			bounds.extend(defaultStartLatLng);
		} else {
			bounds = new GLatLngBounds(defaultStartLatLng, defaultStartLatLng);
		}
	}
	$H(coordFormats).each(function(coordFormatPair) {
		$("coordFormat").appendChild(new Element("option", {label: coordFormatPair[1], value: coordFormatPair[0]}).update(coordFormatPair[1]));
	});
	$("coordFormat").setValue("dms");
	$H(distanceFormats).each(function(distanceFormatPair) {
		$("distanceFormat").appendChild(new Element("option", {label: distanceFormatPair[0], value: distanceFormatPair[0]}).update(distanceFormatPair[0]));
	});
	$("distanceFormat").setValue("km");
	$H(elevationFormats).each(function(elevationFormatPair) {
		$("elevationFormat").appendChild(new Element("option", {label: elevationFormatPair[0], value: elevationFormatPair[0]}).update(elevationFormatPair[0]));
	});
	$("elevationFormat").setValue("m");
	XCResize();
	geocoder = new GClientGeocoder();
	map = new GMap2($("map"));
	map.setUIToDefault();
	map.setMapType(G_PHYSICAL_MAP);
	var copyright = new GCopyrightCollection("\u00a9 ");
	copyright.addCopyright(new GCopyright("XContest", new GLatLngBounds(new GLatLng(-90, -180), new GLatLng(90, 180)), 0, "\u00a9 XContest"));
	var tileLayer = new GTileLayer(copyright);
	tileLayer.getTileUrl = function(tile, zoom) { return "http://maps.pgweb.cz/airspace/" + zoom.toString() + "/" + tile.x.toString() + "/" + tile.y.toString(); };
	tileLayer.isPng = function() { return true; };
	tileLayer.getOpacity = function() { return 0.75; };
	airspaceTileLayerOverlay = new GTileLayerOverlay(tileLayer);
	tileLayer = new GTileLayer(copyright);
	tileLayer.getTileUrl = function(tile, zoom) { return "http://maps.pgweb.cz/corr/" + zoom.toString() + "/" + tile.x.toString() + "/" + tile.y.toString(); };
	tileLayer.isPng = function() { return true; };
	tileLayer.getOpacity = function() { return 0.75; };
	corrTileLayerOverlay = new GTileLayerOverlay(tileLayer);
	GEvent.addListener(map, "zoomend", XCUpdateRoute);
	takeoffIcon = new GIcon(G_DEFAULT_ICON);
	takeoffIcon.image = "http://maps.google.com/mapfiles/kml/pal2/icon13.png";
	takeoffIcon.shadow = "http://maps.google.com/mapfiles/kml/pal2/icon13s.png";
	takeoffIcon.iconSize = new GSize(32, 32);
	takeoffIcon.iconAnchor = new GPoint(13, 24);
	takeoffIcon.infoWindowAnchor = new GPoint(13, 24);
	takeoffIcon.shadowSize = new GSize(32, 32);
	if (bounds) {
		map.setCenter(bounds.getCenter(), map.getBoundsZoomLevel(bounds));
		XCSetDefaultTurnpoints(false);
		XCUpdateFlightType();
	} else {
		geocoder.getLatLng($F("location"), function(latLng) {
			map.setCenter(latLng, 10);
			XCSetDefaultTurnpoints(false);
			XCUpdateFlightType();
		});
	}
}

function XCHere() {
	XCSetDefaultTurnpoints(true);
	turnpointMarkers.each(function(marker, i) {
		marker.setLatLng(defaultTurnpointLatLngs[i]);
		marker.ele = -9999;
		marker.rev = ++rev;
	});
	if (startMarker) {
		startMarker.setLatLng(defaultStartLatLng);
		startMarker.ele = -9999;
		startMarker.rev = ++rev;
	}
	XCUpdateRoute();
	XCUpdateElevations();
}

function XCSaveDefaultTurnpoints() {
	turnpointMarkers.each(function(marker, i) {
		defaultTurnpointLatLngs[i] = marker.getLatLng();
	});
	if (startMarker) {
		defaultStartLatLng = startMarker.getLatLng();
	}
}

function XCSetDefaultTurnpoints(replace) {
	var bounds = map.getBounds();
	var sw = bounds.getSouthWest();
	var ne = bounds.getNorthEast();
	$R(0, 5, true).each(function(i) {
		if (replace || !defaultTurnpointLatLngs[i]) {
			var lat = sw.lat() + [2, 2, 1, 1, 1.5][i] * (ne.lat() - sw.lat()) / 3;
			var lng = sw.lng() + [1, 2, 2, 1, 1.5][i] * (ne.lng() - sw.lng()) / 3;
			defaultTurnpointLatLngs[i] = new GLatLng(lat, lng);
		}
	});
	if (replace || !defaultStartLatLng) {
		defaultStartLatLng = bounds.getCenter();
	}
}

function XCResize() {
	$("map").style.width = (document.viewport.getWidth() - 305) + "px";
	$("map").style.height = (document.viewport.getHeight() - 25) + "px";
}

function XCReverseRoute() {
	var latLngs = turnpointMarkers.map(function(marker) { return marker.getLatLng(); });
	turnpointMarkers.each(function(marker, i) {
		marker.setLatLng(latLngs[latLngs.length - 1 - i]);
		marker.ele = -9999;
		marker.rev = ++rev;
	});
	XCUpdateRoute();
	XCUpdateElevations();
}

function XCRotateRoute(delta) {
	var latLngs = turnpointMarkers.map(function(marker) { return marker.getLatLng(); });
	turnpointMarkers.each(function(marker, i) {
		marker.setLatLng(latLngs[(i + delta + latLngs.length) % latLngs.length]);
		marker.ele = -9999;
		marker.rev = ++rev;
	});
	XCUpdateRoute();
	XCUpdateElevations();
}

function XCScore(flight) {
	flight.circuit = flightType.circuit;
	flight.color = COLOR.good;
	flight.description = flightType.description;
	flight.distance = flight.totalDistance;
	flight.multiplier = flightType.multiplier || 1.0;
	flight.score = flight.totalDistance * flight.multiplier / 1000.0;
	flight.circuitCenter = null;
	flight.circuitSize = flightType.circuitSize;
	flight.circuitTarget = null;
	return flight;
}

function XCScoreOutAndReturn(flight) {
	flight.circuit = true;
	flight.color = COLOR.good;
	flight.description = flightType.description;
	flight.distance = flight.totalDistance;
	flight.multiplier = flightType.multiplier;
	flight.score = flight.totalDistance * flightType.multiplier / 1000.0;
	flight.circuitCenter = startMarker;
	flight.circuitSize = flightType.circuitSize;
	flight.circuitTarget = turnpointMarkers[1];
	return flight;
}

function XCScoreOutAndReturnUKXCL(flight) {
	flight.circuit = true;
	flight.distance = flight.totalDistance;
	flight.circuitCenter = startMarker;
	flight.circuitSize = flightType.circuitSize;
	flight.circuitTarget = turnpointMarkers[1];
	if (flight.totalDistance < 15000.0) {
		flight.color = COLOR.invalid;
		flight.description = "Invalid";
		flight.multiplier = 0.0;
	} else if (flight.totalDistance < 25000.0) {
		flight.color = COLOR.good;
		flight.description = flightType.description;
		flight.multiplier = 1.5;
	} else {
		flight.color = COLOR.better;
		flight.description = flightType.description;
		flight.multiplier = 2.0;
	}
	flight.score = flight.totalDistance * flight.multiplier / 1000.0;
	return flight;
}

function XCScoreFivePointFlight(flight, multipliers) {
	var freeFlight = Object.clone(flight);
	freeFlight.circuit = false;
	freeFlight.color = COLOR.good;
	freeFlight.description = flightType.description;
	freeFlight.distance = freeFlight.totalDistance;
	freeFlight.multiplier = multipliers.freeFlight;
	freeFlight.score = freeFlight.totalDistance * freeFlight.multiplier / 1000.0;
	freeFlight.circuitCenter = turnpointMarkers[0];
	freeFlight.circuitSize = 0.2 * triangleDistance;
	freeFlight.circuitTarget = turnpointMarkers[4];
	var triangleDistances = [flight.distances[1], flight.distances[2], flight.latLngs[1].distanceFrom(flight.latLngs[3], R)];
	var triangleDistance = sum(triangleDistances);
	var gapDistance = flight.latLngs[4].distanceFrom(flight.latLngs[0], R);
	if (gapDistance > 0.2 * triangleDistance) {
		return freeFlight;
	}
	freeFlight.faiMarkers = [turnpointMarkers[1], turnpointMarkers[2], turnpointMarkers[3]];
	var triangleFlight = Object.clone(flight);
	triangleFlight.circuit = true;
	triangleFlight.distance = triangleDistance - gapDistance;
	triangleFlight.faiMarkers = freeFlight.faiMarkers;
	triangleFlight.circuitCenter = turnpointMarkers[0];
	triangleFlight.circuitSize = 0.2 * triangleDistance;
	triangleFlight.circuitTarget = turnpointMarkers[4];
	if (triangleDistances.min() / triangleDistance < 0.28) {
		triangleFlight.color = COLOR.better;
		triangleFlight.description = "Flat triangle";
		triangleFlight.multiplier = multipliers.flatTriangle;
	} else {
		triangleFlight.color = COLOR.best;
		triangleFlight.description = "FAI triangle";
		triangleFlight.multiplier = multipliers.faiTriangle;
	}
	triangleFlight.score = triangleFlight.distance * triangleFlight.multiplier / 1000.0;
	if (freeFlight.score > triangleFlight.score) {
		return freeFlight;
	} else {
		return triangleFlight;
	}
}

function XCScoreOLC(flight) {
	return XCScoreFivePointFlight(flight, {freeFlight: 1.5, flatTriangle: 1.75, faiTriangle: 2.0});
}

function XCScoreXC(flight) {
	return XCScoreFivePointFlight(flight, {freeFlight: 1.0, flatTriangle: 1.2, faiTriangle: 1.4});
}

function XCScoreQuadrilateralCFD(flight) {
	flight.circuit = true;
	flight.distance = flight.totalDistance;
	flight.circuitCenter = startMarker;
	flight.circuitSize = flightType.circuitSize;
	flight.circuitTarget = turnpointMarkers[3];
	var pixels = turnpointMarkers.map(function(marker) { return map.fromLatLngToContainerPixel(marker.getLatLng()); });
	if (flight.distances.min() / flight.totalDistance < 0.15 || !isConvex(pixels)) {
		flight.color = COLOR.invalid;
		flight.description = "Invalid";
		flight.multiplier = 0.0;
	} else {
		flight.color = COLOR.good;
		flight.description = "Quadrilatère";
		flight.multiplier = 1.2;
	}
	flight.score = flight.totalDistance * flight.multiplier / 1000.0;
	return flight;
}

function XCScoreTriangle(flight, flat, fai, circuitSize) {
	flight.circuit = true;
	flight.distance = flight.totalDistance;
	flight.faiMarkers = turnpointMarkers;
	flight.circuitCenter = startMarker;
	flight.circuitSize = circuitSize;
	flight.circuitTarget = turnpointMarkers[2];
	if (flight.distances.min() / flight.totalDistance < 0.28) {
		flight.color = COLOR.good;
		flight.description = flat.description;
		flight.multiplier = flat.multiplier;
	} else {
		flight.color = COLOR.best;
		flight.description = fai.description;
		flight.multiplier = fai.multiplier;
	}
	flight.score = flight.totalDistance * flight.multiplier / 1000.0;
	return flight;
}

function XCScoreTriangleCFD(flight) {
	return XCScoreTriangle(flight, {description: "Triangle plat", multiplier: 1.2}, {description: "Triangle FAI", multiplier: 1.4}, flightType.circuitSize);
}

function XCScoreTriangleOLC(flight) {
	return XCScoreTriangle(flight, {description: "Flat triangle", multiplier: 1.75}, {description: "FAI triangle", multiplier: 2.0}, 0.2 * flight.totalDistance);
}

function XCScoreTriangleXC(flight) {
	return XCScoreTriangle(flight, {description: "Flat triangle", multiplier: 1.2}, {description: "FAI triangle", multiplier: 1.4}, 0.2 * flight.totalDistance);
}

function XCScoreTriangleUKXCL(flight) {
	flight.circuit = true;
	flight.distance = flight.totalDistance;
	flight.faiMarkers = turnpointMarkers;
	flight.circuitCenter = startMarker;
	flight.circuitSize = flightType.circuitSize;
	flight.circuitTarget = turnpointMarkers[2];
	if (flight.distances.min() / flight.totalDistance < 0.28) {
		flight.color = COLOR.good;
		flight.description = "Flat triangle";
		flight.multiplier = flight.totalDistance < 25000.0 ? 1.5 : 2.0;
	} else {
		flight.color = COLOR.best;
		flight.description = "FAI triangle";
		flight.multiplier = flight.totalDistance < 25000.0 ? 2.0 : 2.7;
	}
	flight.score = flight.totalDistance * multiplier / 1000.0;
	return flight;
}

function XCUpdateMarkerElevation(i) {
	var marker = i < 0 ? startMarker : turnpointMarkers[i];
	var latLng = marker.getLatLng();
	var key = (1200 * latLng.lat() + 0.5).toFixed(0) + ":" + (1200 * latLng.lng() + 0.5).toFixed(0);
	if (key in elevationCache) {
		marker.ele = elevationCache[key];
		marker.rev = ++rev;
		$("tp" + (i + 1).toString() + "ele").update(formatElevation(marker.ele));
	} else {
		new Ajax.Request("get_elevation.php", {
			onSuccess: function(response) {
				elevationCache[key] = response.responseJSON.ele;
				if (response.responseJSON.rev > marker.rev) {
					marker.ele = response.responseJSON.ele;
					marker.rev = response.responseJSON.rev;
					$("tp" + (i + 1).toString() + "ele").update(formatElevation(marker.ele));
				}
			},
			parameters: {
				lat: latLng.lat(),
				lng: latLng.lng(),
				rev: ++rev
			}
		});
	}
}

function XCDragMarker(i) {
	if ($F("elevation")) {
		XCUpdateMarkerElevation(i);
	}
	XCUpdateRoute();
}

function XCUpdateFlightType() {
	XCSaveDefaultTurnpoints();
	turnpointMarkers.each(function(m, i) { map.removeOverlay(m); });
	if (startMarker) {
		map.removeOverlay(startMarker);
	}
	flightType = null;
	var key = $F("flightType");
	$H(leagues).find(function(league) {
		if (league[1][key]) {
			flightType = league[1][key];
		}
	});
	var markerColors = flightType.markerColors;
	turnpointMarkers = $R(0, flightType.n, true).map(function(i) {
		var primaryColor = markerColors ? markerColors[i] : COLOR.marker;
		var icon = MapIconMaker.createLabeledMarkerIcon({width: 32, height: 32, label: (i + 1).toString(), primaryColor: primaryColor});
		var marker = new GMarker(defaultTurnpointLatLngs[i], {draggable: true, icon: icon});
		marker.rev = 0;
		marker.ele = -9999;
		GEvent.addListener(marker, "drag", function() { XCDragMarker(i); });
		return marker;
	});
	if (flightType.circuit) {
		var icon = MapIconMaker.createLabeledMarkerIcon({width: 32, height: 32, label: "0", primaryColor: COLOR.marker});
		startMarker = new GMarker(defaultStartLatLng, {draggable: true, icon: icon});
		startMarker.rev = 0;
		startMarker.ele = -9999;
		GEvent.addListener(startMarker, "drag", function() { XCDragMarker(-1); });
	} else {
		startMarker = null;
	}
	turnpointMarkers.each(function(m, i) { map.addOverlay(m); });
	if (startMarker) {
		map.addOverlay(startMarker);
	}
	XCUpdateRoute();
	XCUpdateElevations();
}

function XCLegToTR(flight, i, j) {
	var tr = new Element("tr");
	var td = new Element("td");
	td.appendChild(new Element("input", {type: "submit", value: "\u2295", onclick: "XCZoomLeg(" + i.toString() + ", " + j.toString() + ");", title: "Zoom to leg"}));
	tr.appendChild(td);
	tr.appendChild(new Element("th").update("TP" + (i + 1).toString() + "\u2192TP" + (j + 1).toString()));
	tr.appendChild(new Element("td").update(formatDistance(flight.distances[i])));
	tr.appendChild(new Element("td").update((100.0 * flight.distances[i] / flight.totalDistance).toFixed(1) + "%"));
	return tr;
}

function XCMarkerToTR(marker, i) {
	var tr = new Element("tr");
	var td = new Element("td");
	td.appendChild(new Element("input", {type: "submit", value: "\u2295", onclick: "XCZoomTurnpoint(" + i.toString() + ");", title: "Zoom to turnpoint"}));
	tr.appendChild(td);
	tr.appendChild(new Element("th").update("TP" + (i + 1).toString()));
	formatLatLng(marker.getLatLng(), tr);
	if ($F("elevation")) {
		tr.appendChild(new Element("td", {align: "right", id: "tp" + (i + 1).toString() + "ele"}).update(formatElevation(marker.ele)));
	}
	return tr;
}

function XCUpdateAirspace() {
	if ($F("airspace")) {
		map.addOverlay(airspaceTileLayerOverlay);
	} else {
		map.removeOverlay(airspaceTileLayerOverlay);
	}
}

function XCUpdateCorr() {
	if ($F("corr")) {
		map.addOverlay(corrTileLayerOverlay);
	} else {
		map.removeOverlay(corrTileLayerOverlay);
	}
}

function XCUpdateElevations() {
	if ($F("elevation")) {
		turnpointMarkers.each(function(marker, i) { XCUpdateMarkerElevation(i); });
		if (startMarker) {
			XCUpdateMarkerElevation(-1);
		}
	}
}

function XCLoadTakeoffs() {
	takeoffLatLng = startMarker ? startMarker.getLatLng() : turnpointMarkers[0].getLatLng();
	new Ajax.Request("/leonardo/EXT_takeoff.php", {
		method: "get",
		onSuccess: function(response) {
			var responseJSON = eval("(" + response.responseText + ")");
			responseJSON.waypoints.each(function(waypoint) {
				if (waypoint.type == 1000 && !takeoffMarkers[waypoint.id]) {
					var marker = new GMarker(new GLatLng(waypoint.lat, waypoint.lon), {icon: takeoffIcon, title: waypoint.name});
					var html = "<h3>" + waypoint.name + "</h3>";
					html += "<ul>";
					html += "<li><a href=\"http://www.paraglidingforum.com/leonardo/takeoff/" + waypoint.id + "\" target=\"_new\">Site information</a></li>";
					html += "<li><a href=\"http://www.paraglidingforum.com/leonardo/tracks/world/alltimes/brand:all,cat:0,class:all,xctype:all,club:all,pilot:0_0,takeoff:" + waypoint.id + "\" target=\"_new\">Flights from here</a></li>";
					html += "</ul>";
					html += "<p>Takeoff information courtesy of <a href=\"http:///www.paraglidingforum.com/leonardo/\">Leonardo</a></p>";
					GEvent.addListener(marker, "click", function() {
						marker.openInfoWindowHtml(html);
					});
					marker.added = false;
					takeoffMarkers[waypoint.id] = marker;
				}
			});
			XCUpdateTakeoffs();
		},
		parameters: {
			distance: 50,
			lat: takeoffLatLng.lat(),
			limit: 200,
			lon: takeoffLatLng.lng(),
			op: "get_nearest"
		}
	});
}

function XCUpdateTakeoffs() {
	if ($F("takeoffs")) {
		var latLng = startMarker ? startMarker.getLatLng() : turnpointMarkers[0].getLatLng();
		if (!takeoffLatLng || latLng.distanceFrom(takeoffLatLng) > 10000.0) {
			XCLoadTakeoffs();
		} else {
			$H(takeoffMarkers).each(function(pair) {
				var marker = pair.value;
				if (latLng.distanceFrom(marker.getLatLng()) < 10000.0) {
					if (!marker.added) {
						map.addOverlay(marker);
						marker.added = true;
					}
				} else if (marker.added) {
					map.removeOverlay(marker);
					marker.added = false;
				}
			});
		}
		if (!takeoffDrag) {
			var takeoffMarker = startMarker ? startMarker : turnpointMarkers[0];
			takeoffDrag = GEvent.addListener(takeoffMarker, "drag", function() { XCUpdateTakeoffs(); });
		}
	} else {
		$H(takeoffMarkers).each(function(pair) {
			var marker = pair.value;
			map.removeOverlay(marker);
			marker.added = false;
		});
		if (takeoffDrag) {
			GEvent.removeListener(takeoffDrag);
			takeoffDrag = null;
		}
	}
}

function XCToggleElevations() {
	XCUpdateRoute();
	XCUpdateElevations();
}

function XCUpdateRoute() {
	if (!flightType) {
		return;
	}

	// flight
	var latLngs = turnpointMarkers.map(function(m) { return m.getLatLng(); });
	var distances = $R(0, latLngs.length - 1, true).map(function(i) {
		return latLngs[i + 1].distanceFrom(latLngs[i]);
	});
	if (flightType.circuit) {
		distances.push(latLngs[0].distanceFrom(latLngs[latLngs.length - 1]));
	}
	var score = flightType.score || XCScore;
	flight = score({distances: distances, latLngs: latLngs, totalDistance: sum(distances)});

	// general
	$("distance").update(formatDistance(flight.distance));
	$("description").update(flight.description);
	$("multiplier").update(flight.multiplier.toFixed(2).replace(/0$/, ""));
	$("score").update(flight.score.toFixed(2) + " points");

	// overlays
	var _overlays = overlays;
	overlays = [];
	overlays.push(new GPolyline(latLngs, flight.color, 3, 1.0));
	$R(0, latLngs.length - 1, true).each(function(i) {
		overlays.push(new GPolygon(arrowhead([latLngs[i], latLngs[i + 1]], 16, Math.PI / 8.0), flight.color, 1, 1.0, flight.color, 1.0));
	});
	if (flightType.circuit) {
		overlays.push(new GPolyline([latLngs[latLngs.length - 1], latLngs[0]], flight.color, 1, 0.75));
	}
	if (flightType.circuit && flight.circuit) {
		overlays.push(new GPolyline([latLngs[latLngs.length - 1], startMarker.getLatLng(), latLngs[0]], flight.color, 3, 1.0));
		overlays.push(new GPolygon(arrowhead([startMarker.getLatLng(), latLngs[0]], 16, Math.PI / 8.0), flight.color, 1, 1.0, flight.color, 1.0));
		overlays.push(new GPolygon(arrowhead([latLngs[latLngs.length - 1], startMarker.getLatLng()], 16, Math.PI / 8.0), flight.color, 1, 1.0, flight.color, 1.0));
	}
	if (flight.faiMarkers && $F("faiSectors")) {
		var pixels = flight.faiMarkers.map(function(marker) { return map.fromLatLngToContainerPixel(marker.getLatLng()); });
		overlays.push(new GPolygon(faiSector([pixels[1], pixels[2], pixels[0]]), COLOR.faiSectors[1], 1, 0.0, COLOR.faiSectors[0], 0.25));
		overlays.push(new GPolygon(faiSector([pixels[2], pixels[0], pixels[1]]), COLOR.faiSectors[2], 1, 0.0, COLOR.faiSectors[1], 0.25));
		overlays.push(new GPolygon(faiSector([pixels[0], pixels[1], pixels[2]]), COLOR.faiSectors[0], 1, 0.0, COLOR.faiSectors[2], 0.25));
	}
	if (flight.circuitCenter) {
		if ($F("circuit") == "circle") {
			overlays.push(new GPolygon(circle(flight.circuitCenter.getLatLng(), flight.circuitSize, 32), COLOR.circuit, 1, 0.0, COLOR.circuit, 0.25));
		} else if ($F("circuit") == "sector") {
			var theta = initialBearingTo(flight.circuitCenter.getLatLng(), flight.circuitTarget.getLatLng());
			overlays.push(new GPolygon(sector(flight.circuitCenter.getLatLng(), theta, flight.circuitSize, Math.PI / 2.0, 32), COLOR.circuit, 1, 0.0, COLOR.circuit, 0.25));
		}
	}
	if (_overlays) {
		_overlays.each(function(o) { map.removeOverlay(o); });
	}
	overlays.each(function(o) { map.addOverlay(o); });

	// route table
	var route = new Element("table", {id: "route"});
	$R(0, turnpointMarkers.length - 1, true).each(function(i) {
		route.appendChild(XCLegToTR(flight, i, i + 1));
	});
	if (flightType.circuit) {
		route.appendChild(XCLegToTR(flight, turnpointMarkers.length - 1, 0));
	}
	$("route").replace(route);

	// turnpoints table
	var turnpoints = new Element("table", {id: "turnpoints"});
	if (flight.circuitCenter && !turnpointMarkers.include(flight.circuitCenter)) {
		turnpoints.appendChild(XCMarkerToTR(flight.circuitCenter, -1));
	}
	turnpointMarkers.each(function(marker, i) {
		turnpoints.appendChild(XCMarkerToTR(marker, i));
	});
	$("turnpoints").replace(turnpoints);

	XCUpdateTakeoffs();

	// link
	var pairs = [];
	pairs.push("location=" + escape($F("location")));
	pairs.push("flightType=" + $F("flightType"));
	turnpoints = [];
	turnpointMarkers.each(function(marker) {
		var latLng = marker.getLatLng();
		turnpoints.push("%5B" + latLng.lat().toFixed(5) + "," + latLng.lng().toFixed(5) + "%5D");
	});
	pairs.push("turnpoints=%5B" + turnpoints.join(",") + "%5D");
	if (startMarker) {
		var latLng = startMarker.getLatLng();
		pairs.push("start=%5B" + latLng.lat().toFixed(5) + "," + latLng.lng().toFixed(5) + "%5D");
	}
	$("link").writeAttribute({href: "?" + pairs.join("&")});

	// gpx and kml
	turnpoints = [];
	if (flight.circuitCenter && !turnpointMarkers.include(flight.circuitCenter)) {
		turnpoints.push({
			name: "TP0",
			lat: flight.circuitCenter.getLatLng().lat(),
			lng: flight.circuitCenter.getLatLng().lng()
		});
	}
	turnpointMarkers.each(function(marker, i) {
		var latLng = marker.getLatLng();
		turnpoints.push({
			name: "TP" + (i + 1).toString(),
			lat: latLng.lat(),
			lng: latLng.lng()
		});
	});
	route = {
		circuit: flightType.circuit,
		description: flight.description,
		distance: formatDistance(flight.distance),
		"location": $F("location"),
		turnpoints: turnpoints
	};
	$("gpx").writeAttribute({href: "download.php?format=gpx&route=" + escape(JSON.stringify(route))});
	$("kml").writeAttribute({href: "download.php?format=kml&route=" + escape(JSON.stringify(route))});
}

function XCUnload() {
	geocoder = null;
	map = null;
	turnpointMarkers = null;
	startMarker = null;
	overlays = null;
	GUnload();
}

function XCZoomLeg(i, j) {
	var bounds = new GLatLngBounds(turnpointMarkers[i].getLatLng(), turnpointMarkers[i].getLatLng());
	bounds.extend(turnpointMarkers[j].getLatLng());
	map.setCenter(bounds.getCenter(), map.getBoundsZoomLevel(bounds));
}

function XCZoomRoute() {
	var bounds = new GLatLngBounds(turnpointMarkers[0].getLatLng(), turnpointMarkers[0].getLatLng());
	turnpointMarkers.each(function(marker) {
		bounds.extend(marker.getLatLng());
	});
	map.setCenter(bounds.getCenter(), map.getBoundsZoomLevel(bounds));
}

function XCZoomTurnpoint(i) {
	var marker = i < 0 ? flight.circuitCenter : turnpointMarkers[i];
	var bounds = new GLatLngBounds(marker.getLatLng(), marker.getLatLng());
	map.setCenter(bounds.getCenter(), map.getBoundsZoomLevel(bounds));
}
