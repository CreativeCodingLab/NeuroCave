/**
 * Created by giorgioconte on 31/01/15.
 */
// this file contains functions that create\delete GUI controlling elements

var SHORTEST_DISTANCE = 0, NUMBER_HOPS = 1; //enums
var shortestPathVisMethod = SHORTEST_DISTANCE;
var thresholdMultiplier = 1.0; // 100.0 for fMRI data of values (-1.0->1.0) and 1.0 if values > 1.0

// initialize subject selection drop down menus
initSubjectMenu = function (side) {

    var select = document.getElementById("subjectMenu" + side);
    for (var i = 0; i < dataFiles.length; ++i) {
        var el = document.createElement("option");
        el.textContent = dataFiles[i].subjectID;
        el.value = dataFiles[i].subjectID;
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
// adds a slider to control glyphs size
addDimensionFactorSlider = function () {
    var panel = d3.select("#nodeInfoPanel");

    panel.append("input")
        .attr("type", "range")
        .attr("value", "1")
        .attr("id", "dimensionSlider")
        .attr("min","0.2")
        .attr("max", "4")
        .attr("step","0.1")
        .on("change", function () {
            setDimensionFactor(this.value);
        });

    panel.append("label")
        .attr("for", "dimensionSlider")
        .attr("id", "dimensionSliderLabel")
        .text("Glyph Size");

    panel.append("br");
};

// adds a button to toggle skybox visibility
addSkyboxButton = function () {

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
setNodeInfoPanel = function (region, index) {

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
addThresholdSlider = function () {

    var max = Math.max(modelLeft.getMaximumWeight(), modelRight.getMaximumWeight());
    var min = Math.min(modelLeft.getMinimumWeight(), modelRight.getMinimumWeight());
    max = Math.max(Math.abs(max), Math.abs(min));
    thresholdMultiplier = (max < 1.0) ? 100.0 : 1.0;
    max *= thresholdMultiplier;
    var menu = d3.select("#edgeInfoPanel");
    menu.append("label")
        .attr("for", "thresholdSlider")
        .attr("id", "thresholdSliderLabel")
        .text("Threshold @ " + max/2/thresholdMultiplier);
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

    modelLeft.setThreshold(max/2/thresholdMultiplier);
    modelRight.setThreshold(max/2/thresholdMultiplier);
};

// add opacity slider 0 to 1
addOpacitySlider = function () {
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

addEdgeBundlingCheck = function () {
    var menu = d3.select("#edgeInfoPanel");
    menu.append("label")
        .attr("for", "enableEBCheck")
        .attr("id", "enableEBCheckLabel")
        .text("Enable EB:");
    menu.append("input")
        .attr("type", "checkbox")
        .attr("checked", true)
        .attr("id", "enableEBCheck")
        .on("change", function () {
            enableEdgeBundling(this.checked);
        });
    menu.append("br");
};

// remove threshold slider and its labels
removeThresholdSlider = function () {
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
addTopNSlider = function () {
    var menu = d3.select("#edgeInfoPanel");

    menu.append("label")
        .attr("for", "topNThresholdSlider")
        .attr("id", "topNThresholdSliderLabel")
        .text("Number of Edges: " + modelLeft.getNumberOfEdges());

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
};

// remove top N edges slider and its labels
removeTopNSlider= function () {
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
removeElementsFromEdgePanel = function () {
    removeThresholdSlider();
    removeTopNSlider();
};

// add "Change Modality" button to toggle between:
// edge threshold and top N edges
addModalityButton = function () {
    var menu = d3.select("#edgeInfoPanel");

    menu.append("button")
        .text("Change Modality")
        .attr("id", "changeModalityBtn")
        .on("click", function () {
            var input = d3.select("input#changeModalityInput").node();
            input.checked = !input.checked;
            changeModality(input.checked);
            updateScenes();
        })
        .append("input")
        .attr("type","checkbox")
        .attr("id","changeModalityInput")
        .attr("checked", true);
    menu.append("br");
};

// change modality callback
changeModality = function (modality) {
    thresholdModality = modality;

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
createLegend = function(model) {
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
addColorGroupList = function() {
    var menu = d3.select("#colorCoding");

    menu.append("label")
        .attr("for","colorGroup")
        .text("Color coding:");
    menu.append("br");

    var names = atlas.getGroupsNames();
    for (var i = 0; i < names.length; ++i) {
        menu.append("input")
            .attr("type", "radio")
            .attr("name","colorGroup")
            .attr("id",names[i]+"_ColorGroup")
            .attr("value",names[i])
            .attr("checked","false")
            .on("change", function () {
                setColorClusteringSliderVisibility("hidden");
                changeColorGroup(this.value);
            });
        menu.append("label")
            .attr("for",names[i])
            .text(names[i]);
        menu.append("br");
    }

    if (modelLeft.hasClusteringData() && modelRight.hasClusteringData()) {
        var clusterNames = modelLeft.getClusteringTopologiesNames();
        var hierarchicalClusteringExist = false;
        for (var i = 0; i < clusterNames.length; ++i) {
            var name = clusterNames[i];
            var isHierarchical = name == "PLACE" || name == "PACE";
            hierarchicalClusteringExist |= isHierarchical;
            menu.append("input")
                .attr("type", "radio")
                .attr("name", "colorGroup")
                .attr("value", name)
                .attr("id", name+"_ColorGroup")
                .attr("checked", "false")
                .on("change", function () {
                    setColorClusteringSliderVisibility(this.getAttribute("hierarchical") == 'true' ? "visible" : "hidden");
                    changeColorGroup(this.value);
                });
            menu.append("label")
                .attr("for", name)
                .text(name);
            menu.append("br");
            document.getElementById(name+"_ColorGroup").setAttribute("hierarchical", isHierarchical);
        }

        if (hierarchicalClusteringExist)
            addColorClusteringSlider();
    }

    setColorClusteringSliderVisibility("hidden");
    document.getElementById(names[0]+"_ColorGroup").checked = "true";
};

addColorClusteringSlider = function () {
    var menu = d3.select("#upload");
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

setColorClusteringSliderVisibility = function (value) {
    var elem = document.getElementById('colorClusteringSlider');
    if (elem)
        elem.style.visibility = value;
    elem = document.getElementById('colorClusteringSliderLabel');
    if (elem)
        elem.style.visibility = value;
};

/* Topology options at topologyLeft and topologyRight */
// add "Topological Spaces" radio button group for scene containing:
// Isomap, MDS, tSNE and anatomy spaces
addTopologyRadioButtons = function (model, side) {

    var topologies = model.getTopologies();
    var hierarchicalClusteringExist = false;

    var menu = d3.select("#topology" + side);

    menu.append("br");

    menu.append("label")
        .attr("for","geometry" + side)
        .text("Topological Space:");
    menu.append("br");

    for (var i = 0; i <topologies.length; i++) {
        var topology = topologies[i];
        var ip = menu.append("input")
            .attr("type", "radio")
            .attr("name","geometry" + side)
            .attr("id",topology + side)
            .attr("value",topology)
            .attr("checked", "false");
        switch (topology) {
            case ("PLACE"):
            case ("PACE"):
                ip.on("change", function () {
                    setClusteringSliderVisibility(side, "visible");
                    changeActiveGeometry(model, side, this.value);
                });
                hierarchicalClusteringExist = true;
                break;
            default:
                ip.on("change", function () {
                    setClusteringSliderVisibility(side, "hidden");
                    changeActiveGeometry(model, side, this.value);
                });
                break;
        }
        menu.append("label")
            .attr("for",topology)
            .text(topology);
        menu.append("br");
    }

    if (hierarchicalClusteringExist)
        addClusteringSlider(model, side);

    setClusteringSliderVisibility(side, "hidden");
    document.getElementById(topologies[0] + side).checked = "true";
};

// remove geometry buttons
removeGeometryButtons = function (side) {
    var menu = document.getElementById("topology" + side);
    while (menu.firstChild) {
        menu.removeChild(menu.firstChild);
    }
};

// add clustering level slider
addClusteringSlider = function (model, side) {
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
setClusteringSliderVisibility = function (side, value) {
    var elem = document.getElementById('clusteringSlider' + side);
    if (elem)
        elem.style.visibility = value;
    elem = document.getElementById('clusteringSliderLabel' + side);
    if (elem)
        elem.style.visibility = value;
};


/*Shortest path stuff at shortestPathLeft and shortestPathRight */
// add filter to shortest path by percentage
addDistanceSlider = function () {
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
enableDistanceSlider = function (status) {
    var elem = document.getElementById('distanceThresholdSlider');
    if(elem)
        elem.disabled = !status;
};

// add a slider that filters shortest paths by the number of hops
addShortestPathHopsSlider = function () {
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
enableShortestPathHopsSlider = function (status) {
    var elem = document.getElementById('numberOfHopsSlider');
    if(elem)
        elem.disabled = !status;
};

addShortestPathFilterButton = function () {
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
                if (spt)
                    updateScenes();
            });
};

enableShortestPathFilterButton = function (status) {
    var elem = document.getElementById('sptFilterBtn');
    if(elem)
        elem.disabled = !status;

    // affecting the sliders
    enableDistanceSlider(status && shortestPathVisMethod == SHORTEST_DISTANCE);
    enableShortestPathHopsSlider(status && shortestPathVisMethod == NUMBER_HOPS);
};

hideVRMaximizeButtons = function () {
    document.getElementById("magicWindowLeft").style.visibility = "hidden";
    document.getElementById("magicWindowRight").style.visibility = "hidden";
};


// add labels check boxes, appear/disappear on right click
addFslRadioButton = function() {
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
addSearchPanel = function(){
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
searchElement = function(index) {
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
toggleMenus = function (e) {
    $('#shortestPath').toggle();
    $('#topologyLeft').toggle();
    $('#topologyRight').toggle();
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