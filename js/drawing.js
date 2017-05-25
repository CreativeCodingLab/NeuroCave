/**
 * Created by Johnson on 2/15/2017.
 */

var previewAreaLeft, previewAreaRight;

var glyphNodeDictionary ={};        /// Object that stores uuid of left and right glyphs

var activeVR = 'left';

var nodesSelected = [];
var visibleNodes =[];               // boolean array storing nodes visibility

var pointedNodeIdx = -1;            // index of node under the mouse
var pointedObject;                  // node object under mouse
var root;                           // the index of the root node = start point of shortest path computation

var thresholdModality = true;
var enableEB = true;

var vr = false;                     // enable VR
var spt = false;                    // enabling shortest path
var click = false;
var hoverTimeout = false;
var oldNodeIndex = -1;

// callback on mouse moving, expected action: node beneath pointer are drawn bigger
function onDocumentMouseMove(model, event) {
    // the following line would stop any other event handler from firing
    // (such as the mouse's TrackballControls)
    event.preventDefault();
    var intersectedObject = getIntersectedObject(event);
    // var isLeft = event.clientX < window.innerWidth/2;
    updateNodeMoveOver(model, intersectedObject);

}

updateNodeMoveOver = function (model, intersectedObject)
{
    var nodeIdx, region, nodeRegion;
    if ( intersectedObject ) {
        nodeIdx = glyphNodeDictionary[intersectedObject.object.uuid];
        region = model.getRegionByIndex(nodeIdx);
        nodeRegion = model.getGroupNameByNodeIndex(nodeIdx);
    }

    var nodeExistAndVisible = (intersectedObject && visibleNodes[nodeIdx] && model.isRegionActive(nodeRegion));
    // update node information label
    if ( nodeExistAndVisible ) {
        setNodeInfoPanel(region, nodeIdx);
        if (vr) {
            previewAreaLeft.updateNodeLabel(region.name, nodeIdx);
            previewAreaRight.updateNodeLabel(region.name, nodeIdx);
        }
    }

    if ( nodeExistAndVisible && (nodesSelected.indexOf(nodeIdx) == -1)) { // not selected
        if (hoverTimeout && oldNodeIndex == nodeIdx) {
            // create a selected node (bigger) from the pointed node
            pointedObject = intersectedObject.object;
            previewAreaLeft.updateNodeGeometry(nodeIdx, 'mouseover');
            previewAreaRight.updateNodeGeometry(nodeIdx, 'mouseover');
            // console.log("Drawing edges from node ", nodeIdx);
            pointedNodeIdx = nodeIdx;
            hoverTimeout = false;
        } else {
            setTimeout(function () {hoverTimeout = true;}, 500);
            oldNodeIndex = nodeIdx;

        }
    } else {
        if(pointedObject){
            nodeIdx = glyphNodeDictionary[pointedObject.uuid];
            if (nodeIdx === undefined)
                return;
            pointedNodeIdx = -1;
            if(nodeIdx == root) {
                console.log("Root creation");
                previewAreaLeft.updateNodeGeometry(nodeIdx, 'root');
                previewAreaRight.updateNodeGeometry(nodeIdx, 'root');
            }
            else {
                previewAreaLeft.updateNodeGeometry(nodeIdx, 'normal');
                previewAreaRight.updateNodeGeometry(nodeIdx, 'normal');
            }
            pointedObject = null;
        }
    }
};

// callback to interact with objects in scene with double click
// selected nodes are drawn bigger
function onMiddleClick(event) {
    event.preventDefault();

    var intersectedObject = getIntersectedObject(event);
    if(intersectedObject) {
        var nodeIndex = glyphNodeDictionary[intersectedObject.object.uuid];
        if (nodeIndex == undefined || nodeIndex < 0)
            return;
        if (root == nodeIndex) { // disable spt and reset nodes visibility
            spt = false;
            root = undefined;
            visibleNodes.fill(true);
        } else { // enable spt
            spt = true;
            // compute the shortest path for the two models
            previewAreaLeft.computeShortestPathForNode(nodeIndex);
            previewAreaRight.computeShortestPathForNode(nodeIndex);
        }
        updateScenes();
        enableShortestPathFilterButton(spt);
        enableThresholdControls(!spt);
    }
}

