/**
 * Created by giorgioconte on 02/02/15.
 */

import * as d3 from '../external-libraries/d3'
import {modelLeft,modelRight} from '../model';

// var connectionMatrixScale;
var groupColor = d3.scale.category10();
var metric = false;
var metricQuantileScale;            // scaling function
var colorMap = {
    'Frontal' : '#2ca02c',
    'Parietal': '#9467bd',
    'Occipital':'#d62728',
    'Subcortical': '#1f77b4' ,
    'Temporal': '#ff7f0e',
    'brainstem' : '#7f7f7f',
    'hippocampus' : '#d62728',
    'thalamus': '#1f77b4',
    'putamen' : '#2ca02c',
    'precuneus' : '#9467bd',
    'superiorParietal':'#e377c2',
    'Superior frontal Cortex':'#bcbd22',
    'Paracentral':'#17becf',
    'Pallidum':'#8c564b',
    'Cingulate':'#ff7f0e',
    'Caudate':'#ad494a'
};

var scaleColorGroup = function(model, group) {

    var color;
    var filteredGroup;
    if(group.replace) { // anatomy, rich-club, embeddeness
        filteredGroup = group.replace("left", "");
        filteredGroup = filteredGroup.replace("right", "");
    }else{
        filteredGroup = group;
    }

    color = groupColor(filteredGroup);

    // for rich-club, color non-RichClub similarly
    if(typeof (filteredGroup) != 'number' && filteredGroup.indexOf("RichClub") > -1){
        color = "#6C7A89";
    }

    if(colorMap[filteredGroup] != undefined){
        color = colorMap[filteredGroup];
    }

    // metric based
    /*if(model.getActiveGroupName() == 4){
        if(nodeIndex == -1){
            console.log("ERROR!!!!");
            return metricQuantileScale(0);
        }
        color = metricQuantileScale(metricValues[nodeIndex][0]);
    }*/
    return color;
};

// set group color according to the activeGroup number of elements
var setColorGroupScale = function (side) { //model) {
    var model;
    if (side !== "Left") {
        model = modelRight
    } else {
        model = modelLeft;
    }
    //groupColor = (modelLeft.getActiveGroup().length <= 10) ? d3.scale.category10() : d3.scale.category20();
    groupColor = (model.getActiveGroup().length <= 10) ? d3.scale.category10() : d3.scale.category20();
};

// return a power scale function for the adjacency matrix
// never used !!
// getConnectionMatrixScale = function() {
//     var connectionMatrix = getConnectionMatrix();
//     var allCells = [];
//     if(!connectionMatrixScale){
//         //This code is optimized for symmetric matrices
//         var rows = connectionMatrix.length;
//         for(var i=0; i < rows; i++){
//             for(var j = 0; j<i; j++){
//                 allCells[allCells.length] = connectionMatrix[i][j];
//             }
//         }
//         connectionMatrixScale = d3.scale.pow().domain(
//             [
//                 d3.min(allCells, function(element){ return element; }),
//                 d3.max(allCells, function(element){ return element; })
//             ]
//         ).range(colorbrewer.Greys[6]);
//     }
//     return connectionMatrixScale;
// };

// round a number to specified digits
var round = function(number, digits){
    digits = Math.pow(10,digits);
    return Math.round(number*digits)/digits;
};

export {scaleColorGroup,setColorGroupScale}