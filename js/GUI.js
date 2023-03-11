/**
 * Created by giorgioconte on 31/01/15.
 */
// this file contains functions that create\delete GUI controlling elements
//import {labelLUT, dataFiles, atlas, folder, setDataFile, setAtlas} from "../globals";
//import {dataFiles, atlas, folder, setDataFile, setAtlas} from "../globals";

const SHORTEST_DISTANCE = 0, NUMBER_HOPS = 1; //enums
var shortestPathVisMethod = SHORTEST_DISTANCE;
var thresholdMultiplier = 1.0; // 100.0 for fMRI data of values (-1.0->1.0) and 1.0 if values > 1.0

// initialize subject selection drop down menus
import {getDataFile,setDataFile,atlas} from "./globals.js";
import {changeSceneToSubject, changeActiveGeometry, changeColorGroup, updateScenes, redrawEdges, updateOpacity, updateNodesVisiblity, getSpt, previewAreaLeft, previewAreaRight, setThresholdModality, enableIpsilaterality, enableContralaterality} from './drawing'
import {modelLeft,modelRight} from './model'
import {setDimensionFactorLeftSphere,setDimensionFactorRightSphere,setDimensionFactorLeftBox,setDimensionFactorRightBox} from './graphicsUtils.js'
import {scaleColorGroup} from "./utils/scale";

var initSubjectMenu = function (side) {

    var select = document.getElementById("subjectMenu" + side);
    for (var i = 0; i < getDataFile().length; ++i) {
        var el = document.createElement("option");
        el.textContent = getDataFile()[i].subjectID;
        el.value = getDataFile()[i].subjectID;
        el.selected = (i==0);
        select.appendChild(el);
    }
    switch (side) {
        case 'Left':
            select.onchange = function () {
                changeSceneToSubject(this.selectedIndex, modelLeft, previewAreaLeft, side);
                };
            break;
        case 'Right':
            select.onchange = function () {
                changeSceneToSubject(this.selectedIndex, modelRight, previewAreaRight, side);
            };
            break;
    }
};

/* Node stuff at nodeInfoPanel */
// adds a slider to control Left of Right Sphere glyphs size
var addDimensionFactorSliderLeft = function (side) {
    var panel = d3.select("#nodeInfoPanel"+side);

	console.log("#nodeInfoPanel"+side);
	//console.log(side);

    if(side == 'Left') {
      panel.append("input")
        .attr("type", "range")
        .attr("value", "1")
        .attr("id", "dimensionSliderLeft"+side)
        .attr("min","0.2")
        .attr("max", "4")
        .attr("step","0.1")
        .on("change", function () {
            setDimensionFactorLeftSphere(this.value);
        });
    } else {
      panel.append("input")
        .attr("type", "range")
        .attr("value", "1")
        .attr("id", "dimensionSliderLeft"+side)
        .attr("min","0.2")
        .attr("max", "4")
        .attr("step","0.1")
        .on("change", function () {
            setDimensionFactorRightSphere(this.value);
        });
    }

    panel.append("label")
        .attr("for", "dimensionSlider")
        .attr("id", "dimensionSliderLabel"+side)
        .text(side+" Sphere Size");

    panel.append("br");
};

/* Node stuff at nodeInfoPanel */
// adds a slider to control Left or Right Box glyphs size
var addDimensionFactorSliderRight = function (side) {
    var panel = d3.select("#nodeInfoPanel"+side);

	console.log("#nodeInfoPanel"+side);
	
    if(side == 'Left') {
      panel.append("input")
        .attr("type", "range")
        .attr("value", "1")
        .attr("id", "dimensionSliderRight"+side)
        .attr("min","0.2")
        .attr("max", "4")
        .attr("step","0.1")
        .on("change", function () {
            setDimensionFactorLeftBox(this.value);
        });
    } else {
      panel.append("input")
        .attr("type", "range")
        .attr("value", "1")
        .attr("id", "dimensionSliderRight"+side)
        .attr("min","0.2")
        .attr("max", "4")
        .attr("step","0.1")
        .on("change", function () {
            setDimensionFactorRightBox(this.value);
        });
    }

    panel.append("label")
        .attr("for", "dimensionSlider")
        .attr("id", "dimensionSliderLabel"+side)
        .text(side+" Box Size");

    panel.append("br");
};