// callback to select a node on mouse click
function onLeftClick(model, event) {

    event.preventDefault();
    var objectIntersected = getIntersectedObject(event);
    var isLeft = event.clientX < window.innerWidth/2;
    updateNodeSelection(model, objectIntersected, isLeft);
}

updateNodeSelection = function (model, objectIntersected, isLeft) {
    var nodeIndex;
    if ( objectIntersected ) {
        nodeIndex = glyphNodeDictionary[objectIntersected.object.uuid];
    }
    if (nodeIndex == undefined)
        return;

    if (objectIntersected && visibleNodes[nodeIndex]) {
        if(!spt) {
            var el = nodesSelected.indexOf(nodeIndex);
            if (el == -1) {
                //if the node is not already selected -> draw edges and add in the nodesSelected Array
                previewAreaLeft.drawSelectedNode(nodeIndex);
                previewAreaRight.drawSelectedNode(nodeIndex);

                // draw edges in one two ways:
                if (thresholdModality) {
                    // 1) all edges from a given node
                    previewAreaLeft.drawEdgesGivenNode(nodeIndex);
                    previewAreaRight.drawEdgesGivenNode(nodeIndex);
                } else {
                    // 2) strongest n edges from the node
                    var n = model.getNumberOfEdges();
                    previewAreaLeft.drawTopNEdgesByNode(nodeIndex, n);
                    previewAreaRight.drawTopNEdgesByNode(nodeIndex, n);
                }

                pointedObject = null;
            } else {
                //if the node is already selected, remove edges and remove from the nodeSelected Array
                if (pointedObject) {
                    previewAreaLeft.updateNodeGeometry(nodeIndex, 'normal');
                    previewAreaRight.updateNodeGeometry(nodeIndex, 'normal');
                }
                nodesSelected.splice(el, 1);
                removeEdgesGivenNodeFromScenes(nodeIndex);
            }
        } else {
            if (isLeft)
                previewAreaLeft.getShortestPathFromRootToNode(nodeIndex);
            else
                previewAreaRight.getShortestPathFromRootToNode(nodeIndex);
        }
    }
    pointedNodeIdx = -1;
};

// callback on mouse press
function onMouseDown(event) {
    click = true;
    switch (event.button) { // middle button
        case 2: // right click -> should be < 200 msec
            setTimeout(function () {click = false;}, 200);
            break;
    }
}

// callback on mouse release
function onMouseUp(model, event) {

    switch (event.button) {
        case 0:
            onLeftClick(model, event);
            break;
        case 1:
            onMiddleClick(event);
            break;
        case 2:
            if (click)
                toggleMenus();
            break;
    }
    click = false;
}

function onKeyPress(event) {
    if (event.key === 'v' || event.keyCode === 118) {
        if (!previewAreaLeft.isVRAvailable()) {
            alert("No VR Hardware found!!!");
            return;
        }
        updateVRStatus('enable');
    }
    if (vr && (event.key === 's' || event.keyCode === 115)) {
        updateVRStatus('left');
    }
    if (vr && (event.key === 'd' || event.keyCode === 100)) {
        updateVRStatus('right')
    }
    if (event.key === 'e' || event.keyCode === 101) {
        updateVRStatus('disable');
    }
}

// update VR status for desktop
updateVRStatus = function (status) {
    switch (status)
    {
        case 'enable':
            activeVR = 'none';
            vr = true;
            break;
        case 'left':
            activeVR = 'left';
            previewAreaLeft.activateVR(false);
            previewAreaRight.activateVR(false);
            setTimeout(function () { previewAreaLeft.activateVR(true); }, 500);
            break;
        case 'right':
            activeVR = 'right';
            previewAreaLeft.activateVR(false);
            previewAreaRight.activateVR(false);
            setTimeout(function () { previewAreaRight.activateVR(true); }, 500);
            break;
        case 'disable':
            activeVR = 'none';
            previewAreaLeft.activateVR(false);
            previewAreaRight.activateVR(false);
            vr = false;
            previewAreaLeft.resetCamera();
            previewAreaRight.resetCamera();
            previewAreaLeft.resetBrainPosition();
            previewAreaRight.resetBrainPosition();
            break;
    }
};

