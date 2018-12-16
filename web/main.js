
// DEFINE VARIABLES
// Define size of map group
// Full world map is 2:1 ratio
// Using 12:5 because we will crop top and bottom of map
w = 1500;
h = 650;


function zoomed() {
    t = d3.event.transform;
    countriesGroup.attr("transform", "translate(" + [t.x, t.y] + ")scale(" + t.k + ")");
    birthsGroup.attr("transform", "translate(" + [t.x, t.y] + ")scale(" + t.k + ")");
    edgesGroup.attr("transform", "translate(" + [t.x, t.y] + ")scale(" + t.k + ")");
    locationsGroup.attr("transform", "translate(" + [t.x, t.y] + ")scale(" + t.k + ")");
}


var edges = {};
var tones = {};
var showBirths = false,
    showLocs = false,
    showImmigration = false,
    showEmigration = false,
    showInner = false,
    showColoring = false;

var countries = {};
var birthLocs = {};
var locations = {};

var selectedCountry;
var coloredCountries = [];

var zoom = d3.zoom().on("zoom", zoomed);

var svg = d3
    .select("#map-holder")
    .append("svg")
    .attr("width", $("#map-holder").width())
    .attr("height", $("#map-holder").height())
    .call(zoom)
    ;

var countriesGroup = svg.append("g").attr("id", "map");

var birthsGroup = svg.append("g").attr("id", "birthlocs");
var locationsGroup = svg.append("g").attr("id", "places");
var edgesGroup = svg.append("g").attr("id", "edges");

var maxTone = 255,
    minTone = 50;

var edgeOpacity = 1;

var projection = d3
    .geoEquirectangular()
    // .geoMercator()
    // .geoOrthographic()
    .center([0, 15])
    .scale([w / (2 * Math.PI)])
    .translate([w / 2, h / 2])
    ;

var path = d3
    .geoPath()
    .projection(projection)
    ;

toggleBirthLocs = function () {
    if (showBirths) {
        birthLocs[selectedCountry.getAttribute("id")].node().removeAttribute("display");
    } else {
        birthLocs[selectedCountry.getAttribute("id")].node().setAttribute("display", "none");
    }
}

toggleLocs = function () {
    if (showLocs) {
        locations[selectedCountry.getAttribute("id")].node().removeAttribute("display");
    } else {
        locations[selectedCountry.getAttribute("id")].node().setAttribute("display", "none");
    }
}

toggleEmigrationEdges = function () {
    if (showEmigration) {
        edges[selectedCountry.getAttribute("id")]["from"].node().removeAttribute("display");
    } else {
        edges[selectedCountry.getAttribute("id")]["from"].node().setAttribute("display", "none");
    }
}

toggleImmigrationEdges = function () {
    if (showImmigration) {
        edges[selectedCountry.getAttribute("id")]["to"].node().removeAttribute("display");
    } else {
        edges[selectedCountry.getAttribute("id")]["to"].node().setAttribute("display", "none");
    }
}

toggleInnerEdges = function () {
    if (showInner) {
        edges[selectedCountry.getAttribute("id")]["inner"].node().removeAttribute("display");
    } else {
        edges[selectedCountry.getAttribute("id")]["inner"].node().setAttribute("display", "none");
    }
}

toggleColoring = function () {
    let country = selectedCountry.getAttribute("id");
    if (showColoring) {
        for (othercountry of Object.keys(tones[country])) {
            let color = d3.rgb(...tones[country][othercountry]);
            countries[othercountry].node().style.fill = color;
        }
    } else {
        for (othercountry of Object.keys(tones[country]))
            countries[othercountry].node().style.fill = "";
    }
}

selectCountry = function (node) {
    if (selectedCountry != undefined) {
        let country = selectedCountry.getAttribute("id");
        birthLocs[country].node().setAttribute("display", "none");
        locations[country].node().setAttribute("display", "none");

        edges[country]["from"].node().setAttribute("display", "none");
        edges[country]["to"].node().setAttribute("display", "none");
        edges[country]["inner"].node().setAttribute("display", "none");

        for (othercountry of Object.keys(tones[country]))
            countries[othercountry].node().style.fill = "";

        if (selectedCountry == node) {
            selectedCountry.classList.remove("country-on");
            return;
        } else {
            selectedCountry.classList.remove("country-on");
        }
    }

    selectedCountry = node;
    selectedCountry.classList.add("country-on");

    toggleBirthLocs();
    toggleLocs();
    toggleInnerEdges();
    toggleEmigrationEdges();
    toggleImmigrationEdges();
    toggleColoring();


}