// adds a button to toggle skybox visibility
var addSkyboxButton = function () {

    var menu = d3.select("#nodeInfoPanel");
    menu.append("button")
        .text("Skybox")
        .attr("id", "skyboxVisibilityBtn")
        .on("click", function () {
            var input = d3.select("input#skyboxVisibilityInput").node();
            input.checked = !input.checked;
            setSkyboxVisibility(input.checked);
            updateScenes();
        })
        .append("input")
        .attr("type","checkbox")
        .attr("id","skyboxVisibilityInput")
        .attr("checked", true);
    menu.append("br");
};

// adds a text label showing: label - region name - nodal strength
var setNodeInfoPanel = function (region, index) {

    var panel = d3.select('#nodeInfoPanel');

    panel.selectAll("p").remove();

    var nodalStrengthLeft = Math.floor(modelLeft.getNodalStrength(index)*100)/100;
    var nodalStrengthRight = Math.floor(modelRight.getNodalStrength(index)*100)/100;

    var para = document.createElement("p");
    var node = document.createTextNode(region.label + " " + region.name + " " + nodalStrengthLeft + " / " + nodalStrengthRight);

    panel.node().appendChild(para).appendChild(node);
};

/* Edges stuff at edgeInfoPanel */
// add a slider to threshold edges at specific values
var addThresholdSlider = function () {

    var max = Math.max(modelLeft.getMaximumWeight(), modelRight.getMaximumWeight());
    var min = Math.min(modelLeft.getMinimumWeight(), modelRight.getMinimumWeight());
    max = Math.max(Math.abs(max), Math.abs(min));
    thresholdMultiplier = (max < 1.0) ? 100.0 : 1.0;
    max *= thresholdMultiplier;
    var menu = d3.select("#edgeInfoPanel");
    menu.append("input")
        .attr("type", "range")
        .attr("value", max/2)
        .attr("id", "thresholdSlider")
        .attr("min", 0.)
        .attr("max", max)
        .attr("step", max/20)
        .on("change", function () {
            modelLeft.setThreshold(this.value/thresholdMultiplier);
            modelRight.setThreshold(this.value/thresholdMultiplier);
            redrawEdges();
            document.getElementById("thresholdSliderLabel").innerHTML = "Threshold @ " + this.value/thresholdMultiplier;
        });
    menu.append("label")
        .attr("for", "thresholdSlider")
        .attr("id", "thresholdSliderLabel")
        .text("Threshold @ " + max/2/thresholdMultiplier);
    modelLeft.setThreshold(max/2/thresholdMultiplier);
    modelRight.setThreshold(max/2/thresholdMultiplier);
};

// add opacity slider 0 to 1
var addOpacitySlider = function () {
    var menu = d3.select("#edgeInfoPanel");
    menu.append("label")
        .attr("for", "opacitySlider")
        .attr("id", "opacitySliderLabel")
        .text("Opacity @ " + 1.);
    menu.append("input")
        .attr("type", "range")
        .attr("value", 100)
        .attr("id", "opacitySlider")
        .attr("min", 0)
        .attr("max", 100)
        .attr("step",1)
        .on("change", function () {
            updateOpacity(Math.floor(this.value)/100);
            document.getElementById("opacitySliderLabel").innerHTML = "Opacity @ " + this.value/100.;
        });
};

var addEdgeBundlingCheck = function () {
    var menu = d3.select("#edgeInfoPanel");
    menu.append("br");
    menu.append("label")
        .attr("for", "enableEBCheck")
        .attr("id", "enableEBCheckLabel")
        .text("Bundle Edges");
    menu.append("input")
        .attr("type", "checkbox")
        .attr("checked", true)
        .attr("id", "enableEBCheck")
        .on("change", function () {
            enableEdgeBundling(this.checked);
        });
    menu.append("br");
};