// init the canvas where we render the brain
initCanvas = function () {
    // add controls
    addOpacitySlider();
    addEdgeBundlingCheck();
    addModalityButton();
    addThresholdSlider();
    addColorGroupList();
    addTopologyRadioButtons(modelLeft, 'Left');
    addTopologyRadioButtons(modelRight, 'Right');

    addShortestPathFilterButton();
    addDistanceSlider();
    addShortestPathHopsSlider();
    enableShortestPathFilterButton(false);

    // addSkyboxButton();
    addDimensionFactorSlider();
    // addFslRadioButton();
    // addSearchPanel();

    modelLeft.setAllRegionsActivated();
    modelRight.setAllRegionsActivated();

    createLegend(modelLeft);
    // create visualization
    previewAreaLeft = new PreviewArea(document.getElementById('canvasLeft'), modelLeft, 'Left');
    previewAreaRight = new PreviewArea(document.getElementById('canvasRight'), modelRight, 'Right');

    // Get the button, and when the user clicks on it, execute myFunction
    document.getElementById("syncLeft").onclick = function() {
        previewAreaLeft.syncCameraWith(previewAreaRight.getCamera());
    };
    document.getElementById("syncRight").onclick = function() {
        previewAreaRight.syncCameraWith(previewAreaLeft.getCamera());
    };

    glyphNodeDictionary = {};
    // create left and right canvas
    previewAreaLeft.createCanvas();
    previewAreaLeft.setEventListeners(onMouseDown, onMouseUp, onDocumentMouseMove);
    previewAreaRight.createCanvas();
    previewAreaRight.setEventListeners(onMouseDown, onMouseUp, onDocumentMouseMove);
    // prepare Occulus rift
    previewAreaLeft.initOculusRift();
    previewAreaRight.initOculusRift();
    window.addEventListener("keypress", onKeyPress, true);

    visibleNodes = new Array(modelLeft.getConnectionMatrixDimension()).fill(true);
    // draw connectomes and start animation
    previewAreaLeft.drawRegions();
    previewAreaRight.drawRegions();
    $(window).resize(function(e){
        //e.preventDefault();
        console.log("on resize event");
        previewAreaLeft.resizeScene();
        previewAreaRight.resizeScene();
    });

    window.addEventListener('vrdisplaypresentchange', function(e){
            //e.preventDefault();
            console.log("on resize event");
            previewAreaLeft.resizeScene();
            previewAreaRight.resizeScene();}
        , true);

    if (mobile) {
        console.log("Mobile VR requested");
    } else {
        hideVRMaximizeButtons();
    }

    animate();
};

// set the threshold for both models
setThreshold = function(value) {
    modelLeft.setThreshold(value);
    modelRight.setThreshold(value);
};

// enable edge bundling
enableEdgeBundling = function (enable) {
    if (enableEB == enable)
        return;

    enableEB = enable;

    modelLeft.computeEdgesForTopology(modelLeft.getActiveTopology());
    modelRight.computeEdgesForTopology(modelRight.getActiveTopology());

    previewAreaLeft.removeEdgesFromScene();
    previewAreaRight.removeEdgesFromScene();

    previewAreaLeft.drawConnections();
    previewAreaRight.drawConnections();
};

// updating scenes: redrawing glyphs and displayed edges
updateScenes = function () {
    console.log("Scene update");
    previewAreaLeft.updateScene();
    previewAreaRight.updateScene();
    createLegend(modelLeft);
};

updateNodesVisiblity = function () {
    previewAreaLeft.updateNodesVisibility();
    previewAreaRight.updateNodesVisibility();
    createLegend(modelLeft);
};

redrawEdges = function () {
    previewAreaLeft.redrawEdges();
    previewAreaRight.redrawEdges();
};

