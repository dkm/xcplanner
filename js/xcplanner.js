//  xcplanner - Google Maps XC planning tool
//  Copyright (C) 2009  Tom Payne
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
var zoom = 10;
var declared = false;
var geocoder = null;
var map = null;
var markers = null;
var polylines = [];
var league = null;
var n = null;
var circuit = null;
var sectors = [];
var turnpts = []

Object.extend(Array.prototype, {
	toTR: function() {
		var tr = new Element("tr");
		this.each(function(element, index) {
			tr.appendChild(new Element("td").update(element));
		});
		return tr;
	}
});

function initialBearingTo(latlng1, latlng2) {
	var y = Math.sin(latlng1.lngRadians() - latlng2.lngRadians()) * Math.cos(latlng2.latRadians());
	var x = Math.cos(latlng1.latRadians()) * Math.sin(latlng2.latRadians()) - Math.sin(latlng1.latRadians()) * Math.cos(latlng2.latRadians()) * Math.cos(latlng1.lngRadians() - latlng2.lngRadians());
	return -Math.atan2(y, x);
}

function latLngAt(latlng, bearing, distance) {
	var lat = Math.asin(Math.sin(latlng.latRadians()) * Math.cos(distance) + Math.cos(latlng.latRadians()) * Math.sin(distance) * Math.cos(bearing));
	var lng = latlng.lngRadians() + Math.atan2(Math.sin(bearing) * Math.sin(distance) * Math.cos(latlng.latRadians()), Math.cos(distance) - Math.sin(latlng.latRadians()) * Math.sin(lat));
	return new GLatLng(180.0 * lat / Math.PI, 180.0 * lng / Math.PI);
}

function latLngAtXY(latlng, x, y)
{
	return latLngAt(latlng, Math.atan2(x, y), Math.sqrt(x*x + y*y) / R);
}

function XCReverseRoute() {
	var latlngs = markers.map(function(marker) { return marker.getLatLng(); });
	markers.each(function(marker, i) {
		if (i < n) {
			marker.setLatLng(latlngs[n - 1 - i]);
		}
	});
}

function XCRotateRoute(direction) {
	var latlngs = markers.map(function(marker) { return marker.getLatLng(); });
	markers.each(function(marker, i) {
		if (i < n) {
			marker.setLatLng(latlngs[(i + direction + n) % n]);
		}
	});
}

function formatLatLng(latlng) {
	var coordFormat = $F("coordFormat");
	if (coordFormat == "utm") {
		var utmref = new LatLng(latlng.lat(), latlng.lng()).toUTMRef();
		return [utmref.lngZone + utmref.latZone, utmref.easting.toFixed(0), utmref.northing.toFixed(0)];
	} else if (coordFormat == "os") {
		var ll = new LatLng(latlng.lat(), latlng.lng());
		ll.WGS84ToOSGB36();
		return [ll.toOSRef().toSixFigureString()];
	} else {
		var formatter = Prototype.K;
		if (coordFormat == "d") {
			formatter = function(deg) {
				return [deg.toFixed(5) + "&deg;"];
			};
		} else if (coordFormat == "dm") {
			formatter = function(deg) {
				var d = parseInt(deg);
				var min = 60 * (deg - d);
				return [d.toString() + "&deg;", min.toFixed(3) + "&prime;"];
			};
		} else if (coordFormat == "dms") {
			formatter = function(deg) {
				var d = parseInt(deg);
				var min = 60 * (deg - d);
				var m = parseInt(min);
				var sec = 60 * (min - m);
				return [d.toString() + "&deg;", m.toString() + "&prime;", sec.toFixed(0) + "&Prime;"];
			};
		}
		var result = [];
		result = result.concat(formatter(Math.abs(latlng.lat())));
		result.push(latlng.lat() < 0.0 ? "S" : "N");
		result = result.concat(formatter(Math.abs(latlng.lng())));
		result.push(latlng.lng() < 0.0 ? "W" : "E");
		return result;
	}
}

function isConvex(latlngs) {
	var prev = latlngs[latlngs.length - 1];
	var deltas = latlngs.map(function(latlng) {
		var delta = new GLatLng(latlng.lat() - prev.lat(), latlng.lng() - prev.lng());
		prev = latlng;
		return delta;
	});
	var prev = deltas[deltas.length - 1];
	var cross_products = deltas.map(function(delta) {
		cross_product = delta.lat() * prev.lng() - delta.lng() * prev.lat();
		prev = delta;
		return cross_product;
	});
	return cross_products.max() < 0 || 0 < cross_products.min();
}

