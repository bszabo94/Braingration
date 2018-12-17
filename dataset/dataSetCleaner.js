const fs = require('fs');


// var data_dates = require("./data_dates.json");
// var data_places = require("./data_places.json");

// mergeData(data_places, data_dates);

module.exports = function (geodata, datesdata) {
    let scientists = {};
    let places = {};
    let birthplaces = new Set();

    const birthConcept = "http://dbpedia.org/ontology/birthPlace";

    for (data of geodata) {
        let uri = data.person.value;
        let concept = data.concept.value;
        let object = data.object.value;

        let place = places[object];
        if (place === undefined)
            place = createPlace(object, places);

        place.lat.add(parseFloat(data.lat.value));
        place.long.add(parseFloat(data.long.value));

        let person = scientists[uri];
        if (person === undefined)
            person = createScientist(uri, scientists);

        if (concept == birthConcept){
            person.birthplace.add(place);
            birthplaces.add(place);
        }
            
        else
            person.places.add(place);
    }

    for (data of datesdata) {
        let uri = data.person.value;

        let person = scientists[uri];
        if (person === undefined)
            person = createScientist(uri, scientists);

        person.birthyear.add(getYear(data.birthDate.value));
        if (data.deathDate != undefined)
            person.deathyear.add(getYear(data.deathDate.value));
    }

    for (place of Object.values(places)) {
        place.lat = Array.from(place.lat).reduce((a, b) => a + b, 0) / place.lat.size;
        place.long = Array.from(place.long).reduce((a, b) => a + b, 0) / place.long.size;
    }

    scientists = Object.values(scientists).filter((person) => clean(person));
    // scientists = scientists.sort((a,b) => a.birthyear > b.birthyear);


    //stats
    data = {
        'firstyear': 5000,
        'lastyear': -5000,
        'totalscientist': scientists.length,
        'totalplaces': places.length,
        'totaledges': 0,
        // 'data': scientists
        'data': []
    }


    for (scientist of scientists) {
        if (scientist.birthyear < data.firstyear)
            data.firstyear = scientist.birthyear;
        if (scientist.deathyear > data.lastyear)
            data.lastyear = scientist.deathyear;
        data.totaledges += scientist.places.length;
        if (scientist.birthplace.length > 1) {
            data.multiplebirthplaces++;
            data.data.push(scientist);
        }

        else if (scientist.birthplace.length == 1)
            data.singlebirthplaces++;
        else
            console.log("ANOMALY AT " + scientist.uri);
    }
    
    birthplaces = Array.from(birthplaces);
    //fs.writeFileSync("test3.json", JSON.stringify(data, null, 2));
    return { "data": data, "places": places , 'birthplaces': birthplaces};
}

function clean(scientist) {
    if (scientist.birthplace.size == 0 || scientist.places.size == 0 || (scientist.birthyear.size == 0 && scientist.deathyear.size == 0))
        return false;

    scientist.birthplace = Array.from(scientist.birthplace);
    scientist.birthyear = Array.from(scientist.birthyear);
    scientist.places = Array.from(scientist.places);
    scientist.deathyear = Array.from(scientist.deathyear);

    scientist.places = scientist.places.filter((place) => !scientist.birthplace.includes(place));

    cleanedyears = cleanYears(scientist.birthyear, scientist.deathyear);
    scientist.birthyear = cleanedyears.birthyear;
    scientist.deathyear = cleanedyears.deathyear;

    return true;
}


function cleanYears(birthyear, deathyear) {
    const maxYears = 117;
    const minYears = 15;
    const avgYears = 70;
    const thisYear = new Date().getFullYear();

    if (birthyear.length > 1)
        birthyear.filter((year) => !deathyear.includes(year));

    if (deathyear.length > 1)
        deathyear.filter((year) => !birthyear.includes(year));


    birthyear = birthyear.reduce((a, b) => a + b, 0) / birthyear.length;
    deathyear = deathyear.reduce((a, b) => a + b, 0) / deathyear.length;

    if (isNaN(birthyear))
        birthyear = deathyear - avgYears;

    if (isNaN(deathyear) && (thisYear - birthyear[0]) > maxYears)
        deathyear = birthyear + avgYears;
    else if (isNaN(deathyear))
        deathyear = thisYear; // :( needed for the visualisation. "Dire times call for dire measures"
    else if (deathyear - birthyear > maxYears || deathyear - birthyear < minYears)
        deathyear = birthyear + avgYears;


    return { birthyear, deathyear };
}

function createScientist(uri, scientists) {
    scientist = {
        'uri': uri,
        'birthplace': new Set(),
        'places': new Set(),
        'birthyear': new Set(),
        'deathyear': new Set()
    };
    scientists[uri] = scientist;
    return scientist
}

function createPlace(uri, places) {
    place = {
        'uri': uri,
        'lat': new Set(),
        'long': new Set(),
        'score': 0
    };
    places[uri] = place;
    return place;
}

function getYear(date) {
    if (date === undefined)
        return undefined
    else {
        if (date[0] == '-') {
            year = date.substr(1, date.length - 1);
            return -1 * parseInt(year.substr(0, year.indexOf("-")));
        }

        return parseInt(date.substr(0, date.indexOf("-")));
    }
}