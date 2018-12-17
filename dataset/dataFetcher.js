
const SparqlClient = require('sparql-client-2');
const fs = require('fs');

const mergeData = require('./dataSetCleaner');
const score = require('./scoreCalculator');

const placeparams = {
    queryheading: ` prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> prefix dbo: <http://dbpedia.org/ontology/> 
        prefix dbr: <http://dbpedia.org/resource/> 
        prefix dct:  <http://purl.org/dc/terms/> 
        prefix dbp: <http://dbpedia.org/property/> 
        prefix xsd: <http://www.w3.org/2001/XMLSchema#> 
        prefix geo: <http://www.w3.org/2003/01/geo/wgs84_pos#> `,

    querycount: `select count(*) as ?count WHERE {
        ?person a dbo:Scientist ;
            ?concept ?object .
        ?object geo:lat ?lat ;
            geo:long ?long .
        }`,

    querydata: `select ?person ?concept ?object ?lat ?long WHERE {
        ?person a dbo:Scientist ;
            ?concept ?object .
        ?object geo:lat ?lat ;
            geo:long ?long .
        }`,

    limit: 10000,
    endpoint: "http://dbpedia.org/sparql"
};

const dateparams = {
    queryheading: ` prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> prefix dbo: <http://dbpedia.org/ontology/> 
        prefix dbr: <http://dbpedia.org/resource/> 
        prefix dct:  <http://purl.org/dc/terms/> 
        prefix dbp: <http://dbpedia.org/property/> 
        prefix xsd: <http://www.w3.org/2001/XMLSchema#> 
        prefix geo: <http://www.w3.org/2003/01/geo/wgs84_pos#> `,

    querycount: `select count(*) as ?count WHERE {
        ?person a dbo:Scientist ;
            dbo:birthDate ?birthDate .
        OPTIONAL { ?person dbo:deathDate ?deathDate. } 
        } `,

    querydata: `select ?person ?birthDate ?deathDate WHERE {
        ?person a dbo:Scientist ;
            dbo:birthDate ?birthDate .
        OPTIONAL { ?person dbo:deathDate ?deathDate. } 
        } `,

    limit: 10000,
    endpoint: "http://dbpedia.org/sparql"
};


fetchall();


async function fetchall() {
    var places = await fetchData(placeparams);
    var dates = await fetchData(dateparams);

    var merged = mergeData(places, dates);
    // fs.writeFileSync("data.json", JSON.stringify(merged.data, null, 2));
    // fs.writeFileSync("places.json", JSON.stringify(merged.places, null, 2));

    // const placesLen = merged.birthplaces.length;
    for (location of merged.birthplaces) {
        // console.log("Scoring location " + merged.birthplaces.indexOf(location) + " of " + placesLen + ".");
        await score(location);
    }

    for(person of merged.data.data){
        let birthplace = person.birthplace.sort((a,b) => a.score < b.score);
        person.birthplace = birthplace[0];
    }

    merged.data.data = merged.data.data.sort((a,b) => a.birthyear > b.birthyear);

    fs.writeFileSync("scientists_data_full.json", JSON.stringify(merged.data, null, 2));

}

async function fetchData(params) {
    const client = new SparqlClient(params.endpoint);
    let count = await client
        .query(params.queryheading + params.querycount)
        .execute()
        .then((result) => {
            let count = parseFloat(result["results"]["bindings"][0]["count"]["value"]);
            return Math.ceil(count / params.limit);
        });

    querypromises = [];
    queryresults = [];
    for (i = 0; i < count; i++) {
        const query = params.queryheading
            + params.querydata
            + " limit " + params.limit
            + " offset " + i * params.limit;

        querypromises.push(client
            .query(query)
            .execute()
            .then((result) => {
                let data = result["results"]["bindings"];
                queryresults.push(...data);
            }));
    }
    await Promise.all(querypromises);

    return queryresults;
}

async function fetchScores(data) {

}