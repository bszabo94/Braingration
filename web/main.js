
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
    showInner = false;

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

var defs = svg.append("defs");
var linearGrad = defs.append("linearGradient")
    .attr("id", "grad1")
    .attr("x1", "0%")
    .attr("x2", "0%")
    .attr("y1", "0%")
    .attr("y2", "100%");

linearGrad.append("stop")
    .attr("offset", "0%")
    .attr("stop-color", "green")
    .attr("style", "stop-opacity:0.2");
linearGrad.append("stop")
    .attr("offset", "100%")
    // .attr("stop-color", "red")
    .attr("style", "stop-opacity:1");

var countriesGroup = svg.append("g").attr("id", "map");

var birthsGroup = svg.append("g").attr("id", "birthlocs");
var locationsGroup = svg.append("g").attr("id", "places");
var edgesGroup = svg.append("g").attr("id", "edges");

var maxTone = 255,
    minTone = 50;

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


calculateTone = function (min, max, newmin, newmax, x) {
    if (x >= max)
        return newmax;
    if (x <= min)
        return newmin;

    return (newmax * ((x - min) / (max - x)) + newmin) / (1 + ((x - min) / (max - x)));
}

createEdgesFrom = function (from) {
    let op = 0.5;

    if (edges.from[from] == undefined)
        return;

    for (edge of edges.from[from]) {
        if (edge.from == edge.to)
            continue;
        edgesGroup.append("path")
            .datum({ type: "LineString", coordinates: edge.coordinates })
            .attr("d", path)
            .attr("class", "edge e-edge")
            .attr("style", "opacity: " + op / edge.weight)
            .attr("stroke", "url(#grad1)")
            .attr("display", "none")
            ;
    }
    toggleEmigrationEdges();
};

createEdgesTo = function (to) {
    if (edges.from[to] == undefined)
        return;

    let op = 0.5;

    for (edge of edges.to[to]) {
        if (edge.from == edge.to)
            continue;
        edgesGroup.append("path")
            .datum({ type: "LineString", coordinates: edge.coordinates })
            .attr("d", path)
            .attr("class", "edge i-edge")
            .attr("stroke", "url(#grad1)")
            .attr("style", "opacity: " + op / edge.weight)
            .attr("display", "none")
            ;
    }
    toggleImmigrationEdges();
};

createEdgesInner = function (from) {
    if (edges.from[from] == undefined)
        return;

    let op = 0.5;

    for (edge of edges.from[from]) {
        if (edge.from != edge.to)
            continue;

        edgesGroup.append("path")
            .datum({ type: "LineString", coordinates: edge.coordinates })
            .attr("d", path)
            .attr("class", "edge inner-edge")
            .attr("stroke", "url(#grad1)")
            .attr("style", "opacity: " + op / edge.weight)
            .attr("display", "none")
            ;
    }
    toggleInnerEdges();
}

toggleBirthLocs = function () {
    // $("#birthlocs").children().attr("display", "none");
    // if (showBirths) {
    //     label = $(".country-on").attr("id");
    //     $("#birthlocs > ." + label)
    //         .removeAttr("display");
    // }
    if (showBirths) {
        birthLocs[selectedCountry.getAttribute("id")].node().removeAttribute("display");
    } else {
        birthLocs[selectedCountry.getAttribute("id")].node().setAttribute("display", "none");
    }
}

toggleLocs = function () {
    // $("#places").children().attr("display", "none");
    // if (showLocs) {
    //     label = $(".country-on").attr("id");
    //     $("#places > ." + label)
    //         .removeAttr("display");
    // }
    if (showLocs) {
        locations[selectedCountry.getAttribute("id")].node().removeAttribute("display");
    } else {
        locations[selectedCountry.getAttribute("id")].node().setAttribute("display", "none");
    }
}

toggleEmigrationEdges = function () {
    // if (!showEmigration)
    //     $("#edges").children(".e-edge")
    //         .attr("display", "none");
    // else
    //     $("#edges").children(".e-edge")
    //         .removeAttr("display");

    if (showEmigration) {
        edges[selectedCountry.getAttribute("id")]["from"].node().removeAttribute("display");
    } else {
        edges[selectedCountry.getAttribute("id")]["from"].node().setAttribute("display", "none");
    }
}

toggleImmigrationEdges = function () {
    // if (!showImmigration)
    //     $("#edges").children(".i-edge")
    //         .attr("display", "none");
    // else
    //     $("#edges").children(".i-edge")
    //         .removeAttr("display");

    if (showImmigration) {
        edges[selectedCountry.getAttribute("id")]["to"].node().removeAttribute("display");
    } else {
        edges[selectedCountry.getAttribute("id")]["to"].node().setAttribute("display", "none");
    }
}