// add laterality checkboxes
var addLateralityCheck = function () {
    var menu = d3.select("#edgeInfoPanel");
    menu.append("br");
    menu.append("label")
        .attr("for", "enableIpsiCheck")
        .attr("id", "enableIpsiCheckLabel")
        .text("Ipsilateral");
    menu.append("input")
        .attr("type", "checkbox")
        .attr("checked", false)
        .attr("id", "enableIpsiCheck")
        .on("change", function () {
            enableIpsilaterality(this.checked);
        });
    menu.append("br");
    menu.append("label")
        .attr("for", "enableContraCheck")
        .attr("id", "enableContraCheckLabel")
        .text("Contralateral");
    menu.append("input")
        .attr("type", "checkbox")
        .attr("checked", false)
        .attr("id", "enableContraCheck")
        .on("change", function () {
            enableContralaterality(this.checked);
        });
    //menu.append("br");
    //menu.append("label")
      //  .attr("for", "enableLateralityCheck")
        //.attr("id", "enableLateralityCheckLabel")
        //.text("laterality");
};

// remove threshold slider and its labels
var removeThresholdSlider = function () {
    var elem = document.getElementById('thresholdSlider');
    if(elem) {
        elem.parentNode.removeChild(elem);
    }
    elem = document.getElementById('thresholdSliderLabel');
    if(elem) {
        elem.parentNode.removeChild(elem);
    }
};

// add slider to filter the top N edges in terms of value
var addTopNSlider = function () {
    var menu = d3.select("#edgeInfoPanel");

    menu.append("input")
        .attr("type", "range")
        .attr("value", modelLeft.getNumberOfEdges())
        .attr("id", "topNThresholdSlider")
        .attr("min","0")
        .attr("max", "20")
        .attr("step", "1")
        .on("change", function () {
            modelLeft.setNumberOfEdges(this.value);
            modelRight.setNumberOfEdges(this.value);
            redrawEdges();
            document.getElementById("topNThresholdSliderLabel").innerHTML = "Number of Edges: " + modelLeft.getNumberOfEdges();
        });
    menu.append("label")
        .attr("for", "topNThresholdSlider")
        .attr("id", "topNThresholdSliderLabel")
        .text("Number of Edges: " + modelLeft.getNumberOfEdges());
};

// remove top N edges slider and its labels
var removeTopNSlider= function () {
    var elem = document.getElementById('topNThresholdSlider');
    if(elem) {
        elem.parentNode.removeChild(elem);
    }
    elem = document.getElementById('topNThresholdSliderLabel');
    if(elem) {
        elem.parentNode.removeChild(elem);
    }
};

// remove all DOM elements from the edgeInfoPanel
var removeElementsFromEdgePanel = function () {
    removeThresholdSlider();
    removeTopNSlider();
};

// add "Change Modality" button to toggle between:
// edge threshold and top N edges
var addModalityButton = function () {
    var menu = d3.select("#edgeInfoPanel");

    menu.append("button")
        .text("Threshold Mode")
        .attr("id", "changeModalityBtn")
        .on("click", function () {
            var input = $('#changeModalityBtn');
            var checked = input.data("checked");
            input.data("checked", !checked);
            changeModality(!checked);
            updateScenes();
        });

    menu.append("br");

    $('#changeModalityBtn').data("checked", true);
};

// change modality callback
var changeModality = function (modality) {
    setThresholdModality(modality);

    if(modality){
        //if it is thresholdModality
        removeTopNSlider();
        addThresholdSlider();

    } else{
        //top N modality
        removeThresholdSlider();
        addTopNSlider();
    }
};

