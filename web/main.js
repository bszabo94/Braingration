
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
    placesGroup.attr("transform", "translate(" + [t.x, t.y] + ")scale(" + t.k + ")");
}

var geoData = {};

var edges = {
    from: {},
    to: {}
};
var scores;
var showBirths = true,
    showLocs = true,
    showImmigration = true,
    showEmigration = true,
    showInner = true;

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
var edgesGroup = svg.append("g").attr("id", "edges");
var placesGroup = svg.append("g").attr("id", "places");


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
    $("#birthlocs").children().attr("display", "none");

    if (showBirths) {
        label = $(".country-on").attr("id");
        $("#birthlocs > ." + label)
            .removeAttr("display");
    }
}

toggleLocs = function () {
    $("#places").children().attr("display", "none");

    if (showLocs) {
        label = $(".country-on").attr("id");
        $("#places > ." + label)
            .removeAttr("display");
    }
}

toggleEmigrationEdges = function () {
    if (!showEmigration)
        $("#edges").children(".e-edge")
            .attr("display", "none");
    else
        $("#edges").children(".e-edge")
            .removeAttr("display");
}

toggleImmigrationEdges = function () {
    if (!showImmigration)
        $("#edges").children(".i-edge")
            .attr("display", "none");
    else
        $("#edges").children(".i-edge")
            .removeAttr("display");
}

toggleInnerEdges = function () {
    if (!showInner)
        $("#edges").children(".inner-edge")
            .attr("display", "none");
    else
        $("#edges").children(".inner-edge")
            .removeAttr("display");
}



selectCountry = function (node) {

    if (d3.select(node).classed("country-on")) {
        d3.selectAll(".country").classed("country-on", false);
        $(".country-filled")
            .removeAttr("style")
            .removeClass("country-filled")
            .unbind("mouseover mouseleave")
            ;

        $("#edges").empty();
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

    $("#edges").empty();
    createEdgesFrom($(node).attr("id"));
    createEdgesTo($(node).attr("id"));
    createEdgesInner($(node).attr("id"));

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
                placesGroup.append("path")
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

drawData();


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