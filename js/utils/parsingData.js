/**
 * Created by giorgioconte on 31/01/15.
 */

var folder;

var setFolder = function (folderName, callback) {
    folder = folderName;
    console.log("Source folder set to: ", folder);
    callback(null,null);
};

// it is assumed all data folder should have an index.txt file describing its contents
var scanFolder = function (callback) {
    var indexFile = "./data/" + folder + "/index.txt";
    $.ajax({
        url: indexFile,
        type:'HEAD',
        error: function() {
            alert("Index file don't exist, can not continue");
            return false;
        },
        success: function() {
            Papa.parse(indexFile, {
                download: true,
                delimiter: ",",
                dynamicTyping: true,
                header: true,
                skipEmptyLines: true,
                error: "continue",
                complete: function (results) {
                    dataFiles = results.data;
                    console.log("Subjects loaded");
                    callback(null,null);
                }
            });
            return true;
        }
    });
};

var loadIcColors = function (callback) {
    Papa.parse("./data//WB2s1IC.csv", {
        download: true,
        delimiter: ",",
        dynamicTyping: true,
        error:"continue",
        skipEmptyLines: true,
        complete: function (results) {
            modelLeft.setICColor(results);
            modelRight.setICColor(results);
            callback(null, null);
        }
    });
};

// the look up table is common for all subjects of a dataset, provides information about a specific Atlas
// for each label we have:
// label#: label number in the Atlas (mandatory)
// group: anatomical grouping : lobe name (mandatory)
// region_name: region name (mandatory)
// hemisphere: left or right (mandatory)
// place: embeddness (optional)
// rich_club: rich club affiliation: region name vs non-RichClub (optional)
var loadLookUpTable = function (callback) {
    var labelsLUTFilename = "LookupTable_" + labelLUT + ".csv";
    Papa.parse("data/"+labelsLUTFilename, {
        download: true,
        delimiter: ";",
        dynamicTyping: true,
        header: true,
        skipEmptyLines: true,
        complete: function (results) {
            console.log("Setting up Look-up Table");
            atlas = new Atlas(results);
            console.log("Look up table loaded ... ");
            callback(null, null);
        }
    });
};

var loadSubjectNetwork = function (fileNames, model, callback) {
    Papa.parse("data/"+folder + "/" + fileNames.network,{
        download: true,
        dynamicTyping: true,
        delimiter: ',',
        header: false,
        skipEmptyLines: true,
        complete: function(results){
            model.setConnectionMatrix(results);
            console.log("NW loaded ... ");
            callback(null,null);
        }
    });
};

var loadSubjectTopology = function (fileNames, model, callback) {
    Papa.parse("data/"+folder + "/" + fileNames.topology,{
        download: true,
        dynamicTyping: true,
        delimiter: ',',
        header: false,
        skipEmptyLines: true,
        complete: function(results){
            model.setTopology(results.data);
            console.log("Topology loaded ... ");
            callback(null,null);
        }
    });
};

/*
var loadColorMap = function (callback) {
    Papa.parse("data/colorMap.csv", {
        download: true,
        delimiter: ',',
        dynamicTyping: true,
        header: false,
        complete: function(results){
            modelLeft.setGroup(results);
            modelRight.setGroup(results);
            callback(null,null);
        }
    });
};*/


var loadMetricValues = function(callback){
    console.log("Loading metric file");
    Papa.parse("data/Anatomic/metric.csv",{
        download: true,
        delimiter: ',',
        dynamicTyping: true,
        header: false,
        skipEmptyLines: true,
        complete: function(results){
            modelLeft.setMetricValues(results);
            modelRight.setMetricValues(results);
            callback(null,null);
        }
    })
};