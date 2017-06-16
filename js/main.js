/**
 * Created by giorgioconte on 31/01/15.
 */

var stringToBoolean = function (s) {
    switch (s){
        case '1': return true;
        case '0': return false;
    }
};

var atlas = null;
var folder = getQueryVariable("dataset");
var dataFiles = {};

var labelLUT = getQueryVariable("lut");
var isLoaded = parseInt(getQueryVariable("load"));
var metric = stringToBoolean(getQueryVariable("metric"));
if( metric == undefined){
    metric = false;
}
var mobile = stringToBoolean(getQueryVariable("mobile"));
if( mobile == undefined){
    mobile = false;
}
console.log('This is ' + ((mobile)?'Mobile':'Desktop') + ' version');

init = function () {

    console.log("Init ... ");

    initSubjectMenu('Left');
    initSubjectMenu('Right');

    var idLeft = document.getElementById("subjectMenuLeft").selectedIndex;
    var idRight = document.getElementById("subjectMenuRight").selectedIndex;

    queue()
        .defer(loadSubjectNetwork, dataFiles[idLeft], modelLeft)
        .defer(loadSubjectNetwork, dataFiles[idRight], modelRight)
        .awaitAll(function () {
            queue()
            // PLACE depends on connection matrix
                .defer(loadSubjectTopology, dataFiles[idLeft], modelLeft)
                .defer(loadSubjectTopology, dataFiles[idRight], modelRight)
                .awaitAll( function () {
                    console.log("Loading data done.");
                    modelLeft.createGroups();
                    modelRight.createGroups();
                    initCanvas();
                })
            ;
        });

};

function getQueryVariable(variable) {
    var query = window.location.search.substring(1);
    var vars = query.split("&");
    for (var i=0;i<vars.length;i++) {
        var pair = vars[i].split("=");
        if (pair[0] == variable) {
            return pair[1];
        }
    }
    console.log('Query Variable ' + variable + ' not found');
    return undefined;
}



var parse = function(callback){

    console.log("Parsing data ... ");
    labelKeys = JSON.parse(localStorage.getItem("labelKeys"));
    centroids = JSON.parse(localStorage.getItem("centroids"));
    connectionMatrix['normal'] = JSON.parse(localStorage.getItem("normal"));
    connectionMatrix['isomap'] = JSON.parse(localStorage.getItem("normal"));
    metricValues = JSON.parse(localStorage.getItem("metricValues"));

    if(metric == true){
        metricQuantileScale  = d3.scale.quantile()
            .domain(metricValues)
            .range(['#000080','#0000c7','#0001ff','#0041ff','#0081ff','#00c1ff','#16ffe1','#49ffad',
                '#7dff7a','#b1ff46','#e4ff13','#ffd000','#ff9400','#ff5900','#ff1e00','#c40000']);
    }

    callback(null,null);
};



if(isLoaded == 0) {
    console.log("Loading data ... ");

    queue()
        .defer(scanFolder)
        .defer(loadLookUpTable)
        //.defer(loadIcColors)
        // .defer(loadColorMap)
        .awaitAll(function () {
            console.log("Loading data done.");
            init();
        });
} else {
    console.log("loaded from different files");

    queue()
        .defer(loadLookUpTable)
        //.defer(loadIcColors)
        .defer(parse)
        .awaitAll(function(){
            init();
        })
}