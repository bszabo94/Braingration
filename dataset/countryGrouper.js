var d3 = require('d3');
var fs = require('fs');


var geodata = require('./web/custom.geo.json');
var scientists = require('./web/scientists_data_full.json');

var combined = {};
combined["countries"] = [];
combined["edges"] = [];
// combined["scores"] = {};

unsortededges = {};

for (feature of geodata.features) {
    country = {};
    country["feature"] = feature;
    country["code"] = feature.properties.adm0_a3;
    country["birthlocs"] = [];
    country["locs"] = [];
    combined.countries.push(country);

}
for (scientist of scientists.data) {
    coords = [scientist.birthplace.long, scientist.birthplace.lat];
    birthloc = { "coordinates": coords, "weight": scientist.places.length }
    let birthcountry;
    for (country of combined.countries) {
        if (d3.geoContains(country.feature, coords)) {
            country.birthlocs.push(birthloc);
            birthcountry = country.feature.properties.adm0_a3;
            break;
        }
    }

    for (place of scientist.places) {
        loc = [place.long, place.lat];
        for (country of combined.countries) {
            if (d3.geoContains(country.feature, loc)) {
                country.locs.push(loc);
                let edge = {};
                edge["from"] = birthcountry;
                edge["to"] = country.feature.properties.adm0_a3;
                edge["coordinates"] = [birthloc.coordinates, loc];
                edge["weight"] = birthloc.weight;
                combined.edges.push(edge);
                break;
            }
        }
    }
}

// for (edge of combined.edges) {
//     from = edge.from;
//     to = edge.to;
//     scores = combined.scores;

//     if (scores[from] == undefined) {
//         scores[from] = {};
//         // scores[from]["total"] = 0;
//     }

//     if (scores[to] == undefined) {
//         scores[to] = {};
//         // scores[to]["total"] = 0;
//     }

//     if (scores[from][to] == undefined)
//         scores[from][to] = 0;
//     if (scores[to][from] == undefined)
//         scores[to][from] = 0;

//     scores[from][to] -= 1;
//     scores[to][from] += 1;
//     // scores[to]["total"] += 1;
// }

fs.writeFileSync("combined.json", JSON.stringify(combined, null, 2));

console.log("done")