drawDataJS = function () {
    d3.json("combined.json").then((json) => {
        json.countries.forEach((country) => {
            let id = country.feature.properties.adm0_a3;
            let countryDOM = countriesGroup
                .append("path")
                .attr("class", "country")
                .attr("id", id)
                .attr("d", path(country.feature))
                .on("click", function () {
                    selectCountry(this)
                })
                ;

            countries[id] = countryDOM;

            birthLocs[id] = birthsGroup.append("g")
                .attr("display", "none");
            let currentGroup = birthLocs[id];

            path.pointRadius((d) => 1 + d.weight / 15);
            country.birthlocs.forEach(birthloc => {
                let point = path({ "type": "Point", "coordinates": birthloc.coordinates, "weight": birthloc.weight })
                currentGroup.append("path")
                    .attr("class", "birthloc")
                    .attr("d", point);
            });

            locations[id] = locationsGroup.append("g")
                .attr("display", "none");

            currentGroup = locations[id];

            path.pointRadius(1);
            country.locs.forEach(loc => {
                let point = path({ "type": "Point", "coordinates": loc })
                currentGroup.append("path")
                    .attr("class", "loc")
                    .attr("d", point);
            });

            edges[id] = {};
            edges[id]["from"] = edgesGroup.append("g")
                .attr("display", "none");
            edges[id]["to"] = edgesGroup.append("g")
                .attr("display", "none");
            edges[id]["inner"] = edgesGroup.append("g")
                .attr("display", "none");

            tones[id] = {};
        });

        json.edges.forEach(edge => {
            if (edges[edge.from] == undefined || edges[edge.to] == undefined)
                return;

            if (edge.from == edge.to) {
                let currentGroup = edges[edge.from]["inner"];
                currentGroup.append("path")
                    .datum({ type: "LineString", coordinates: edge.coordinates })
                    .attr("d", path)
                    .attr("class", "edge")
                    .attr("style", "opacity: " + edgeOpacity / edge.weight)
                    ;
            } else {
                let currentGroup = edges[edge.from]["from"];
                currentGroup.append("path")
                    .datum({ type: "LineString", coordinates: edge.coordinates })
                    .attr("d", path)
                    .attr("class", "edge")
                    .attr("style", "opacity: " + edgeOpacity / edge.weight)
                    ;

                currentGroup = edges[edge.to]["to"];
                currentGroup.append("path")
                    .datum({ type: "LineString", coordinates: edge.coordinates })
                    .attr("d", path)
                    .attr("class", "edge")
                    .attr("style", "opacity: " + edgeOpacity / edge.weight)
                    ;

                if (tones[edge.from][edge.to] == undefined)
                    tones[edge.from][edge.to] = 0;

                if (tones[edge.to][edge.from] == undefined)
                    tones[edge.to][edge.from] = 0;

                tones[edge.from][edge.to] -= 1;
                tones[edge.to][edge.from] += 1;
            }
        });

        for (country of Object.keys(tones)) {
            if (Object.keys(tones[country]).length == 0)
                continue;


            for (c of Object.keys(tones[country])) {
                if (tones[country][c] != 0) {
                    if (tones[country][c] < 0)
                        tones[country][c] = -1 * (Math.log(Math.abs(tones[country][c]) + Math.E));
                    else
                        tones[country][c] = Math.log(tones[country][c] + Math.E);
                }

            }


            let negmin = Math.abs(Math.min(...Object.values(tones[country]).filter(a => a < 0)));
            let negmax = Math.abs(Math.max(...Object.values(tones[country]).filter(a => a < 0)));
            let posmin = Math.min(...Object.values(tones[country]).filter(a => a >= 0));
            let posmax = Math.max(...Object.values(tones[country]).filter(a => a >= 0));

            for (c of Object.keys(tones[country])) {
                if (tones[country][c] < 0) {
                    let x = Math.abs(tones[country][c]);
                    if (negmax != negmin)
                        x = ((x - negmin) / (negmax - negmin));
                    else
                        x = 1;
                    x = (maxTone - minTone) * x + minTone;
                    tones[country][c] = [
                        x,
                        0,
                        0];
                } else if (tones[country][c] > 0) {
                    let x = tones[country][c];
                    if (posmax != posmin)
                        x = ((x - posmin) / (posmax - posmin));
                    else
                        x = 1;
                    x = (maxTone - minTone) * x + minTone;
                    tones[country][c] = [
                        0,
                        x,
                        0];
                } else {
                    tones[country][c] = [
                        200,
                        200,
                        0];
                }
            }
        }
    });
}

drawDataJS();

$("#button-birth").on("click", function () {
    showBirths = !showBirths;

    if (showBirths)
        $(this).css("background", "linear-gradient(to bottom, #00b900 5%, #006900 100%)");
    else
        $(this).css("background", "");

    toggleBirthLocs();
});

$("#button-emigration").on("click", function () {
    showEmigration = !showEmigration;

    if (showEmigration)
        $(this).css("background", "linear-gradient(to bottom, #3f3f3f 5%, #1b1b1b 100%)");
    else
        $(this).css("background", "");

    toggleEmigrationEdges();
})

$("#button-immigration").on("click", function () {
    showImmigration = !showImmigration;

    if (showImmigration)
        $(this).css("background", "linear-gradient(to bottom, #3f3f3f 5%, #1b1b1b 100%)");
    else
        $(this).css("background", "");

    toggleImmigrationEdges();
})

$("#button-inner").on("click", function () {
    showInner = !showInner;

    if (showInner)
        $(this).css("background", "linear-gradient(to bottom, #3f3f3f 5%, #1b1b1b 100%)");
    else
        $(this).css("background", "");

    toggleInnerEdges();
})

$("#button-loc").on("click", function () {
    showLocs = !showLocs;

    if (showLocs)
        $(this).css("background", "linear-gradient(to bottom, #e00000 5%, #910000 100%)");
    else
        $(this).css("background", "");

    toggleLocs();
})

$("#button-coloring").on("click", function () {
    showColoring = !showColoring;

    if (showColoring)
        $(this).css("background", "linear-gradient(to left, #00ff00, #ff0000)");
    else
        $(this).css("background", "");

    toggleColoring();
})