var Route = Class.create({
	initialize: function(league, latlngs, circuit) {
		this.league = league;
		this.latlngs = latlngs;
		this.n = this.latlngs.length;
		this.circuit = circuit;
		this.distances = []
		for (var i = 1; i < this.n; ++i) {
			this.distances.push(this.latlngs[i].distanceFrom(this.latlngs[i - 1], R));
		}
		if (this.circuit) {
			this.distances.push(this.latlngs[0].distanceFrom(this.latlngs[this.n - 1], R));
		}
		this.distance = this.distances.inject(0.0, function(a, x) { return a + x; });
		this.description = "Invalid";
		this.multiplier = 0.0;
		this.glow = false;
		if (this.league == "cfd") {
			if (this.circuit) {
				if (this.n == 2) {
					this.description = "Parcours en aller-retour";
					this.multiplier = 1.2;
				} else if (this.n == 3) {
					if (this.distances.min() / this.distance >= 0.28) {
						this.description = "Triangle FAI";
						this.multiplier = 1.4;
						this.glow = true;
					} else {
						this.description = "Triangle plat";
						this.multiplier = 1.2;
					}
				} else if (this.n == 4) {
					if (this.distances.min() / this.distance >= 0.15 && isConvex(this.latlngs)) {
						this.description = "Quadrilatère";
						this.multiplier = 1.2;
					}
				}
			} else {
				if (2 <= this.n && this.n <= 4) {
					this.description = "Distance libre";
					this.multiplier = 1.0;
				}
			}
		} else if (this.league == "leonardo") {
			if (this.circuit) {
				if (this.n == 3) {
					if (this.distances.min() / this.distance >= 0.28) {
						this.description = "FAI triangle";
						this.multiplier = 2.0;
						this.glow = true;
					} else {
						this.description = "Flat triangle";
						this.multiplier = 1.75;
					}
				}
			} else {
				if (2 <= this.n && this.n <= 5) {
					this.description = "Open distance";
					this.multiplier = 1.5;
				}
			}
		} else if (this.league == "ukxcl-national") {
			if (declared) {
				if (this.circuit) {
					if (this.n == 2) {
						if (this.distance >= 26600.0) {
							this.description = "Declared out and return";
							this.multiplier = 2.5;
						}
					} else if (this.n == 3) {
						if (this.distances.min() / this.distance >= 0.28 && this.distance >= 27400.0) {
							this.description = "Declared FAI triangle";
							this.multiplier = 3.75;
							this.glow = true;
						}
					}
				} else {
					if (this.distance >= 25800.0) {
						this.description = "Flight to goal";
						this.multiplier = 1.25;
					}
				}
			} else {
				if (this.circuit) {
					if (this.n == 2) {
						if (this.distance >= 25000.0) {
							this.description = "Out and return";
							this.multiplier = 2.0;
						} else if (this.distance >= 15000.0) {
							this.description = "Out and return";
							this.multiplier = 1.5;
						}
					} else if (this.n == 3) {
						if (this.distances.min() / this.distance >= 0.28) {
							if (this.distance >= 25000.0) {
								this.description = "FAI triangle";
								this.multiplier = 2.7;
								this.glow = true;
							} else if (this.distance >= 15000.0) {
								this.description = "FAI triangle";
								this.multiplier = 2.0;
								this.glow = true;
							}
						} else {
							if (this.distance >= 25000.0) {
								this.description = "Flat triangle";
								this.multiplier = 2.0;
							} else if (this.distance >= 15000.0) {
								this.description = "Flat triangle";
								this.multiplier = 1.5;
							}
						}
					}
				} else {
					if (this.n == 2) {
						if (this.distance >= 10000.0) {
							this.description = "Open distance";
							this.multiplier = 1.0;
						}
					} else if (3 <= this.n && this.n <= 5) {
						if (this.distance >= 15000.0) {
							this.description = "Turnpoint flight";
							this.multiplier = 1.0;
						}
					}
				}
			}
		} else if (this.league == "xcontest") {
			if (this.circuit) {
				if (this.n == 3) {
					if (this.distances.min() / this.distance >= 0.28) {
						this.description = "FAI triangle";
						this.multiplier = 1.4;
						this.glow = true;
					} else {
						this.description = "Flat triangle";
						this.multiplier = 1.2;
					}
				}
			} else {
				if (2 <= this.n && this.n <= 5) {
					this.description = "Free flight";
					this.multiplier = 1.0;
				}
			}
		}
	},
	legToTR: function(i, j) {
		var fields = [new Element("b").update("TP" + (i + 1).toString() + "&rarr;TP" + (j + 1).toString() + ":"),
			      (this.distances[i] / 1000.0).toFixed(2) + "km"];
		if (this.distance != 0.0) {
			fields.push((100.0 * this.distances[i] / this.distance).toFixed(1) + "%");
		}
		return fields.toTR();
	},
	toHTML: function() {
		var table = new Element("table");
		for (var i = 1; i < this.n; ++i) {
			table.appendChild(this.legToTR(i - 1, i));
		}
		if (this.circuit) {
			table.appendChild(this.legToTR(this.n - 1, 0));
		}
		return table;
	},
	turnpointsToHTML: function() {
		var table = new Element("table");
		this.latlngs.each(function(latlng, index) {
			var b = new Element("b").update("TP" + (index + 1).toString() + ":");
			var a = new Element("a", {href: "", onclick: "map.setCenter(new GLatLng(" + latlng.lat() + ", " + latlng.lng() + "), 13)", title: "Zoom to TP" + (index + 1).toString()});
			a.update("[&#8853;]");
			var tr = [b].concat(formatLatLng(latlng)).concat([a]).toTR();
			table.appendChild(tr);	
		});
		return table;
	},
	toPolylines: function() {
		if (this.circuit) {
			var latlngs = this.latlngs.clone();
			latlngs.push(latlngs[0]);
		} else {
			var latlngs = this.latlngs;
		}
		if (this.glow) {
			var color = "#ffff00";
		} else if (this.multiplier == 0.0) {
			var color = "#ff0000";
		} else {
			var color = "#00ff00";
		}
		var result = [new GPolyline(latlngs, color, 3, 1.0)];
		var distance = 1000.0 / R;
		var d = 2000 * 1024 / (R * Math.pow(2, map.getZoom()));
		$R(0, latlngs.length - 2).each(function(i) {
			var bearing = initialBearingTo(latlngs[i + 1], latlngs[i]);
			var head = [latlngs[i + 1], latLngAt(latlngs[i + 1], bearing - Math.PI / 8.0, d), latLngAt(latlngs[i + 1], bearing, 0.5 * d), latLngAt(latlngs[i + 1], bearing + Math.PI / 8.0, d), latlngs[i + 1]];
			result.push(new GPolygon(head, color, 1, 1.0, color, 1.0));
		});
		return result;
	}
});

