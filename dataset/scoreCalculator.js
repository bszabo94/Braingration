const SparqlClient = require('sparql-client-2');
const client = new SparqlClient("http://dbpedia.org/sparql");

const scoreboard = {
    "http://dbpedia.org/ontology/Town": 10000,
    "http://dbpedia.org/ontology/Settlement": 10000,
    "http://dbpedia.org/ontology/Country": 1,
    "http://dbpedia.org/ontology/City": 10000,
    "http://dbpedia.org/ontology/Region": 100,
    "http://dbpedia.org/ontology/Village": 10000,
    "http://dbpedia.org/ontology/AdministrativeRegion": 100,
    "http://dbpedia.org/ontology/District": 100,
    "http://dbpedia.org/ontology/Capital": 10000,
    "http://dbpedia.org/class/yago/Town108665504": 10000,
    "http://dbpedia.org/class/yago/Municipality108626283": 10000,
    "http://dbpedia.org/class/yago/UrbanArea108675967": 10000,
    "http://dbpedia.org/class/yago/Region108630985": 100,
    "http://dbpedia.org/class/yago/Country108544813": 1,
    "http://dbpedia.org/class/yago/Empire108557482": 1,
    "http://dbpedia.org/class/yago/Subdivision108674251": 100,
    "http://dbpedia.org/class/yago/AdministrativeDistrict108491826": 100,
    "http://dbpedia.org/class/yago/Tract108673395": 100,
    "http://dbpedia.org/class/yago/Capital108518505": 10000,
    "http://dbpedia.org/class/yago/State108654360": 100,
    "http://dbpedia.org/class/yago/Land109334396": 1,
    "http://dbpedia.org/class/yago/City108524735": 10000,
    "http://dbpedia.org/class/yago/Area108497294": 100
};

const prefix = `prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> prefix dbo: <http://dbpedia.org/ontology/> 
    prefix dbr: <http://dbpedia.org/resource/> 
    prefix dct:  <http://purl.org/dc/terms/> 
    prefix dbp: <http://dbpedia.org/property/> 
    prefix xsd: <http://www.w3.org/2001/XMLSchema#> 
    prefix geo: <http://www.w3.org/2003/01/geo/wgs84_pos#> `;

module.exports = async function (location) {
    const querybase = `select ?type 
        { <${location.uri}> a ?type . }`
    const query = prefix + querybase;

    await client.query(query)
        .execute()
        .then((result) => {
            for (binding of result.results.bindings) {
                if (scoreboard[binding.type.value] != undefined)
                    location.score += scoreboard[binding.type.value];

            }
        });

};