/* Edges legend */
// create legend panel containing different groups
// the state of each group can be either: active, transparent or inactive
var createLegend = function(model) {
    var legendMenu = document.getElementById("legend");

    while(legendMenu.hasChildNodes()){
        legendMenu.removeChild(legendMenu.childNodes[0]);
    }

    legendMenu = d3.select("#legend");

    if(model.getActiveGroupName() != 4) {
        var activeGroup = model.getActiveGroup();
        if(typeof(activeGroup[0].name) == "number"){ // group is numerical
            activeGroup.sort(function(a, b){return a-b});
        } else { // group is string
            activeGroup.sort();
        }

        var l = activeGroup.length;
        document.getElementById("legend").style.height = 25*l+"px";

        for(var i=0; i < l; i++){
            var opacity;

            switch (modelLeft.getRegionState(activeGroup[i])){
                case 'active':
                    opacity = 1;
                    break;
                case 'transparent':
                    opacity = 0.5;
                    break;
                case 'inactive':
                    opacity = 0.1;
                    break;
            }

            var elementGroup = legendMenu.append("g")
                .attr("transform","translate(10,"+i*25+")")
                .attr("id",activeGroup[i])
                .style("cursor","pointer")
                .on("click", function(){
                    modelLeft.toggleRegion(this.id);
                    modelRight.toggleRegion(this.id);
                    if (modelLeft.getRegionState(this.id) == 'transparent')
                        updateNodesVisiblity();
                    else
                        updateScenes();
                });

            if(typeof(activeGroup[i]) != 'number' && activeGroup[i].indexOf("right") > -1){
                elementGroup.append("rect")
                    .attr("x",-5)
                    .attr("y",0)
                    .attr("width", 20)
                    .attr("height", 20)
                    .attr("fill", scaleColorGroup(model, activeGroup[i]))
                    .attr('opacity',opacity);
            } else {
                elementGroup.append("circle")
                    .attr("cx",5)
                    .attr("cy",10)
                    .attr("fill", scaleColorGroup(model, activeGroup[i]))
                    .attr('opacity', opacity)
                    .attr("r",8);
            }

            //choose color of the text
            var textColor;
            if(modelLeft.getRegionActivation(activeGroup[i])){
                textColor = "rgb(191,191,191)";
            } else{
                textColor = "rgb(0,0,0)";
                opacity = 1;
            }

            elementGroup.append("text")
                .text(activeGroup[i])
                .attr("font-family","'Open Sans',sans-serif")
                .attr("font-size","15px")
                .attr("x",20)
                .attr("y",10)
                .attr("text-anchor","left")
                .attr("dy",5)
                .attr('opacity', opacity)
                .attr("fill",textColor);
        }
    } else {
        var quantiles = metricQuantileScale.quantiles();
        var min = d3.min(metricValues, function (d){return d[0]});
        var max = d3.max(metricValues, function (d){return d[0]});

        console.log("custom group color");
        l = quantiles.length+1;
        document.getElementById("legend").style.height =30*l+"px";

        for(i = 0; i < quantiles.length + 1 ; i++){
            var elementGroup = legendMenu.append("g")
                .attr("transform","translate(10,"+i*25+")")
                .attr("id",i);

            var color;
            var leftRange;
            var rightRange;
            if( i == 0){
                color = metricQuantileScale(min + 1);

                leftRange = round(min,2);
                rightRange = round(quantiles[i],2);
            } else if(i == quantiles.length ){
                color = metricQuantileScale(max - 1);

                leftRange = round(quantiles[i - 1],2);
                rightRange = round(max,2);
            } else{

                leftRange = round(quantiles[i - 1 ],2);
                rightRange = round(quantiles[i],2);

                color = metricQuantileScale((leftRange + rightRange)/2);
            }

            elementGroup.append("rect")
                .attr("x",5)
                .attr("y",10)
                .attr("width", 20)
                .attr("height", 20)
                .attr("fill", color);

            elementGroup.append("text")
                .text(leftRange + " - " + rightRange )
                .attr("font-family","'Open Sans',sans-serif")
                .attr("font-size","20px")
                .attr("x",45)
                .attr("y",20)
                .attr("text-anchor","left")
                .attr("dy",10)
                .attr("fill","rgb(191,191,191)");
        }
    }
};