// animate scenes and capture control inputs
animate = function () {
    if (!vr) {
        previewAreaLeft.animate();
        previewAreaRight.animate();
        requestAnimationFrame(animate);
    } else { // VR
        if (activeVR == 'left') {
            previewAreaLeft.animate();
            previewAreaLeft.requestAnimate(animate);
        } else if (activeVR == 'right') {
            previewAreaRight.animate();
            previewAreaRight.requestAnimate(animate);
        } else { // need to be recalled continuously in case user reactivate VR
            requestAnimationFrame(animate);
        }
    }
};

updateOpacity = function (opacity) {
    previewAreaLeft.updateEdgeOpacity(opacity);
    previewAreaRight.updateEdgeOpacity(opacity);
};

removeEdgesGivenNodeFromScenes = function(nodeIndex) {
    previewAreaLeft.removeEdgesGivenNode(nodeIndex);
    previewAreaRight.removeEdgesGivenNode(nodeIndex);

    // setEdgesColor();
    // setEdgesColor();
};

// get intersected object beneath the mouse pointer
// detects which scene: left or right
// return undefined if no object was found
getIntersectedObject = function(event) {

    var isLeft = event.clientX < window.innerWidth/2;

    // mapping coordinates of the viewport to (-1,1), (1,1), (-1,-1), (1,-1)
    // TODO: there is a glitch for the right side
    var vector = new THREE.Vector2(
        ( event.clientX / window.innerWidth ) * 4 - (isLeft?1:3),
        - ( event.clientY / window.innerHeight ) * 2 + 1
    );
    return isLeft ? previewAreaLeft.getIntersectedObject(vector) : previewAreaRight.getIntersectedObject(vector);
};

changeColorGroup = function (name) {
    modelLeft.setActiveGroup(name);
    modelRight.setActiveGroup(name);

    modelLeft.setAllRegionsActivated();
    modelRight.setAllRegionsActivated();
    setColorGroupScale();

    previewAreaLeft.updateNodesVisibility();
    previewAreaRight.updateNodesVisibility();
    previewAreaLeft.updateNodesColor();
    previewAreaRight.updateNodesColor();
    redrawEdges();
    createLegend(modelLeft);
};

redrawScene = function (side) {
    updateNeeded = true;
    switch(side) {
        case 'Left':
        case 'left':
            previewAreaLeft.updateScene();
            break;
        case 'Right':
        case 'right':
            previewAreaRight.updateScene();
            break;
    }
};

// change the active geometry
changeActiveGeometry = function (model, side, type) {
    console.log("Change Active Geometry to: ", type);
    model.setActiveTopology(type);
    redrawScene(side);
};

// draw shortest path for the left and right scenes = prepare the edges and plot them
updateShortestPathEdges = function (side) {
    if (!spt)
        return;
    switch (side) {
        case ('left'):
            previewAreaLeft.updateShortestPathEdges();
            break;
        case ('right'):
            previewAreaRight.updateShortestPathEdges();
            break;
        case ('both'):
            previewAreaLeft.updateShortestPathEdges();
            previewAreaRight.updateShortestPathEdges();
            break;
    }
};

// change the subject in a specific scene
changeSceneToSubject = function (subjectId, model, previewArea, side) {
    var fileNames = dataFiles[subjectId];
    removeGeometryButtons(side);
    var info = model.getCurrentRegionsInformation();
    model.clearModel();

    queue()
        .defer(loadSubjectNetwork, fileNames, model)
        .awaitAll(function () {
            queue()
            // PLACE depends on connection matrix
                .defer(loadSubjectTopology, fileNames, model)
                .awaitAll( function () {
                    console.log("Loading data done.");
                    var activeGroup = model.getActiveGroupName();
                    var level1 = model.getClusteringLevel();
                    var level2 = model.getClusteringGroupLevel();
                    model.createGroups();
                    addTopologyRadioButtons(model, side);
                    model.setActiveGroup(activeGroup);
                    model.setClusteringLevel(level1);
                    model.updateClusteringGroupLevel(level2);
                    model.setAllRegionsActivated();
                    model.setCurrentRegionsInformation(info);
                    redrawScene(side);
                })
            ;
        });
};