toggleInnerEdges = function () {
    // if (!showInner)
    //     $("#edges").children(".inner-edge")
    //         .attr("display", "none");
    // else
    //     $("#edges").children(".inner-edge")
    //         .removeAttr("display");

    if (showInner) {
        edges[selectedCountry.getAttribute("id")]["inner"].node().removeAttribute("display");
    } else {
        edges[selectedCountry.getAttribute("id")]["inner"].node().setAttribute("display", "none");
    }
}

fillCountry = function (node, color) {
    console.log(node)
    node.style.fill = color;
}

selectCountryNative = function (node) {
    //clearning prev selection
    if (selectedCountry != undefined) {
        let country = selectedCountry.getAttribute("id");
        birthLocs[country].node().setAttribute("display", "none");
        locations[country].node().setAttribute("display", "none");

        edges[country]["from"].node().setAttribute("display", "none");
        edges[country]["to"].node().setAttribute("display", "none");
        edges[country]["inner"].node().setAttribute("display", "none");

        for (othercountry of Object.keys(tones[country])) {
            countries[othercountry].node().style.fill = "";
            // countries[othercountry].node().removeEventListeners
        }


        selectedCountry.classList.remove("country-on");
    }

    selectedCountry = node;
    selectedCountry.classList.add("country-on");

    toggleBirthLocs();
    toggleLocs();
    toggleInnerEdges();
    toggleEmigrationEdges();
    toggleImmigrationEdges();

    let country = selectedCountry.getAttribute("id");
    console.log(tones[country]);
    for (othercountry of Object.keys(tones[country])) {
        // let intensity = (score[othercountry] / score.total) * 20;
        // let color;
        // if (intensity < 0)
        //     color = d3.rgb(Math.max(40, Math.abs(intensity) * 255), 0, 0);
        // else
        //     color = d3.rgb(0, Math.max(40, Math.abs(intensity) * 255), 0);

        // console.log(tones)
        // console.log(othercountry)
        let color = d3.rgb(...tones[country][othercountry]);

        countries[othercountry].node().style.fill = color;
        // countries[othercountry].node().addEventListener("onmouseenter", fillCountry(countries[othercountry].node(), "#ffffff"));
        // $(countries[othercountry]).on("mouseover", )

    }

}


selectCountry = function (node) {
    if ($(node).hasClass("country-on")) {
        $(node).removeClass("country-on")
        $(".country").removeClass("country-on");
        $(".country-filled")
            .removeAttr("style")
            .removeClass("country-filled")
            .unbind("mouseover mouseleave")
            ;

        // $("#edges").empty();
        toggleBirthLocs();
        toggleLocs();
        return;
    }


    d3.selectAll(".country").classed("country-on", false);
    $(".country-filled")
        .removeAttr("style")
        .removeClass("country-filled")
        .unbind("mouseover mouseleave")
        ;

    d3.select(node).classed("country-on", true);
    // $("#birthlocs").children().attr("display", "none");
    $("#edges").children().attr("display", "none");

    toggleBirthLocs();
    toggleLocs();
    // $("#birthlocs > ." + $(node).attr("id"))
    //     .removeAttr("display");

    // $("#edges").empty();
    // createEdgesFrom($(node).attr("id"));
    // createEdgesTo($(node).attr("id"));
    // createEdgesInner($(node).attr("id"));

    country = $(node).attr("id");

    score = scores[country];
    for (key of Object.keys(score)) {
        if (key == country)
            continue;

        let intensity = (score[key] / score.total) * 20;
        let color;
        if (intensity < 0)
            color = d3.rgb(Math.max(40, Math.abs(intensity) * 255), 0, 0);
        else
            color = d3.rgb(0, Math.max(40, Math.abs(intensity) * 255), 0);


        $("#" + key)
            .addClass("country-filled")
            .css("fill", color)
            .on("mouseover", function () {
                $(this).css("fill", "white")
            })
            .on("mouseleave", function () {
                $(this).css("fill", color)
            });
    }

};