/* Color coding area at upload */
// add "Color Coding" radio button group containing: Anatomy, Embeddedness ...
var addColorGroupList = function() {

    var select = document.getElementById("colorCodingMenu");
    var names = atlas.getGroupsNames();

    for (var i = 0; i < names.length; ++i) {
        var el = document.createElement("option");
        el.textContent = names[i];
        el.value = names[i];
        el.selected = (i==0);
        select.appendChild(el);
    }

    var hierarchicalClusteringExist = false;
    if (modelLeft.hasClusteringData() && modelRight.hasClusteringData()) {
        var clusterNames = modelLeft.getClusteringTopologiesNames();

        for (var i = 0; i < clusterNames.length; ++i) {
            var name = clusterNames[i];
            var isHierarchical = name == "PLACE" || name == "PACE";
            hierarchicalClusteringExist |= isHierarchical;

            var el = document.createElement("option");
            el.textContent = name;
            el.value = name;
            select.appendChild(el);
        }

        select.onchange = function () {
            var selection = this.options[this.selectedIndex].value;
            switch (selection) {
                case ("PLACE"):
                case ("PACE"):
                    setColorClusteringSliderVisibility("visible");
                    break;
                default:
                    setColorClusteringSliderVisibility("hidden");
                    break;
            }
            changeColorGroup(selection);
        };

        if (hierarchicalClusteringExist)
            addColorClusteringSlider();
    }

    setColorClusteringSliderVisibility("hidden");
};

var addColorClusteringSlider = function () {
    var menu = d3.select("#colorCoding");
    menu.append("br");
    menu.append("label")
        .attr("for", "colorClusteringSlider")
        .attr("id", "colorClusteringSliderLabel")
        .text("Level 4");
    menu.append("input")
        .attr("type", "range")
        .attr("value", 4)
        .attr("id", "colorClusteringSlider")
        .attr("min", 1)
        .attr("max", 4)
        .attr("step", 1)
        .on("change", function () {
            document.getElementById("colorClusteringSliderLabel").innerHTML = "Level " + this.value;
            modelLeft.updateClusteringGroupLevel(this.value);
            modelRight.updateClusteringGroupLevel(this.value);
            changeColorGroup(modelLeft.getActiveGroupName());
        });
};

var setColorClusteringSliderVisibility = function (value) {
    var elem = document.getElementById('colorClusteringSlider');
    if (elem)
        elem.style.visibility = value;
    elem = document.getElementById('colorClusteringSliderLabel');
    if (elem)
        elem.style.visibility = value;
};

/* Topology options at viewLeft and viewRight */
// add "Topological Spaces" menu for scene containing:
// Isomap, MDS, tSNE and anatomy spaces
var addTopologyMenu = function (model, side) {

    var topologies = model.getTopologies();
    var hierarchicalClusteringExist = false;

    var select = document.getElementById("topologyMenu" + side);

    for (var i = 0; i <topologies.length; i++) {
        var topology = topologies[i];

        var el = document.createElement("option");
        el.textContent = topology;
        el.value = topology;
        el.selected = (i == 0);
        select.appendChild(el);
    }
    select.onchange = function () {
        var selection = this.options[this.selectedIndex].value;
        switch (selection) {
            case ("PLACE"):
            case ("PACE"):
                setClusteringSliderVisibility(side, "visible");
                changeActiveGeometry(model, side, this.value);
                hierarchicalClusteringExist = true;
                break;
            default:
                setClusteringSliderVisibility(side, "hidden");
                changeActiveGeometry(model, side, selection);
                break;
        }
    };

    if (hierarchicalClusteringExist)
        addClusteringSlider(model, side);

    setClusteringSliderVisibility(side, "hidden");
};

// remove geometry buttons
var removeGeometryButtons = function (side) {
    document.getElementById("topologyMenu" + side).innerHTML = "";
};

// add clustering level slider
var addClusteringSlider = function (model, side) {
    var menu = d3.select("#topology" + side);

    menu.append("br");
    menu.append("label")
        .attr("for", "clusteringSlider" + side)
        .attr("id", "clusteringSliderLabel" + side)
        .text("Level " + model.getClusteringLevel());
    menu.append("input")
        .attr("type", "range")
        .attr("value", model.getClusteringLevel())
        .attr("id", "clusteringSlider" + side)
        .attr("min", 1)
        .attr("max", 4)
        .attr("step", 1)
        .on("change", function () {
            model.setClusteringLevel(parseInt(this.value));
            redrawScene(side);
            document.getElementById("clusteringSliderLabel" + side).innerHTML = "Level " + this.value;
        });
};

