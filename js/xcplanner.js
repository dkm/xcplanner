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
var DEFAULT_ZOOM = 10;
var DEFAULT_TURNPOINT_ZOOM = 13;
var COLOR = {
	good: "#ff00ff",
	better: "#00ffff",
	best: "#ffff00",
	invalid: "#ff0000",
	marker: "#ff00ff",
	sector: "#ffff00",
	faiSectors: ["#ff0000", "#00ff00", "#0000ff"],
};

var flightType = null;
var flight = null;

var geocoder = null;
var map = null;
var turnpointMarkers = null;
var overlays = null;
var sectorMarker = null;

var leagues = {
	"Coupe F\u00e9d\u00e9rale de Distance": {
		cfd2: {
			description: "Distance libre",
			multiplier: 1.0,
			n: 2,
		},
		cfd3: {
			description: "Distance libre (1 point)",
			multiplier: 1.0,
			n: 3,
		},
		cfd4: {
			description: "Distance libre (2 points)",
			multiplier: 1.0,
			n: 4,
		},
		cfd2c: {
			circuit: true,
			description: "Aller-retour",
			multiplier: 1.2,
			n: 2,
			score: XCScoreOutAndReturn,
			sectorSize: 3000.0,
		},
		cfd3c: {
			circuit: true,
			description: "Triangle plat ou FAI",
			n: 3,
			score: XCScoreTriangleCFD,
			sectorSize: 3000.0,
		},
		cfd4c: {
			circuit: true,
			description: "Quadrilat\u00e8re",
			n: 4,
			score: XCScoreQuadrilateralCFD,
			sectorSize: 3000.0,
		},
	},
	"Leonardo / OLC / XContest": {
		olc2: {
			description: "Free flight",
			multiplier: 1.5,
			n: 2,
		},
		olc3: {
			description: "Free flight via a turnpoint",
			multiplier: 1.5,
			n: 3,
		},
		olc4: {
			description: "Free flight via 2 turnpoints",
			multiplier: 1.5,
			n: 4,
		},
		olc5: {
			description: "Free flight via 3 turnpoints",
			multiplier: 1.5,
			n: 5,
			score: XCScoreOLC,
		},
		olc3c: {
			circuit: true,
			description: "Flat or FAI triangle",
			n: 3,
			score: XCScoreTriangleOLC,
		},
	},
	"UK National XC League": {
		ukxcl2: {
			description: "Open distance",
			multiplier: 1.0,
			n: 2,
		},
		ukxcl3: {
			description: "Turnpoint flight",
			multiplier: 1.0,
			n: 3,
		},
		ukxcl4: {
			description: "Turnpoint flight (2 turnpoints)",
			multiplier: 1.0,
			n: 4,
		},
		ukxcl5: {
			description: "Turnpoint flight (3 turnpoints)",
			multiplier: 1.0,
			n: 5,
		},
		ukxcl2c: {
			circuit: true,
			description: "Out and return",
			n: 2,
			score: XCScoreOutAndReturnUKXCL,
			sectorSize: 400.0,
		},
		ukxcl3c: {
			circuit: true,
			description: "Flat or FAI triangle",
			n: 3,
			score: XCScoreTriangleUKXCL,
			sectorSize: 400.0,
		},
		ukxcl2d: {
			description: "Flight to goal",
			multiplier: 1.25,
			n: 2,
			sectorSize: 400.0,
		},
	},
};

var coordFormats = {
	d: "dd.ddddd\u00b0",
	dm: "dd\u00b0 mm.mmm\u2032",
	dms: "dd\u00b0 mm\u2032 ss\u2033",
	utm: "UTM",
	os: "OS grid",
};

var distanceFormats = {
	km: function(m) { return (m / 1000.0).toFixed(2) + " km"; },
	miles: function(m) { return (m / 1609.0).toFixed(2) + " mi"; },
	nm: function(m) { return (m / 1852.0).toFixed(2) + " nm"; },
}

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

function formatDistance(m) {
	return distanceFormats[$F("distanceFormat")](m);
}

