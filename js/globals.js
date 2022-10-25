// var getQueryVariable = function (variable) {
//     var query = window.location.search.substring(1);
//     var vars = query.split("&");
//     for (var i = 0; i < vars.length; i++) {
//         var pair = vars[i].split("=");
//         if (pair[0] == variable) {
//             return pair[1];
//         }
//     }
//     console.log('Query Variable ' + variable + ' not found');
//     return undefined;
// }
import {Atlas} from "./atlas";

var stringToBoolean = function (s) {
    switch (s) {
        case '1':
            return true;
        case '0':
            return false;
    }
};

var url_string = window.location.href;
var url = new URL(url_string);

//I was still getting an undefined dataset and no index.txt alert so I'm gonna hardcode the values normally read from the URL for now.
var atlas = null;

function setAtlas(value) {
    atlas = value;
}

function getAtlas() {
    return atlas
}

var folder = "Demo6"; //("dataset");
var dataFiles = {}


var labelLUT = "baltimore"; //url.searchParams.get("lut");
var isLoaded = 0; //parseInt(url.searchParams.get("load"));
var metric = stringToBoolean(url.searchParams.get("metric"));
if( metric == undefined){
    metric = false;
}
var mobile = stringToBoolean(url.searchParams.get("mobile"));

if( mobile == undefined){
    mobile = false;
}

function setDataFile(files) {
    dataFiles=files
}

function getDataFile() {
    return dataFiles;
}

console.log('This is ' + ((mobile)?'Mobile':'Desktop') + ' version');



export {labelLUT,atlas,folder,dataFiles,metric,mobile,isLoaded,setDataFile,getAtlas,setAtlas,getDataFile}