// control clustering level slider visibility
var setClusteringSliderVisibility = function (side, value) {
    var elem = document.getElementById('clusteringSlider' + side);
    if (elem)
        elem.style.visibility = value;
    elem = document.getElementById('clusteringSliderLabel' + side);
    if (elem)
        elem.style.visibility = value;
};


/*Shortest path stuff at shortestPathLeft and shortestPathRight */
// add filter to shortest path by percentage
var addDistanceSlider = function () {
    var menu = d3.select("#shortestPath");
    menu.append("br");

    menu.append("input")
        .attr("type", "range")
        .attr("value", 0)
        .attr("id", "distanceThresholdSlider")
        .attr("min", 0)
        .attr("max", 100)
        .attr("step", 1)
        .on("change", function () {
            console.log("on Change distance threshold value:" + this.value);
            modelLeft.setDistanceThreshold(this.value);
            modelRight.setDistanceThreshold(this.value);
            updateScenes();
            document.getElementById("distanceThresholdSliderLabel").innerHTML = "Max Distance @ " + this.value + "%";
        });
    menu.append("label")
        .attr("for", "distanceThresholdSlider")
        .attr("id", "distanceThresholdSliderLabel")
        .text("Max Distance @ 0%");
    menu.append("br");

    modelLeft.setDistanceThreshold(0);
    modelRight.setDistanceThreshold(0);
};

// remove shortest path percentage filter
var enableDistanceSlider = function (status) {
    var elem = document.getElementById('distanceThresholdSlider');
    if(elem)
        elem.disabled = !status;
};

// add a slider that filters shortest paths by the number of hops
var addShortestPathHopsSlider = function () {
    var menu =  d3.select('#shortestPath');
    menu.append("br");

    menu.append("input")
        .attr("type", "range")
        .attr("value", modelLeft.getNumberOfHops())
        .attr("id", "numberOfHopsSlider")
        .attr("min", 0)
        .attr("max", Math.max(modelLeft.getMaxNumberOfHops(), modelRight.getMaxNumberOfHops()))
        .attr("step", 1)
        .on("change", function () {
            var n = parseInt(this.value);
            modelLeft.setNumberOfHops(n);
            modelRight.setNumberOfHops(n);
            updateScenes();
            document.getElementById("numberOfHopsSliderLabel").innerHTML = "Number of Hops: " + n;
        });
    menu.append("label")
        .attr("for", "numberOfHopsSlider")
        .attr("id", "numberOfHopsSliderLabel")
        .text("Number of Hops: " + modelLeft.getNumberOfHops());
};

// remove the shortest path number of hops filter
var enableShortestPathHopsSlider = function (status) {
    var elem = document.getElementById('numberOfHopsSlider');
    if(elem)
        elem.disabled = !status;
};

var addShortestPathFilterButton = function () {
    var menu = d3.select("#shortestPath");
        menu.append('button')
            .attr("id", "sptFilterBtn")
            .text("Number of Hops")
            .on('click', function () {
                switch (shortestPathVisMethod) {
                    case (SHORTEST_DISTANCE):
                        shortestPathVisMethod = NUMBER_HOPS;
                        enableDistanceSlider(false);
                        enableShortestPathHopsSlider(true);
                        d3.select('#numberOfHopsSlider').attr("max", Math.max(modelLeft.getMaxNumberOfHops(), modelRight.getMaxNumberOfHops()));
                        document.getElementById("sptFilterBtn").innerHTML = "Distance";
                        break;
                    case (NUMBER_HOPS):
                        shortestPathVisMethod = SHORTEST_DISTANCE;
                        enableShortestPathHopsSlider(false);
                        enableDistanceSlider(true);
                        document.getElementById("sptFilterBtn").innerHTML = "Number of Hops";
                        break;
                }
                if (getSpt())
                    updateScenes();
            });
};