function formatLatLng(latLng) {
	var coordFormat = $F("coordFormat");
	if (coordFormat == "utm") {
		var utmref = new LatLng(latLng.lat(), latLng.lng()).toUTMRef();
		return [utmref.lngZone + utmref.latZone, utmref.easting.toFixed(0), utmref.northing.toFixed(0)];
	} else if (coordFormat == "os") {
		var ll = new LatLng(latLng.lat(), latLng.lng());
		ll.WGS84ToOSGB36();
		return [ll.toOSRef().toSixFigureString()];
	} else {
		var formatter = Prototype.K;
		if (coordFormat == "d") {
			formatter = function(deg) {
				return [deg.toFixed(5) + "\u00b0"];
			};
		} else if (coordFormat == "dm") {
			formatter = function(deg) {
				var d = parseInt(deg);
				var min = 60 * (deg - d);
				return [d.toString() + "\u00b0", min.toFixed(3) + "\u2032"];
			};
		} else if (coordFormat == "dms") {
			formatter = function(deg) {
				var d = parseInt(deg);
				var min = 60 * (deg - d);
				var m = parseInt(min);
				var sec = 60 * (min - m);
				return [d.toString() + "\u00b0", m.toString() + "\u2032", sec.toFixed(0) + "\u2033"];
			};
		}
		var result = [];
		result = result.concat(formatter(Math.abs(latLng.lat())));
		result.push(latLng.lat() < 0.0 ? "S" : "N");
		result = result.concat(formatter(Math.abs(latLng.lng())));
		result.push(latLng.lng() < 0.0 ? "W" : "E");
		return result;
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
	var prev = deltas[deltas.length - 1];
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
	var result = []
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

function faiSectorHelper(pixel, a, b, c, theta, flip) {
	var x = (b * b + c * c - a * a) / (2 * c);
	var y = Math.sqrt(b * b - x * x);
	return new GPoint(pixel.x + x * Math.cos(theta) - y * Math.sin(theta), pixel.y + flip * (x * Math.sin(theta) + y * Math.cos(theta)));
}

function faiSector(pixels) {
	var flip = isClockwise(pixels) ? 1 : -1;
	var delta = new GPoint(pixels[1].x - pixels[0].x, pixels[1].y - pixels[0].y);
	var theta = flip * Math.atan2(delta.y, delta.x);
	var c = Math.sqrt(delta.x * delta.x + delta.y * delta.y);
	var result = [];
	$R(28, 44, true).each(function(ap) {
		result.push(faiSectorHelper(pixels[0], c * ap / 28.0, c * (72.0 - ap) / 28.0, c, theta, flip));
	});
	$R(28, 44, true).each(function(cp) {
		result.push(faiSectorHelper(pixels[0], c * (72.0 - cp) / cp, c * 28.0 / cp, c, theta, flip));
	});
	$R(28, 44).each(function(_cp) {
		result.push(faiSectorHelper(pixels[0], c * 28.0 / (72.0 - _cp), c * _cp / (72.0 - _cp), c, theta, flip));
	});
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

function XCDownload(format) {
	var route = {
		circuit: flightType.circuit,
		description: flight.description,
		distance: formatDistance(flight.distance),
		"location": $F("location"),
		turnpoints: turnpointMarkers.map(function(marker, i) {
			var latLng = marker.getLatLng();
			return {
				name: "TP" + (i + 1).toString(),
				ele: 0,
				lat: latLng.lat(),
				lng: latLng.lng(),
			};
		}),
	};
	if (flight.sectorCenter && !turnpointMarkers.include(flight.sectorCenter)) {
		route.turnpoints.unshift({
			name: "TP0",
			ele: 0,
			lat: flight.sectorCenter.getLatLng().lat(),
			lng: flight.sectorCenter.getLatLng().lng(),
		});
	}
	document.location = "download.php?format=" + format + "&route=" + escape(JSON.stringify(route));
}

function XCGo() {
	if (geocoder) {
		geocoder.getLatLng($F("location"), XCSetCenter);
	}
}

function XCLoad() {
	$("location").setValue($F("defaultLocation"));
	$H(leagues).each(function(leaguePair) {
		var optgroup = new Element("optgroup", {label: leaguePair[0]});
		$H(leaguePair[1]).each(function(flightTypePair) {
			optgroup.appendChild(new Element("option", {label: flightTypePair[1].description, value: flightTypePair[0]}).update(flightTypePair[1].description));
		});
		$("flightType").appendChild(optgroup);
	});
	$("flightType").setValue($F("defaultFlightType"));
	$H(coordFormats).each(function(coordFormatPair) {
		$("coordFormat").appendChild(new Element("option", {label: coordFormatPair[1], value: coordFormatPair[0]}).update(coordFormatPair[1]));
	});
	$("coordFormat").setValue($F("defaultCoordFormat"));
	$H(distanceFormats).each(function(distanceFormatPair) {
		$("distanceFormat").appendChild(new Element("option", {label: distanceFormatPair[0], value: distanceFormatPair[0]}).update(distanceFormatPair[0]));
	});
	$("distanceFormat").setValue($F("defaultDistanceFormat"));
	XCResize();
	if (GBrowserIsCompatible()) {
		geocoder = new GClientGeocoder();
		XCGo();
	}
}

function XCHere() {
	XCPlaceDefaultTurnpoints();
	XCUpdateRoute();
}

function XCPlaceDefaultTurnpoints() {
	var bounds = map.getBounds();
	var sw = bounds.getSouthWest();
	var ne = bounds.getNorthEast();
	turnpointMarkers.each(function(marker, i) {
		var lat = sw.lat() + [2, 2, 1, 1, 1.5][i] * (ne.lat() - sw.lat()) / 3;
		var lng = sw.lng() + [1, 2, 2, 1, 1.5][i] * (ne.lng() - sw.lng()) / 3;
		marker.setLatLng(new GLatLng(lat, lng));
	});
}

function XCResize() {
	$("map").style.width = (document.viewport.getWidth() - 305) + "px";
	$("map").style.height = (document.viewport.getHeight() - 25) + "px";
}

function XCReverseRoute() {
	var latLngs = turnpointMarkers.map(function(marker) { return marker.getLatLng(); });
	turnpointMarkers.each(function(marker, i) {
		marker.setLatLng(latLngs[latLngs.length - 1 - i]);
	});
	XCUpdateRoute();
}

function XCRotateRoute(delta) {
	var latLngs = turnpointMarkers.map(function(marker) { return marker.getLatLng(); });
	turnpointMarkers.each(function(marker, i) {
		marker.setLatLng(latLngs[(i + delta + latLngs.length) % latLngs.length]);
	});
	XCUpdateRoute();
}

function XCSetCenter(latLng) {
	if (!map) {
		map = new GMap2($("map"));
		map.setCenter(latLng || new GLatLng(0, 0), DEFAULT_ZOOM);
		map.setUIToDefault();
		map.setMapType(G_PHYSICAL_MAP);
		GEvent.addListener(map, "zoomend", XCUpdateRoute);
	} else if (latLng) {
		map.setCenter(latLng, DEFAULT_ZOOM);
	}
	if (!turnpointMarkers) {
		XCUpdateFlightType();
	}
}

function XCScore(flight) {
	flight.circuit = flightType.circuit;
	flight.color = COLOR.good;
	flight.description = flightType.description;
	flight.distance = flight.totalDistance;
	flight.multiplier = flightType.multiplier;
	flight.score = flight.totalDistance * flightType.multiplier / 1000.0;
	flight.sectorCenter = null;
	flight.sectorSize = flightType.sectorSize;
	flight.sectorTarget = null;
	return flight;
}

function XCScoreOutAndReturn(flight) {
	flight.circuit = true;
	flight.color = COLOR.good;
	flight.description = flightType.description;
	flight.distance = flight.totalDistance;
	flight.multiplier = flightType.multiplier;
	flight.score = flight.totalDistance * flightType.multiplier / 1000.0;
	flight.sectorCenter = sectorMarker;
	flight.sectorSize = flightType.sectorSize;
	flight.sectorTarget = turnpointMarkers[1];
	return flight;
}

function XCScoreOutAndReturnUKXCL(flight) {
	flight.circuit = true;
	flight.distance = flight.totalDistance;
	flight.sectorCenter = sectorMarker;
	flight.sectorSize = flightType.sectorSize;
	flight.sectorTarget = turnpointMarkers[1];
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

function XCScoreOLC(flight) {
	var freeFlight = Object.clone(flight);
	freeFlight.circuit = false;
	freeFlight.color = COLOR.good;
	freeFlight.description = flightType.description;
	freeFlight.distance = freeFlight.totalDistance;
	freeFlight.multiplier = flightType.multiplier;
	freeFlight.score = freeFlight.totalDistance * flightType.multiplier / 1000.0;
	freeFlight.sectorCenter = turnpointMarkers[0];
	freeFlight.sectorSize = 0.2 * triangleDistance;
	freeFlight.sectorTarget = turnpointMarkers[4];
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
	triangleFlight.sectorCenter = turnpointMarkers[0];
	triangleFlight.sectorSize = 0.2 * triangleDistance;
	triangleFlight.sectorTarget = turnpointMarkers[4];
	if (triangleDistances.min() / triangleDistance < 0.28) {
		triangleFlight.color = COLOR.better;
		triangleFlight.description = "Flat triangle";
		triangleFlight.multiplier = 1.75;
	} else {
		triangleFlight.color = COLOR.best;
		triangleFlight.description = "FAI triangle";
		triangleFlight.multiplier = 2.0;
	}
	triangleFlight.score = triangleFlight.distance * triangleFlight.multiplier / 1000.0;
	if (freeFlight.score > triangleFlight.score) {
		return freeFlight;
	} else {
		return triangleFlight;
	}
}

function XCScoreQuadrilateralCFD(flight) {
	flight.circuit = true;
	flight.distance = flight.totalDistance;
	flight.sectorCenter = sectorMarker;
	flight.sectorSize = flightType.sectorSize;
	flight.sectorTarget = turnpointMarkers[3];
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

function XCScoreTriangle(flight, flat, fai, sectorSize) {
	flight.circuit = true;
	flight.distance = flight.totalDistance;
	flight.faiMarkers = turnpointMarkers;
	flight.sectorCenter = sectorMarker;
	flight.sectorSize = sectorSize;
	flight.sectorTarget = turnpointMarkers[2];
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
	return XCScoreTriangle(flight, {description: "Triangle plat", multiplier: 1.2}, {description: "Triangle FAI", multiplier: 1.4}, flightType.sectorSize);
}

function XCScoreTriangleOLC(flight) {
	return XCScoreTriangle(flight, {description: "Flat triangle", multiplier: 1.75}, {description: "FAI triangle", multiplier: 2.0}, 0.2 * flight.totalDistance);
}

function XCScoreTriangleUKXCL(flight) {
	flight.circuit = true;
	flight.distance = flight.totalDistance;
	flight.faiMarkers = turnpointMarkers;
	flight.sectorCenter = sectorMarker;
	flight.sectorSize = flightType.sectorSize;
	flight.sectorTarget = turnpointMarkers[2];
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

function XCUpdateFlightType() {
	if (turnpointMarkers) {
		turnpointMarkers.each(function(m, i) { map.removeOverlay(m); });
	}
	if (sectorMarker) {
		map.removeOverlay(sectorMarker);
	}
	flightType = null;
	var key = $F("flightType");
	$H(leagues).find(function(league) {
		if (league[1][key]) {
			flightType = league[1][key];
		}
	});
	turnpointMarkers = $R(1, flightType.n).map(function(i) {
		var icon = MapIconMaker.createLabeledMarkerIcon({width: 32, height: 32, label: i.toString(), primaryColor: COLOR.marker});
		var marker = new GMarker(new GLatLng(0, 0), {draggable: true, icon: icon});
		GEvent.addListener(marker, "drag", XCUpdateRoute);
		return marker;
	});
	XCPlaceDefaultTurnpoints();
	turnpointMarkers.each(function(m, i) { map.addOverlay(m); });
	if (flightType.circuit) {
		var pixel = new GPoint(0.0, 0.0);
		turnpointMarkers.each(function(marker, i) {
			var p = map.fromLatLngToContainerPixel(marker.getLatLng());
			pixel.x += p.x;
			pixel.y += p.y;
		});
		pixel.x /= turnpointMarkers.length;
		pixel.y /= turnpointMarkers.length;
		var latLng = map.fromContainerPixelToLatLng(pixel);
		var icon = MapIconMaker.createLabeledMarkerIcon({width: 32, height: 32, label: "0", primaryColor: COLOR.marker});
		sectorMarker = new GMarker(latLng, {draggable: true, icon: icon});
		GEvent.addListener(sectorMarker, "drag", XCUpdateRoute);
		map.addOverlay(sectorMarker);
	}
	XCUpdateRoute();
}

function XCLegToTR(flight, i, j) {
	var tr = new Element("tr");
	var td = new Element("td");
	td.appendChild(new Element("input", {type: "submit", value: "\u2295", onclick: "XCZoomLeg(" + i.toString() + ", " + j.toString() + ");"}));
	tr.appendChild(td);
	tr.appendChild(new Element("th").update("TP" + (i + 1).toString() + "\u2192TP" + (j + 1).toString()));
	tr.appendChild(new Element("td").update(formatDistance(flight.distances[i])));
	tr.appendChild(new Element("td").update((100.0 * flight.distances[i] / flight.totalDistance).toFixed(1) + "%"));
	return tr;
}

function XCMarkerToTR(marker, i) {
	var tr = new Element("tr");
	var td = new Element("td");
	td.appendChild(new Element("input", {type: "submit", value: "\u2295", onclick: "XCZoomTurnpoint(" + i.toString() + ");"}));
	tr.appendChild(td);
	tr.appendChild(new Element("th").update("TP" + (i + 1).toString()));
	formatLatLng(marker.getLatLng()).each(function(s) { tr.appendChild(new Element("td").update(s)); });
	return tr;
}

function XCUpdateRoute() {
	if (overlays) {
		overlays.each(function(o) { map.removeOverlay(o); });
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
	if (flight.sectorCenter && !turnpointMarkers.include(flight.sectorCenter)) {
		turnpoints.appendChild(XCMarkerToTR(flight.sectorCenter, -1));
	}
	turnpointMarkers.each(function(marker, i) {
		turnpoints.appendChild(XCMarkerToTR(marker, i));
	});
	$("turnpoints").replace(turnpoints);

	// overlays
	overlays = [];
	overlays.push(new GPolyline(latLngs, flight.color, 3, 1.0));
	$R(0, latLngs.length - 1, true).each(function(i) {
		overlays.push(new GPolygon(arrowhead([latLngs[i], latLngs[i + 1]], 16, Math.PI / 8.0), flight.color, 1, 1.0, flight.color, 1.0));
	});
	if (flightType.circuit) {
		overlays.push(new GPolyline([latLngs[latLngs.length - 1], latLngs[0]], flight.color, 1, 0.75));
	}
	if (flightType.circuit && flight.circuit) {
		overlays.push(new GPolyline([latLngs[latLngs.length - 1], sectorMarker.getLatLng(), latLngs[0]], flight.color, 3, 1.0));
		overlays.push(new GPolygon(arrowhead([sectorMarker.getLatLng(), latLngs[0]], 16, Math.PI / 8.0), flight.color, 1, 1.0, flight.color, 1.0));
		overlays.push(new GPolygon(arrowhead([latLngs[latLngs.length - 1], sectorMarker.getLatLng()], 16, Math.PI / 8.0), flight.color, 1, 1.0, flight.color, 1.0));
	}
	if (flight.faiMarkers && $F("faiSectors")) {
		var pixels = flight.faiMarkers.map(function(marker) { return map.fromLatLngToContainerPixel(marker.getLatLng()); });
		overlays.push(new GPolygon(faiSector([pixels[0], pixels[1], pixels[2]]), COLOR.faiSectors[0], 1, 0.0, COLOR.faiSectors[0], 0.25));
		overlays.push(new GPolygon(faiSector([pixels[1], pixels[2], pixels[0]]), COLOR.faiSectors[1], 1, 0.0, COLOR.faiSectors[1], 0.25));
		overlays.push(new GPolygon(faiSector([pixels[2], pixels[0], pixels[1]]), COLOR.faiSectors[2], 1, 0.0, COLOR.faiSectors[2], 0.25));
	}
	if (flight.sectorCenter) {
		if ($F("circuit") == "circle") {
			overlays.push(new GPolygon(circle(flight.sectorCenter.getLatLng(), flight.sectorSize, 32), COLOR.sector, 1, 0.0, COLOR.sector, 0.25));
		} else if ($F("circuit") == "sector") {
			var theta = initialBearingTo(flight.sectorCenter.getLatLng(), flight.sectorTarget.getLatLng());
			overlays.push(new GPolygon(sector(flight.sectorCenter.getLatLng(), theta, flight.sectorSize, Math.PI / 2.0, 32), COLOR.sector, 1, 0.0, COLOR.sector, 0.25));
		}
	}
	overlays.each(function(o) { map.addOverlay(o); });
}

function XCUnload() {
	geocoder = null;
	map = null;
	turnpointMarkers = null;
	sectorMarker = null;
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
	var marker = i < 0 ? flight.sectorCenter : turnpointMarkers[i];
	if (marker) {
		map.setCenter(marker.getLatLng(), DEFAULT_TURNPOINT_ZOOM);
	}
}