drawDataJS = function () {
    d3.json("combined.json").then((json) => {
        json.countries.forEach((country) => {
            let id = country.feature.properties.adm0_a3;
            let countryDOM = countriesGroup
                .append("path")
                .attr("class", "country")
                .attr("id", id)
                .attr("d", path(country.feature))
                .on("click", function (d, i) {
                    selectCountryNative(this)
                })
                ;

            countries[id] = countryDOM;

            birthLocs[id] = birthsGroup.append("g")
                // .attr("class", "birthloc " + id)
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

        let op = 0.5;

        console.log("creating edges...")

        json.edges.forEach(edge => {
            if (edges[edge.from] == undefined || edges[edge.to] == undefined)
                return;

            if (edge.from == edge.to) {
                let currentGroup = edges[edge.from]["inner"];
                currentGroup.append("path")
                    .datum({ type: "LineString", coordinates: edge.coordinates })
                    .attr("d", path)
                    .attr("class", "edge")
                    .attr("style", "opacity: " + op / edge.weight)
                    ;
            } else {
                let currentGroup = edges[edge.from]["from"];
                currentGroup.append("path")
                    .datum({ type: "LineString", coordinates: edge.coordinates })
                    .attr("d", path)
                    .attr("class", "edge")
                    .attr("style", "opacity: " + op / edge.weight)
                    ;

                currentGroup = edges[edge.to]["to"];
                currentGroup.append("path")
                    .datum({ type: "LineString", coordinates: edge.coordinates })
                    .attr("d", path)
                    .attr("class", "edge")
                    .attr("style", "opacity: " + op / edge.weight)
                    ;

                if (tones[edge.from][edge.to] == undefined)
                    tones[edge.from][edge.to] = 0;

                if (tones[edge.to][edge.from] == undefined)
                    tones[edge.to][edge.from] = 0;

                tones[edge.from][edge.to] -= 1;
                tones[edge.to][edge.from] += 1;
            }
        });

        console.log("calculating tones");

        // console.log(tones["KOS"])
        // console.log(tones["HUN"]["RUS"])
        // console.log(tones["RUS"]["HUN"])

        for (country of Object.keys(tones)) {
            if (Object.keys(tones[country]).length == 0)
                continue;

            // tones[country]["total"] = Object.values(tones[country]).reduce((a, b) => { return Math.abs(a) + Math.abs(b) });



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
            // delete tones[country]["total"];
        }
        console.log(tones);
    });
}

drawData = function () {
    d3.json("combined.json").then((json) => {
        json.countries.forEach((data) => {
            countriesGroup
                .append("path")
                .attr("class", "country")
                .attr("id", data.feature.properties.adm0_a3)
                .attr("d", path(data.feature))
                .on("click", function (d, i) {
                    //     d3.selectAll(".country").classed("country-on", false);
                    //     d3.select(this).classed("country-on", true);
                    //     $("#birthlocs").children().attr("display", "none");
                    //     $("#edges").children().attr("display", "none");


                    //     $("#birthlocs > ." + $(this).attr("id"))
                    //         .removeAttr("display");

                    //     $("#edges").empty();
                    //     createEdgesFrom($(this).attr("id"));
                    //     createEdgesTo($(this).attr("id"));
                    selectCountry(this)
                })
                ;

            data.birthlocs.forEach(loc => {
                path.pointRadius((d) => 1 + d.weight / 15);
                var point = path({ "type": "Point", "coordinates": loc.coordinates, "weight": loc.weight })
                birthsGroup.append("path")
                    .attr("class", "birthloc " + data.feature.properties.adm0_a3)
                    .attr("d", point)
                    .attr("display", "none");
            });


            data.locs.forEach(loc => {
                path.pointRadius((d) => 1);
                var point = path({ "type": "Point", "coordinates": loc })
                locationsGroup.append("path")
                    .attr("class", "loc " + data.feature.properties.adm0_a3)
                    .attr("d", point)
                    .attr("display", "none");
            });
        });

        json.edges.forEach(edge => {
            if (edges.from[edge.from] == undefined)
                edges.from[edge.from] = [];

            if (edges.to[edge.to] == undefined)
                edges.to[edge.to] = [];

            edges.from[edge.from].push(edge);
            edges.to[edge.to].push(edge);
        });

        scores = json.scores;
        Object.values(scores).forEach(country => {
            country.total = 0;
            delete country.undefined;
            country.total = Object.values(country).reduce((a, b) => { return Math.abs(a) + Math.abs(b) })
        });
    });

};

// drawData();
drawDataJS();


$("#button-birth").on("click", function () {
    showBirths = !showBirths;
    toggleBirthLocs();
});

$("#button-emigration").on("click", function () {
    showEmigration = !showEmigration;
    toggleEmigrationEdges();
})

$("#button-immigration").on("click", function () {
    showImmigration = !showImmigration;
    toggleImmigrationEdges();
})

$("#button-inner").on("click", function () {
    showInner = !showInner;
    toggleInnerEdges();
})

$("#button-loc").on("click", function () {
    showLocs = !showLocs;
    toggleLocs();
})