var enableShortestPathFilterButton = function (status) {
    var elem = document.getElementById('sptFilterBtn');
    if(elem)
        elem.disabled = !status;

    // affecting the sliders
    enableDistanceSlider(status && shortestPathVisMethod == SHORTEST_DISTANCE);
    enableShortestPathHopsSlider(status && shortestPathVisMethod == NUMBER_HOPS);
};

var enableThresholdControls = function (status) {
    var elem = document.getElementById('changeModalityBtn');
    if(elem)
        elem.disabled = !status;
    elem = document.getElementById('thresholdSlider');
    if(elem)
        elem.disabled = !status;
    elem = document.getElementById('topNThresholdSlider');
    if(elem)
        elem.disabled = !status;
};

// todo: this hides the Enter VR buttons I guess but not sure what its for or if required in webXR
// var hideVRMaximizeButtons = function () {
//     document.getElementById("magicWindowLeft").style.visibility = "hidden";
//     document.getElementById("magicWindowRight").style.visibility = "hidden";
// };


// add labels check boxes, appear/disappear on right click
var addFslRadioButton = function() {
    var rightMenu = d3.select("#rightFslLabels");
    var leftMenu = d3.select("#leftFslLabels");

    rightMenu.append("text")
        .text("Right Hemisphere:");

    rightMenu.append("br");

    leftMenu.append("text")
        .text("Left Hemisphere:");

    leftMenu.append('br');

    labelVisibility.forEach( function(labelInfo, index) {
        var menu = (labelInfo['hemisphere'] == 'right') ? rightMenu : leftMenu;
        menu.append("input")
            .attr("type", "checkbox")
            .attr("name", "fslLabel")
            .attr("id", index)
            .attr("value", index)
            .attr("checked", "true")
            .on("change", function () {
                lut.setLabelVisibility(index, this.checked);
                //modelLeft.setLabelVisibility(index, this.checked);
                //modelRight.setLabelVisibility(index, this.checked);
                updateScenes();
            });

        menu.append("label")
            .attr("for", "geometry")
            .text(" " + labelInfo['name']);

        menu.append("br");
    });
};

// add search nodes by index panel, appear/disappear on right click
var addSearchPanel = function(){
    var menu = d3.select("#search");

    menu.append("text")
        .text("Search Panel");

    menu.append("br");

    menu.append("input")
        .attr("type", "text")
        .attr("id", "nodeSearch")
        .attr("name","nodeid");

    menu.append("button")
        .text("Search")
        .on("click",function(){
            var text = document.getElementById("nodeSearch");
            searchElement(text.value);
        });
};

// search by index callback
var searchElement = function(index) {
    index = parseInt(index);
    console.log(index);
    if(typeof(index) != 'number' || isNaN(index)){
        alert("The value inserted is not a number");
    }

    if(index < 0 || index > glyphs.length){
        alert("Node not found");
    }

    drawSelectedNode(index, glyphs[index]);
};

// toggle labels check boxes on right click
var toggleMenus = function (e) {
    $('#shortestPath').toggle();
    $('#viewLeft').toggle();
    $('#viewRight').toggle();
    $('#legend').toggle();
    $('#nodeInfoPanel').toggle();
    $('#colorCoding').toggle();
    $('#edgeInfoPanel').toggle();
    $('#search').toggle();
    $("#rightFslLabels").toggle();
    $('#leftFslLabels').toggle();
    $('#vrLeft').toggle();
    $('#vrRight').toggle();
};

var getShortestPathVisMethod = function () { return shortestPathVisMethod }

export {toggleMenus,initSubjectMenu,removeGeometryButtons,addOpacitySlider,addModalityButton,addThresholdSlider,addLateralityCheck,addColorGroupList,addTopologyMenu,addShortestPathFilterButton,addDistanceSlider,addShortestPathHopsSlider,enableShortestPathFilterButton,addDimensionFactorSliderLeft, addDimensionFactorSliderRight, getShortestPathVisMethod, SHORTEST_DISTANCE, NUMBER_HOPS, setNodeInfoPanel, enableThresholdControls,createLegend} //hideVRMaximizeButtons
