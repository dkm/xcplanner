var R = 6371000.0;
var zoom = 10;
var declared = false;
var geocoder = null;
var map = null;
var markers = null;
var polyline = null;
var league = null;
var n = null;
var circuit = null;

Object.extend(Array.prototype, {
	toTR: function() {
		var tr = new Element("tr");
		this.each(function(element, index) {
			tr.appendChild(new Element("td").update(element));
		});
		return tr;
	}
});

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
		this.description = "Open distance";
		this.multiplier = 1.0;
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
					} else {
						this.multiplier = 0.0;
					}
				} else {
					this.multiplier = 0.0;
				}
			} else {
				if (2 <= this.n && this.n <= 4) {
					this.description = "Distance libre";
					this.multiplier = 1.0;
				} else {
					this.multiplier = 0.0;
				}
			}
			if (this.multiplier == 0.0) {
				this.description = "Non valide";
			}
		} else if (this.league == "ukxcl-national") {
			if (this.circuit) {
				if (this.n == 2) {
					this.description = "Out and return";
					if (this.distance >= 25000.0 && declared) {
						this.multiplier = 2.5;
					} else if (this.distance > 25000.0) {
						this.multiplier = 2.0;
					} else {
						this.multiplier = 1.5;
					}
				} else if (this.n == 3) {
					if (this.distances.min() / this.distance >= 0.28) {
						this.description = "FAI triangle";
						if (this.distance >= 25000.0 && declared) {
							this.multiplier = 3.75;
						} else if (this.distance >= 25000.0) {
							this.multiplier = 2.7;
						} else {
							this.multiplier = 2.0;
						}
						this.glow = true;
					} else {
						this.description = "Flat triangle";
						if (this.distance >= 20000.0) {
							this.multiplier = 2.0;
						} else {
							this.multiplier = 1.5;
						}
					}
				} else {
					this.multiplier = 0.0;
				}
			} else {
				if (this.n == 2) {
					if (this.distance >= 10000.0) {
						this.multiplier = declared ? 1.25 : 1.0;
					} else {
						this.multiplier = 0.0;
					}
				} else if (3 <= this.n && this.n <= 5) {
					this.description = "Turnpoint flight";
					if (this.distance >= 15000.0) {
						this.multiplier = declared ? 1.25 : 1.0;
					} else {
						this.multiplier = 0.0;
					}
					this.multiplier = this.distance >1.0;
				} else {
					this.multiplier = 0.0;
				}
			}
			if (this.multiplier == 0.0) {
				this.description = "Invalid";
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
				} else {
					this.multiplier = 0.0;
				}
			} else {
				if (2 <= this.n && this.n <= 5) {
					this.description = "Free flight";
					this.multiplier = 1.0;
				} else {
					this.multiplier = 0.0;
				}
			}
			if (this.multiplier == 0.0) {
				this.description = "Invalid";
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
			var a = new Element("a", {onclick: "map.setCenter(new GLatLng(" + latlng.lat() + ", " + latlng.lng() + "), 13)"});
			a.appendChild(new Element("b").update("TP" + (index + 1).toString() + ":"));
			var tr = [a,
			          latlng.lat().toFixed(5), latlng.lng().toFixed(5)].toTR();
			table.appendChild(tr);	
		});
		return table;
	},
	toPolyline: function() {
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
		return new GPolyline(latlngs, color, 4, 0.75);
	}
});

function XCGoto() {
	if (geocoder) {
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
		map = new GMap2(document.getElementById("map"));
		map.setCenter(latlng || new GLatLng(0, 0), zoom);
		map.setUIToDefault();
		map.setMapType(G_PHYSICAL_MAP);
	} else if (latlng) {
		map.setCenter(latlng, zoom);
	}
	if (markers == null) {
		markers = $R(0, 4).map(function(i) {
			var icon = MapIconMaker.createLabeledMarkerIcon({width: 32, height: 32, label: (i + 1).toString(), primaryColor: "#00ff00"});
			marker = new GMarker(latlng || new GLatLng(0, 0), {draggable: true, icon: icon});
			GEvent.addListener(marker, "drag", XCUpdateRoute);
			return marker;
		});
		XCResetTurnpoints();
		XCUpdateFlightType();
		XCUpdateRoute();
	}
}

function XCUpdateFlightType() {
	var fields = $F("flightType").split(/,/);
	league = fields[0];
	n = new Number(fields[1]);
	markers.each(function(marker, index) {
		if (index < n) {
			map.addOverlay(marker);
		} else {
			map.removeOverlay(marker);
		}
	});
	circuit = fields[2] == "true";
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
	if (polyline) {
		map.removeOverlay(polyline);
	}
	polyline = route.toPolyline();
	map.addOverlay(polyline);
}

function XCLoad() {
	if (GBrowserIsCompatible()) {
		geocoder = new GClientGeocoder();
		XCGoto();
	}
}

function XCUnload() {
	geocoder = null;
	map = null;
	markers = null;
	polyline = null;
	GUnload();
}