function XCGoto() {
	var init;

	if (geocoder)
	{
		init = (markers == null);
		geocoder.getLatLng($F("location"), XCSetCenter);
	}
}

function XCResetTurnpoints() {
	var bounds = map.getBounds();
	var sw = bounds.getSouthWest();
	var ne = bounds.getNorthEast();
	markers.each(function(marker, index) {
		var lat = sw.lat() + [2, 2, 1, 1, 1.5][index] * (ne.lat() - sw.lat()) / 3;
		var lng = sw.lng() + [1, 2, 2, 1, 1.5][index] * (ne.lng() - sw.lng()) / 3;
		marker.setLatLng(new GLatLng(lat, lng));
	});
}

function XCSetCenter(latlng) {
	if (map == null) {
		map = new GMap2($("map"));
		map.setCenter(latlng || new GLatLng(0, 0), zoom);
		map.setUIToDefault();
		map.setMapType(G_PHYSICAL_MAP);
		GEvent.addListener(map, "zoomend", XCUpdateRoute);
	} else if (latlng) {
		map.setCenter(latlng, zoom);
	}

	if (markers == null) {
		markers = $R(0, 4).map(function(i){
			var icon = MapIconMaker.createLabeledMarkerIcon({width: 32, height: 32, label: (i + 1).toString(), primaryColor: "#00ff00"});
			marker = new GMarker(new GLatLng(0, 0), {draggable: true, icon: icon});
			GEvent.addListener(marker, "drag", XCUpdateRoute);

			return marker;
		});

		if((turnpts.length > 0) && (turnpts.length <= markers.length))
		{
				// Koordinaten setzen
			for(var tpNr=0; tpNr<turnpts.length; tpNr++)
			{
				markers[tpNr].setLatLng(new GLatLng(turnpts[tpNr][0], turnpts[tpNr][1]));
			}
		}
		else
		{
				XCResetTurnpoints();
		}

		XCUpdateFlightType();
		XCUpdateRoute();
	}
}

