/**
 * Created by giorgioconte on 31/01/15.
 */

import {scanFolder, loadLookUpTable, loadSubjectNetwork, loadSubjectTopology} from "./utils/parsingData";
import {isLoaded, dataFiles} from "./globals";
import {queue} from "./external-libraries/queue";
import {modelLeft,modelRight} from './model';
import {initSubjectMenu} from './GUI';
import {initControls,initCanvas} from './drawing';

var init = function () {

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
                .awaitAll(function () {
                    console.log("Loading data done.");
                    modelLeft.createGroups();
                    modelRight.createGroups();
                    initControls();
                    initCanvas();
                })
            ;
        });

};


var parse = function (callback) {

    console.log("Parsing data ... ");
    modelRight.labelKeys = JSON.parse(localStorage.getItem("labelKeys"));
    modelRight.centroids = JSON.parse(localStorage.getItem("centroids"));
    modelRight.connectionMatrix['normal'] = JSON.parse(localStorage.getItem("normal"));
    modelRight.connectionMatrix['isomap'] = JSON.parse(localStorage.getItem("normal"));
    modelRight.metricValues = JSON.parse(localStorage.getItem("metricValues"));
    modelLeft.labelKeys = JSON.parse(localStorage.getItem("labelKeys"));
    modelLeft.centroids = JSON.parse(localStorage.getItem("centroids"));
    modelLeft.connectionMatrix['normal'] = JSON.parse(localStorage.getItem("normal"));
    modelLeft.connectionMatrix['isomap'] = JSON.parse(localStorage.getItem("normal"));
    modelLeft.metricValues = JSON.parse(localStorage.getItem("metricValues"));

    if (metric == true) {
        metricQuantileScale = d3.scale.quantile()
            .domain(metricValues)
            .range(['#000080', '#0000c7', '#0001ff', '#0041ff', '#0081ff', '#00c1ff', '#16ffe1', '#49ffad',
                '#7dff7a', '#b1ff46', '#e4ff13', '#ffd000', '#ff9400', '#ff5900', '#ff1e00', '#c40000']);
    }

    callback(null, null);
};


if (isLoaded == 0) {
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
        .awaitAll(function () {
            init();
        })
}
