/**
 * Created by Johnson on 2/15/2017.
 */

/**
 * This class controls the preview 3D area. It controls the creation of glyphs (nodes), edges, shortest path edges. It
 * also executes the update requests to those objects. It init the VR environment when requested.
 * @param canvas_ a WebGl canvas
 * @param model_ a Model object
 * @constructor
 */

function PreviewArea(canvas_, model_, name_) {
    var name = name_;
    var model = model_;
    var canvas = canvas_;
    var camera = null, renderer = null, controls = null, scene = null, raycaster = null;
    var nodeLabelSprite = null, nodeNameMap = null, nspCanvas = null;

    // VR stuff
    var vrControl = null, effect = null;
    var controllerLeft = null, controllerRight = null, oculusTouchExist = false, gearVRControllerExist = false, enableRender = true;
    var pointerLeft = null, pointerRight = null;      // left and right controller pointers for pointing at things

    var enableVR = false;
    var activateVR = false;
    // nodes and edges
    var brain = null; // three js group housing all glyphs and edges
    var glyphs = [];
    var displayedEdges = [];
    // shortest path
    var shortestPathEdges = [];

    var edgeOpacity = 1.0;

    var vrButton = null;

    // request VR activation - desktop case
    this.activateVR = function (activate) {
        if (activate == activateVR)
            return;
        activateVR = activate;
        if (!mobile) {
            if (activateVR) {
                console.log("Activate VR for PV: " + name);
                effect.requestPresent();
            }
            else
                console.log("Disable VR for PV: " + name);
                effect.exitPresent();
        }
    };

    // init Oculus Rift
    this.initVR = function () {
        vrControl = new THREE.VRControls(camera, function (message) {
            console.log("VRControls: ", message);
        });
        effect = new THREE.VREffect(renderer, function (message) {
            console.log("VREffect ", message);
        });
        effect.setSize(window.innerWidth/2., window.innerHeight);

        if (navigator.getVRDisplays) {
            navigator.getVRDisplays()
                .then(function (displays) {
                    if (displays.length > 0) {
                        console.log("VR Display found");
                        effect.setVRDisplay(displays[0]);
                        vrControl.setVRDisplay(displays[0]);
                    }
                });
            enableVR = true;
        } else {
            console.log("No VR Hardware found!");
            enableVR = false;
        }

        if (mobile) {
            initWebVRForMobile();
            initGearVRController();
        }
        else
            initOculusTouch();
    };

    // init Oculus Touch controllers
    // not supported in Firefox, only Google chromium
    // check https://webvr.info/get-chrome/
    var initOculusTouch = function () {
        if (!enableVR)
            return;

        controllerLeft = new THREE.ViveController( 0 );
        controllerRight = new THREE.ViveController( 1 );

        var loader = new THREE.OBJLoader();
        loader.setPath( 'js/external-libraries/vr/models/obj/vive-controller/' );
        loader.load( 'vr_controller_vive_1_5.obj', function ( object ) {

            var loader = new THREE.TextureLoader();
            loader.setPath( 'js/external-libraries/vr/models/obj/vive-controller/' );

            var controller = object.children[ 0 ];
            controller.material.map = loader.load( 'onepointfive_texture.png' );
            controller.material.specularMap = loader.load( 'onepointfive_spec.png' );

            controllerLeft.add( object.clone() );
            controllerRight.add( object.clone() );

            controllerLeft.standingMatrix = vrControl.getStandingMatrix();
            controllerRight.standingMatrix = vrControl.getStandingMatrix();

            scene.add(controllerLeft);
            scene.add(controllerRight);
        } );

        // controllerLeft.addEventListener('gripsup', function(e) { updateVRStatus('left'); }, true);
        // controllerRight.addEventListener('gripsup', function(e) { updateVRStatus('right'); }, true);

        oculusTouchExist = true;

        console.log("Init Oculus Touch done");
    };

    var initGearVRController = function () {
        if (!enableVR || !mobile)
            return;

        // assume right handed user
        controllerRight = new THREE.GearVRController(1);

        gearVRControllerExist = true;

        console.log("Init Gear VR Controller done");
    };

    var initWebVRForMobile = function () {
        // Initialize the WebVR UI.
        var uiOptions = {
            color: 'black',
            background: 'white',
            corners: 'round',
            height: 40,
            disabledOpacity: 0.9
        };
        vrButton = new webvrui.EnterVRButton(renderer.domElement, uiOptions);
        vrButton.on('exit', function () { updateVRStatus('disable'); });
        vrButton.on('hide', function() {
            document.getElementById('vr'+name).style.display = 'none';
        });
        vrButton.on('show', function() {
            document.getElementById('vr'+name).style.display = 'inherit';
        });
        document.getElementById('vrButton'+name).appendChild(vrButton.domElement);
        document.getElementById('magicWindow'+name).addEventListener('click', function() {
            vr = true;
            activateVR = true;
            activeVR = name.toLowerCase();
            console.log("Active VR = " + activeVR);
            vrButton.requestEnterFullscreen();
        });
    };

    // scan Gear VR controller
    var scanGearVRController = function () {

        var thumbpadPressed = controllerRight.getButtonState('thumbpad');
        var triggerPressed = controllerRight.getButtonState('trigger');

        if (thumbpadPressed)
            console.log("Thumbpad pressed");
        if (triggerPressed)
            console.log("Trigger pressed");

        var rotate = controllerRight.getButtonState('thumbpad');
        var angleX = null, angleY = null;
        var gamePadRight = controllerRight.getGamepad();
        if(gamePadRight) {
            angleX = gamePadRight.axes[0];
            angleY = gamePadRight.axes[1];
            if (rotate) {
                brain.rotateX(0.05 * angleX);
                brain.rotateZ(0.05 * angleY);
            } else {
                brain.position.z += 2.5 * angleX;
                brain.position.x += 2.5 * angleY;
            }
            brain.matrixWorldNeedsUpdate = true;
        }
        /*
        var v3Origin = new THREE.Vector3(0,0,0);
        var v3UnitUp = new THREE.Vector3(0,0,-100.0);

        // Find all nodes within 0.1 distance from left Touch Controller
        var closestNodeIndexRight = 0, closestNodeDistanceRight = 99999.9;
        for (var i = 0; i < brain.children.length; i++) {
            var distToNodeIRight = controllerRight.position.distanceTo(brain.children[i].getWorldPosition());
            if ( (distToNodeIRight < closestNodeDistanceRight ) ) {
                closestNodeDistanceRight = distToNodeIRight;
                closestNodeIndexRight = i;
            }
        }

        var isLeft = (activateVR == 'left');
        if(controllerRight.getButtonState('trigger')) {
            pointedNodeIdx = (closestNodeDistanceRight < 2.0) ? closestNodeIndexRight : -1;

            if (pointerRight) {
                // Touch Controller pointer already on! scan for selection
                if (controllerRight.getButtonState('grips')) {
                    updateNodeSelection(model, getPointedObject(controllerRight), isLeft);
                }
            } else {
                pointerRight = drawPointer(v3Origin, v3UnitUp);
                controllerRight.add(pointerRight);
            }
            updateNodeMoveOver(model, getPointedObject(controllerRight));
        } else {
            if (pointerRight) {
                controllerRight.remove(pointerRight);
            }
            pointerRight = null;
        }
        */
    };

    // scan the Oculus Touch for controls
    var scanOculusTouch = function () {
        var boostRotationSpeed = controllerLeft.getButtonState('grips') ? 0.1 : 0.02;
        var boostMoveSpeed = controllerRight.getButtonState('grips') ? 5.0 : 1.0;
        var angleX = null, angleY = null;
        var gamePadLeft = controllerLeft.getGamepad();
        var gamePadRight = controllerRight.getGamepad();
        if(gamePadLeft) {
            angleX = gamePadLeft.axes[0];
            angleY = gamePadLeft.axes[1];
            brain.rotateX(boostRotationSpeed * angleX);
            brain.rotateZ(boostRotationSpeed * angleY);
            brain.matrixWorldNeedsUpdate = true;
        }

        if(gamePadRight) {
            angleX = gamePadRight.axes[0];
            angleY = gamePadRight.axes[1];
            if(controllerRight.getButtonState('thumbpad')) {
                brain.position.y += boostMoveSpeed * angleY;
            } else {
                brain.position.z += boostMoveSpeed * angleX;
                brain.position.x += boostMoveSpeed * angleY;
            }
            brain.matrixWorldNeedsUpdate = true;
        }

        var v3Origin = new THREE.Vector3(0,0,0);
        var v3UnitUp = new THREE.Vector3(0,0,-100.0);
        // var v3UnitFwd = new THREE.Vector3(0,0,1);

        // Find all nodes within 0.1 distance from left Touch Controller
        var closestNodeIndexLeft = 0, closestNodeDistanceLeft = 99999.9;
        var closestNodeIndexRight = 0, closestNodeDistanceRight = 99999.9;
        for (var i = 0; i < brain.children.length; i++) {
            var distToNodeILeft = controllerLeft.position.distanceTo(brain.children[i].getWorldPosition());
            if ( (distToNodeILeft < closestNodeDistanceLeft ) ) {
                closestNodeDistanceLeft = distToNodeILeft;
                closestNodeIndexLeft = i;
            }

            var distToNodeIRight = controllerRight.position.distanceTo(brain.children[i].getWorldPosition());
            if ( (distToNodeIRight < closestNodeDistanceRight ) ) {
                closestNodeDistanceRight = distToNodeIRight;
                closestNodeIndexRight = i;
            }
        }

        var isLeft = (activateVR == 'left');
        if(controllerLeft.getButtonState('trigger')) {
            pointedNodeIdx = (closestNodeDistanceLeft < 2.0) ? closestNodeIndexLeft : -1;

            if (pointerLeft) {
                // Touch Controller pointer already on! scan for selection
                if (controllerLeft.getButtonState('grips')) {
                    updateNodeSelection(model, getPointedObject(controllerLeft), isLeft);
                }
            } else {
                pointerLeft = drawPointer(v3Origin, v3UnitUp);
                controllerLeft.add(pointerLeft);
            }
            updateNodeMoveOver(model, getPointedObject(controllerLeft));
        } else {
            if (pointerLeft) {
                controllerLeft.remove(pointerLeft);
            }
            pointerLeft = null;
        }

        if(controllerRight.getButtonState('trigger')) {
            pointedNodeIdx = (closestNodeDistanceRight < 2.0) ? closestNodeIndexRight : -1;

            if (pointerRight) {
                // Touch Controller pointer already on! scan for selection
                if (controllerRight.getButtonState('grips')) {
                    updateNodeSelection(model, getPointedObject(controllerRight), isLeft);
                }
            } else {
                pointerRight = drawPointer(v3Origin, v3UnitUp);
                controllerRight.add(pointerRight);
            }
            updateNodeMoveOver(model, getPointedObject(controllerRight));
        } else {
            if (pointerRight) {
                controllerRight.remove(pointerRight);
            }
            pointerRight = null;
        }
    };

    // draw a pointing line
    var drawPointer = function (start, end) {
        var material = new THREE.LineBasicMaterial();
        var geometry = new THREE.Geometry();
        geometry.vertices.push(
            start,
            end
        );
        return new THREE.Line(geometry, material);
    };

    // initialize scene: init 3js scene, canvas, renderer and camera; add axis and light to the scene
    var initScene = function () {
        renderer.setSize(canvas.clientWidth, window.innerHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        canvas.appendChild(renderer.domElement);
        raycaster = new THREE.Raycaster();
        camera.position.z = 50;

        brain = new THREE.Group();
        scene.add(brain);

        //Adding light
        scene.add( new THREE.HemisphereLight(0x606060, 0x080820, 1.5));
        scene.add( new THREE.AmbientLight(0x606060, 1.5));
        var light = new THREE.PointLight( 0xffffff, 1.0, 10000 );
        light.position.set( 1000, 1000, 100 );
        scene.add(light);

        var axisHelper = new THREE.AxisHelper( 5 );
        scene.add( axisHelper );
        addNodeLabel();
    };

    this.resetCamera = function () {
        camera.position.set(50,50,50);
    };

    this.resetBrainPosition = function () {
        brain.updateMatrix();
        brain.position.set(0,0,0);
        brain.rotation.set(0,0,0);
        brain.scale.set(1,1,1);
        brain.updateMatrix();
        brain.matrixWorldNeedsUpdate = true;
    };

    // create 3js elements: scene, canvas, camera and controls; and init them and add skybox to the scene
    this.createCanvas = function() {
        scene = new THREE.Scene();
        renderer = new THREE.WebGLRenderer({antialias: true});
        camera = new THREE.PerspectiveCamera(75, canvas.clientWidth / window.innerHeight, 0.1, 3000);
        initScene();
        if (!mobile) {
            controls = new THREE.TrackballControls(camera, renderer.domElement);
            controls.rotateSpeed = 0.5;
        }
        addSkybox();
    };

    // initialize scene: init 3js scene, canvas, renderer and camera; add axis and light to the scene
    this.setEventListeners = function (onMouseDown, onMouseUp, onDocumentMouseMove) {
        canvas.addEventListener('mousedown', onMouseDown, true);
        canvas.addEventListener('mouseup', function (e) { onMouseUp(model, e);});
        canvas.addEventListener('mousemove', function (e) { onDocumentMouseMove(model, e); }, true);
    };

    // update node scale according to selection status
    this.updateNodeGeometry = function (nodeIndex, status) {
        var scale = 1.0;
        switch (status){
            case 'normal':
                scale = 1.0;
                break;
            case 'mouseover':
                scale = 1.2;
                break;
            case 'selected':
                scale = (8/3);
                break;
            case 'root':
                scale = (10/3);
                break;
        }
        glyphs[nodeIndex].scale.set(scale, scale, scale);
    };

    this.updateNodesColor = function () {
        var dataset = model.getDataset();
        for (var i=0; i < glyphs.length; ++i){
            glyphs[i].material.color = new THREE.Color(scaleColorGroup(model, dataset[i].group));
        }
    };

    var removeNodesFromScene = function () {
        for (var i=0; i < glyphs.length; ++i){
            brain.remove(glyphs[i]);
            delete glyphNodeDictionary[glyphs[i].uuid];
        }
        glyphs = [];
    };

    this.removeEdgesFromScene = function () {
        for(var i=0; i < displayedEdges.length; ++i){
            brain.remove(displayedEdges[i]);
        }
        displayedEdges = [];

        this.removeShortestPathEdgesFromScene();
    };

    this.removeShortestPathEdgesFromScene = function () {
        for(var i=0; i < shortestPathEdges.length; i++){
            brain.remove(shortestPathEdges[i]);
        }
        shortestPathEdges = [];
    };

    var animatePV = function () {
        if (enableVR && activateVR) {
            if (oculusTouchExist) {
                controllerLeft.update();
                controllerRight.update();
                scanOculusTouch();
            }
            vrControl.update();
        }
        else {
            if (mobile) {
                vrControl.update();
                if (gearVRControllerExist) {
                    controllerRight.update();
                    scanGearVRController();
                }
            }
            else
                controls.update();
        }

        if (enableRender)
            effect.render(scene, camera);

        effect.requestAnimationFrame(animatePV);
    };

    this.requestAnimate = function () {
        effect.requestAnimationFrame(animatePV);
    };

    this.enableRender = function (state) { enableRender = state; };

    this.isVRAvailable = function () { return enableVR; };

    this.isPresenting = function () { vrButton.isPresenting(); };

    this.redrawEdges = function () {
        this.removeEdgesFromScene();
        if (spt)
            this.updateShortestPathEdges();
        this.drawConnections();
    };

    // determine if a region should be drawn
    var shouldDrawRegion = function (region) {
        return (model.isRegionActive(region.group) && atlas.getLabelVisibility(region.label));
    };

    // updating scenes: redrawing glyphs and displayed edges
    this.updateScene = function (){
        updateNodesPositions();
        this.updateNodesVisibility();
        this.redrawEdges();
    };

    // draw the brain regions as glyphs (the nodes)
    // assumes all nodes are visible, nothing is selected
    this.drawRegions = function () {
        var dataset = model.getDataset();
        var material, geometry;

        for(var i=0; i < dataset.length; i++){
            geometry = getNormalGeometry(dataset[i].hemisphere);
            material = getNormalMaterial(model, dataset[i].group);
            glyphs[i] = new THREE.Mesh(geometry, material);
            brain.add(glyphs[i]);
            glyphNodeDictionary[glyphs[i].uuid] = i;
            glyphs[i].position.set(dataset[i].position.x, dataset[i].position.y, dataset[i].position.z);
            glyphs[i].userData.hemisphere = dataset[i].hemisphere;
        }
    };

    // update the nodes positions according to the latest in the model
    var updateNodesPositions = function () {
        var dataset = model.getDataset();
        for(var i=0; i < dataset.length; i++){
            glyphs[i].position.set(dataset[i].position.x, dataset[i].position.y, dataset[i].position.z);
        }
    };

    this.updateNodesVisibility = function () {
        var dataset = model.getDataset();
        for(var i=0; i < dataset.length; i++){
            var opacity = 1.0;
            if(root && root == i){ // root node
                opacity = 1.0;
            }

            if (shouldDrawRegion(dataset[i])) {
                switch (model.getRegionState(dataset[i].group)){
                    case 'active':
                        opacity = 1.0;
                        break;
                    case 'transparent':
                        opacity = 0.3;
                        break;
                    case 'inactive':
                        opacity = 0.0;
                        break;
                }
            } else {
                opacity = 0.0;
            }
            glyphs[i].material.opacity = opacity;
        }
    };


    // draw all connections between the selected nodes, needs the connection matrix.
    // don't draw edges belonging to inactive nodes
    this.drawConnections = function () {
        var nodeIdx;
        for(var i= 0; i < nodesSelected.length; i++){
            nodeIdx = nodesSelected[i];
            // draw only edges belonging to active nodes
            if(model.isRegionActive(model.getGroupNameByNodeIndex(nodeIdx))) {
                // two ways to draw edges
                if(thresholdModality) {
                    // 1) filter edges according to threshold
                    this.drawEdgesGivenNode(nodeIdx);
                } else {
                    // 2) draw top n edges connected to the selected node
                    this.drawTopNEdgesByNode(nodeIdx, model.getNumberOfEdges());
                }
            }
        }

        // draw all edges belonging to the shortest path array
        for(i=0; i < shortestPathEdges.length; i++){
            displayedEdges[displayedEdges.length] = shortestPathEdges[i];
            brain.add(shortestPathEdges[i]);
        }

        // setEdgesColor();
    };

    // skew the color distribution according to the nodes strength
    var computeColorGradient = function (c1, c2, n, p) {
        var gradient = new Float32Array( n * 3 );
        var p1 = p; var p2 = 1-p1;
        for (var i = 0; i < n; ++i) {
            // skew the color distribution according to the nodes strength
            var r = i/(n-1);
            var rr = (r*r*(p2-0.5) + r*(0.5-p2*p2))/(p1*p2);
            gradient[ i * 3 ] = c2.r + (c1.r - c2.r)*rr;
            gradient[ i * 3 + 1 ] = c2.g + (c1.g - c2.g)*rr;
            gradient[ i * 3 + 2 ] = c2.b + (c1.b - c2.b)*rr
        }
        return gradient;
    };

    // set the color of displayed edges
    this.updateEdgeColors = function () {
        var edge, c1, c2;
        for(var i = 0; i < displayedEdges.length; i++){
            edge = displayedEdges[i];
            c1 = glyphs[edge.nodes[0]].material.color;
            c2 = glyphs[edge.nodes[1]].material.color;
            edge.geometry.addAttribute( 'color', new THREE.BufferAttribute( computeColorGradient(c1,c2,edge.nPoints, edge.p1), 3 ) );
        }

        for(i = 0; i < shortestPathEdges.length; i++){
            edge = displayedEdges[i];
            c1 = glyphs[edge.nodes[0]].material.color;
            c2 = glyphs[edge.nodes[1]].material.color;
            edge.geometry.addAttribute( 'color', new THREE.BufferAttribute( computeColorGradient(c1,c2,edge.nPoints, edge.p1), 3 ) );
        }
    };

    this.updateEdgeOpacity = function (opacity) {
        edgeOpacity = opacity;
        for(var i = 0; i < displayedEdges.length; i++){
            displayedEdges[i].material.opacity = opacity;
        }
    };

    // create a line using start and end points and give it a name
    // TODO use this to allow different line sizes
    // https://github.com/spite/THREE.MeshLine#create-a-threemeshline-and-assign-the-geometry
    // geometry.vertices.push(end);
    // var line = new THREE.MeshLine();
    // line.setGeometry( geometry );
    // material = new THREE.MeshLineMaterial();
    // var mesh  = new THREE.Mesh(line.geometry, material);
    var createLine = function(edge, ownerNode, nodes){
        var material = new THREE.LineBasicMaterial({
            transparent: true,
            opacity: edgeOpacity,
            vertexColors: THREE.VertexColors
            // Due to limitations in the ANGLE layer on Windows platforms linewidth will always be 1.
        });

        var geometry = new THREE.BufferGeometry();
        var n = edge.length;

        var positions = new Float32Array( n * 3 );
        for (var i = 0; i < n; i++) {
            positions[ i * 3 ] = edge[i].x;
            positions[ i * 3 + 1 ] = edge[i].y;
            positions[ i * 3 + 2 ] = edge[i].z;
        }
        geometry.addAttribute( 'position', new THREE.BufferAttribute( positions, 3 ) );

        var s1 = model.getNodalStrength(nodes[0]), s2 = model.getNodalStrength(nodes[1]);
        var p1 = s1/(s1+s2);
        var c1 = new THREE.Color(scaleColorGroup(model, model.getGroupNameByNodeIndex(nodes[0]))),// glyphs[nodes[0]].material.color,
            c2 = new THREE.Color(scaleColorGroup(model, model.getGroupNameByNodeIndex(nodes[1])));// glyphs[nodes[1]].material.color;
        geometry.addAttribute( 'color', new THREE.BufferAttribute( computeColorGradient(c1,c2,n,p1), 3 ) );

        // geometry.colors = colorGradient;
        var line  = new THREE.Line(geometry, material);
        line.name = ownerNode;
        line.nPoints = n;
        line.nodes = nodes;
        line.p1 = p1;
        return line;
    };

    var drawEdgeWithName = function (edge, ownerNode, nodes) {
        var line = createLine(edge, ownerNode, nodes);
        brain.add(line);
        return line;
    };

    // draw the top n edges connected to a specific node
    this.drawTopNEdgesByNode = function (nodeIndex, n) {

        var row = model.getTopConnectionsByNode(nodeIndex, n);
        var edges = model.getActiveEdges();
        var edgeIdx = model.getEdgesIndeces();
        if (enableEB) {
            model.performEBOnNode(nodeIndex);
        }
        for (var i =0; i < row.length; ++i) {
            if ((nodeIndex != row[i]) && model.isRegionActive(model.getGroupNameByNodeIndex(i)) && visibleNodes[i]) {
                displayedEdges[displayedEdges.length] = drawEdgeWithName(edges[edgeIdx[nodeIndex][row[i]]], nodeIndex, [nodeIndex, row[i]]);
            }
        }

        // setEdgesColor();
    };

    // draw edges given a node following edge threshold
    this.drawEdgesGivenNode = function(indexNode) {

        var row = model.getConnectionMatrixRow(indexNode);
        var edges = model.getActiveEdges();
        var edgeIdx = model.getEdgesIndeces();
        if (enableEB) {
            model.performEBOnNode(indexNode);
        }

        for(var i=0; i < row.length ; i++){
            if((i != indexNode) && Math.abs(row[i]) > model.getThreshold()  && model.isRegionActive(model.getGroupNameByNodeIndex(i)) && visibleNodes[i]) {
                displayedEdges[displayedEdges.length] = drawEdgeWithName(edges[edgeIdx[indexNode][i]], indexNode, [indexNode, i]);
            }
        }
    };

    // give a specific node index, remove all edges from a specific node in a specific scene
    this.removeEdgesGivenNode = function(indexNode) {
        var l = displayedEdges.length;

        // keep a list of removed edges indexes
        var removedEdges = [];
        for(var i=0; i < l; i++){
            var edge = displayedEdges[i];
            //removing only the edges that starts from that node
            if(edge.name == indexNode && shortestPathEdges.indexOf(edge) == -1){
                removedEdges[removedEdges.length] = i;
                brain.remove(edge);
            }
        }

        // update the displayedEdges array
        var updatedDisplayEdges = [];
        for(i=0; i < displayedEdges.length; i++){
            //if the edge should not be removed
            if( removedEdges.indexOf(i) == -1){
                updatedDisplayEdges[updatedDisplayEdges.length] = displayedEdges[i];
            }
        }

        for(i=0; i < shortestPathEdges.length; i++){
            updatedDisplayEdges[updatedDisplayEdges.length] = shortestPathEdges[i];
        }
        displayedEdges = updatedDisplayEdges;
    };

    // draw skybox from images
    var addSkybox = function(){
        var folder = 'darkgrid';
        var images = [
            'images/'+folder+'/negx.png',
            'images/'+folder+'/negy.png',
            'images/'+folder+'/negz.png',
            'images/'+folder+'/posx.png',
            'images/'+folder+'/posy.png',
            'images/'+folder+'/posz.png'
        ];

        var cubemap = THREE.ImageUtils.loadTextureCube(images); // load textures
        cubemap.format = THREE.RGBFormat;

        var shader = THREE.ShaderLib['cube']; // init cube shader from built-in lib
        shader.uniforms['tCube'].value = cubemap; // apply textures to shader

        // create shader material
        var skyBoxMaterial = new THREE.ShaderMaterial( {
            fragmentShader: shader.fragmentShader,
            vertexShader: shader.vertexShader,
            uniforms: shader.uniforms,
            depthWrite: false,
            side: THREE.BackSide
        });

        // create skybox mesh
        var skybox = new THREE.Mesh(
            new THREE.CubeGeometry(1500, 1500, 1500),
            skyBoxMaterial
        );

        skybox.name = "skybox";
        scene.add(skybox);
    };

    // toggle skybox visibility
    this.setSkyboxVisibility = function(visible){
        var results = scene.children.filter(function(d) {return d.name == "skybox"});
        var skybox = results[0];
        skybox.visible = visible;
    };

    // draw a selected node: increase it's size
    this.drawSelectedNode = function (nodeIndex) {
        if(nodesSelected.indexOf(nodeIndex) == -1) {
            nodesSelected[nodesSelected.length] = nodeIndex;
        }
        this.updateNodeGeometry(nodeIndex, 'selected');
    };

    // get intersected object beneath the mouse pointer
    // detects which scene: left or right
    // return undefined if no object was found
    this.getIntersectedObject = function(vector) {
        raycaster.setFromCamera(vector, camera);
        var objectsIntersected = raycaster.intersectObjects( glyphs );
        return (objectsIntersected[0])?  objectsIntersected[0] : undefined;
    };

    // callback when window is resized
    this.resizeScene = function(){
        if (vrButton && vrButton.isPresenting()) {
            camera.aspect = window.innerWidth / window.innerHeight;
            renderer.setSize(window.innerWidth, window.innerHeight);
            console.log("Resize for Mobile VR");
        } else {
            camera.aspect = window.innerWidth / 2.0 / window.innerHeight;
            renderer.setSize(window.innerWidth / 2.0, window.innerHeight);
            console.log("Resize");
        }
        camera.updateProjectionMatrix();
    };

    // compute shortest path info for a node
    this.computeShortestPathForNode = function(nodeIndex) {
        console.log("Compute Shortest Path for node " + nodeIndex);
        root = nodeIndex;
        model.computeShortestPathDistances(nodeIndex);
    };

    // draw shortest path from root node up to a number of hops
    this.updateShortestPathBasedOnHops = function () {
        var hops = model.getNumberOfHops();
        var hierarchy = model.getHierarchy(root);
        var edges = model.getActiveEdges();
        var edgeIdx = model.getEdgesIndeces();
        var previousMap = model.getPreviousMap();

        this.removeShortestPathEdgesFromScene();

        for(var i = 0; i < hierarchy.length; ++i) {
            if( i < hops + 1 ) {
                //Visible node branch
                for(var j=0; j < hierarchy[i].length; j++){
                    visibleNodes[hierarchy[i][j]] = true;
                    var prev = previousMap[hierarchy[i][j]];
                    if(prev){
                        shortestPathEdges[shortestPathEdges.length] = createLine(edges[edgeIdx[prev][hierarchy[i][j]]] , prev, [prev, i]);
                    }
                }
            } else {
                for(var j=0; j < hierarchy[i].length; ++j){
                    visibleNodes[hierarchy[i][j]] = false;
                }
            }
        }
    };

    this.updateShortestPathBasedOnDistance = function () {
        nodesSelected = [];
        this.removeShortestPathEdgesFromScene();

        // show only nodes with shortest paths distance less than a threshold
        var threshold = model.getDistanceThreshold()/100.*model.getMaximumDistance();
        var distanceArray = model.getDistanceArray();
        for(var i=0; i < visibleNodes.length; i++){
            visibleNodes[i] = (distanceArray[i] <= threshold);
        }

        var edges = model.getActiveEdges();
        var edgeIdx = model.getEdgesIndeces();
        var previousMap = model.getPreviousMap();

        for(i=0; i < visibleNodes.length; ++i) {
            if(visibleNodes[i]){
                var prev = previousMap[i];
                if(prev) {
                    shortestPathEdges[shortestPathEdges.length] = createLine(edges[edgeIdx[prev][i]], prev, [prev, i]);
                }
            }
        }
    };

    this.updateShortestPathEdges = function () {
        switch (shortestPathVisMethod) {
            case (SHORTEST_DISTANCE):
                    this.updateShortestPathBasedOnDistance();
                break;
            case (NUMBER_HOPS):
                    this.updateShortestPathBasedOnHops();
                break;
        }
    };

    // prepares the shortest path from a = root to node b
    this.getShortestPathFromRootToNode = function(target) {
        this.removeShortestPathEdgesFromScene();

        var i = target;
        var prev;
        var edges = model.getActiveEdges();
        var edgeIdx = model.getEdgesIndeces();
        var previousMap = model.getPreviousMap();

        visibleNodes.fill(true);
        while(previousMap[i]!= null){
            prev = previousMap[i];
            visibleNodes[prev] = true;
            shortestPathEdges[shortestPathEdges.length] = createLine(edges[edgeIdx[prev][i]], prev, [prev, i] );
            i = prev;
        }

        this.drawConnections();
    };

    // get intersected object pointed to by Vive/Touch Controller pointer
    // return undefined if no object was found
    var getPointedObject = function(controller) {

        var gamePad = controller.getGamepad();
        if (gamePad) {
            var orientation = new THREE.Quaternion().fromArray(gamePad.pose.orientation);
            var v3orientation = new THREE.Vector3(0,0,-1.0);
            v3orientation.applyQuaternion(orientation);
            var ray = new THREE.Raycaster(controller.position, v3orientation);
            var objectsIntersected = ray.intersectObjects(glyphs);
            if (objectsIntersected[0]) {
                return objectsIntersected[0];
            }
        }
        return undefined;
    };

    // Update the text and position according to selected node
    // The alignment, size and offset parameters are set by experimentation
    // TODO needs more experimentation
    this.updateNodeLabel = function(text, nodeIndex) {
        var context = nspCanvas.getContext('2d');
        context.textAlign = 'left';
        context.clearRect(0, 0, 256*4, 256);
        context.fillText(text, 5, 120);

        nodeNameMap.needsUpdate = true;
        var pos = glyphs[nodeIndex].position;
        nodeLabelSprite.position.set(pos.x, pos.y, pos.z);
        nodeLabelSprite.needsUpdate = true;
    };

    // Adding Node label Sprite
    var addNodeLabel = function() {

        nspCanvas = document.createElement('canvas');
        var size = 256;
        nspCanvas.width = size*4;
        nspCanvas.height = size;
        var context = nspCanvas.getContext('2d');
        context.fillStyle = '#ffffff';
        context.textAlign = 'left';
        context.font = '24px Arial';
        context.fillText("", 0, 0);

        nodeNameMap = new THREE.Texture(nspCanvas);
        nodeNameMap.needsUpdate = true;

        var mat = new THREE.SpriteMaterial({
            map: nodeNameMap,
            transparent: false,
            useScreenCoordinates: false,
            color: 0xffffff
        });

        nodeLabelSprite = new THREE.Sprite(mat);
        nodeLabelSprite.scale.set( 100, 50, 1 );
        nodeLabelSprite.position.set( 0, 0, 0 );
        brain.add(nodeLabelSprite);
    };

    this.getCamera = function() { return camera; };

    this.syncCameraWith = function(cam) {
        camera.copy(cam);
        camera.position.copy(cam.position);
        camera.rotation.copy(cam.rotation);
        camera.zoom = cam.zoom;
        // camera.quaternion.copy(cam.quaternion);
        // camera.updateMatrix();
    };
}