function XCUpdateFlightType() {
	var fields = $F("flightType").split(/,/);
	var color;

	league = fields[0];
	n = new Number(fields[1]);
	circuit = (fields[2] == "circuit");
	declared = (fields[3] == "declared");

	markers.each(function(marker, index)
	{
		map.removeOverlay(marker);
	});

	markers = $R(0, 4).map(function(i)
	{
		if((n == 3) && circuit) // triangle
		{
			switch(i)
			{
				case 0:
					color = "#ff0000";
				break;
				case 1:
					color = "#00ff00";
				break;
				case 2:
					color = "#0000ff";
				break;
				default:
					color = "#00ff00";
				break;
			}
		}
		else
		{
			color = "#00ff00";
		}

		// recreate markers because of color change
		var icon = MapIconMaker.createLabeledMarkerIcon({width: 32, height: 32, label: (i + 1).toString(), primaryColor: color});
		var marker = new GMarker(markers[i].getLatLng(), {draggable: true, icon: icon});
		GEvent.addListener(marker, "drag", XCUpdateRoute);

		return marker;
	});

	markers.each(function(marker, index) {
		if (index < n) {
			map.addOverlay(marker);
		}
	});
}

function XCUpdateRoute() {
	var latlngs = $R(0, n - 1).map(function(i) { return markers[i].getLatLng(); });
	var route = new Route(league, latlngs, circuit);
	$("description").update(route.description);
	$("distance").update((route.distance / 1000).toFixed(2) + "km");
	$("multiplier").update(route.multiplier.toFixed(2));
	$("score").update((route.multiplier * route.distance / 1000).toFixed(2) + " points");
	$("route").update(route.toHTML());
	$("turnpoints").update(route.turnpointsToHTML());

	var turnpoints_pair = "turnpoints=" + markers.map(function(marker, i) {
		var latLng = marker.getLatLng();
		return ["TP" + (i + 1), latLng.lat(), latLng.lng(), "0"].join(":");
	}).join(",");

	var gpx_pairs = [];
	gpx_pairs.push("format=gpx");
	gpx_pairs.push("name=" + ($F("location") + "-" + (route.distance / 1000).toFixed(0) + "km-" + route.description).replace(/[^0-9A-Za-z\-]+/g, "-"));
	gpx_pairs.push(turnpoints_pair);
	if (route.circuit) {
		gpx_pairs.push("circuit=true");
	}
	$("gpx").writeAttribute({href: "download.php?" + gpx_pairs.join("&")});

	var bookmark_pairs = [];
	bookmark_pairs.push("location=" + $F("location"));
	bookmark_pairs.push("flightType=" + $F("flightType"));
	bookmark_pairs.push("coordFormat=" + $F("coordFormat"));
	bookmark_pairs.push(turnpoints_pair);
	$("bookmark").writeAttribute({href: "index.php?" + bookmark_pairs.join("&")});

	polylines.each(function(polyline) { map.removeOverlay(polyline); });
	polylines = route.toPolylines();
	polylines.each(function(polyline) { map.addOverlay(polyline); });

	s = [];
	if((n == 3) && circuit)
	{
		s[0] = new GPolygon(getFaiSector(latlngs[0], latlngs[1], latlngs[2]),
					"#f33f00", 1, 1, "#0000ff", 0.1);
		s[1] = new GPolygon(getFaiSector(latlngs[1], latlngs[2], latlngs[0]),
					"#f33f00", 1, 1, "#ff0000", 0.1);
		s[2] = new GPolygon(getFaiSector(latlngs[2], latlngs[0], latlngs[1]),
					"#f33f00", 1, 1, "#00ff00", 0.1);
	}
	for (var i = 0; i < 3; ++i)
	{
		if (i < s.length)
		{
			map.addOverlay(s[i]);
		}
		if (i < sectors.length)
		{
			map.removeOverlay(sectors[i]);
		}
	}
	sectors = s;
}

/**
	Get the points of the FAI sector of the triangle latlng1 (A), latlng2 (B), latlng3 (C),
	a, b are the cathetus and c is the hypotenuse.
	The problem is broken down for a common side of the FAI triangle. The side (latlng1 - latlng2)
	is named c. The possible sector is given through a and b.
	@param latlng1 GLatLng of first edge (A)
	@param latlng2 GLatLng of second edge (B)
	@param latlng3 GLatLng of third edge (C) (only for orientation detection)
	@return Array of GLatLng. The points of the sector.
*/
function getFaiSector(latlng1, latlng2, latlng3)
{
	var bear;
	var latlngs = [];
	var cw;
	var ap;
	var bp;
	var cp;
	var a;
	var b;
	var c = latlng1.distanceFrom(latlng2);
	var x;
	var y;
	var rotX;
	var rotY;

	// the orientation of the triangle
	cw = (orient2dTri(latlng1, latlng2, latlng3) < 0);

	if(cw)
	{
		bear = (initialBearingTo(latlng1, latlng2) - Math.PI / 2);
	}
	else
	{
		bear = -(initialBearingTo(latlng1, latlng2) - Math.PI / 2);
	}

	/* calculate the sectors */

	// case 1: c is minimal, a and b variable
	cp = 28.0;

	for(ap=28; ap<44; ap++)
	{
		bp = 100.0 - ap - cp;
		a = c * ap / cp;
		b = c * bp / cp;
		x = (b*b + c*c - a*a) / (2 * c);
		y = Math.sqrt(b*b - x*x);

		// rotation
		rotX = x * Math.cos(bear) - y * Math.sin(bear);
		rotY = x * Math.sin(bear) + y * Math.cos(bear);

		if(cw)
		{
			rotY = -rotY;
		}

		// translation
		latlngs.push(latLngAtXY(latlng1, rotX, rotY));
	}

	// case 2: b is minimal, a and c variable
	bp = 28.0;

	for(cp=28; cp<44; cp++)
	{
		ap = 100.0 - bp - cp;
		a = c * ap / cp;
		b = c * bp / cp;
		x = (b*b + c*c - a*a) / (2 * c);
		y = Math.sqrt(b*b - x*x);

		// rotation
		rotX = x * Math.cos(bear) - y * Math.sin(bear);
		rotY = x * Math.sin(bear) + y * Math.cos(bear);

		if(cw)
		{
			rotY = -rotY;
		}

		// translation
		latlngs.push(latLngAtXY(latlng1, rotX, rotY));
	}

	// case 3: a ist minimal, b and c variable
	ap = 28.0;

	for(cp=44; cp>=28; cp--)
	{
		bp = 100.0 - ap - cp;
		a = c * ap / cp;
		b = c * bp / cp;
		x = (b*b + c*c - a*a) / (2 * c);
		y = Math.sqrt(b*b - x*x);

		// rotation
		rotX = x * Math.cos(bear) - y * Math.sin(bear);
		rotY = x * Math.sin(bear) + y * Math.cos(bear);

		if(cw)
		{
			rotY = -rotY;
		}

		// translation
		latlngs.push(latLngAtXY(latlng1, rotX, rotY));
	}

	return latlngs;
}

/**
	Test the orientation of a triangle.
	@param latlng1 GLatLng of first edge
	@param latlng2 GLatLng of second edge
	@param latlng3 GLatLng of third edge
	@return >0 for counterclockwise
					=0 for none (degenerate)
					<0 for clockwise
*/
function orient2dTri(latlng1, latlng2, latlng3)
{
	return ((latlng2.lng() - latlng1.lng()) * (latlng3.lat() - latlng1.lat()) -
				(latlng3.lng() - latlng1.lng()) * (latlng2.lat() - latlng1.lat()));
}

function XCLoad(turnpoints) {
	turnpts = turnpoints;
	XCResize();
	if (GBrowserIsCompatible()) {
		geocoder = new GClientGeocoder();
		XCGoto();
	}
}

function XCUnload() {
	geocoder = null;
	map = null;
	markers = null;
	polylines = [];
	GUnload();
}

function XCResize()
{
	var viewWidth;
	var viewHeight;

	if (typeof window.innerWidth != "undefined") {
		viewWidth = window.innerWidth;
		viewHeight = window.innerHeight;
	} else if (typeof document.documentElement != "undefined" && typeof document.documentElement.clientWidth != "undefined" && document.documentElement.clientWidth != 0) {
		viewWidth = document.documentElement.clientWidth;
		viewHeight = document.documentElement.clientHeight;
	} else {
		viewWidth = document.getElementsByTagName("body")[0].clientWidth;
		viewHeight = document.getElementsByTagName("body")[0].clientHeight;
	}
	$("map").style.width = (viewWidth - 305) + "px";
	$("map").style.height = (viewHeight - 25) + "px";
}
