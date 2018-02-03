/**
 * Created by giorgioconte on 31/01/15.
 */
/*
private variables
 */

function Model() {
    var groups = {};                    // contain nodes group affiliation according to Anatomy, place, rich club, id
    var activeGroup;                    // active group name
    var regions = {};                   // activeGroup activation (T/F) and state: active, transparent or inactive
    var labelKeys;                      // map between each node and its corresponding Atlas label
    var icColorTable = [];
    var dataset = [];                   // contains compiled information about the dataset according to the active coloring
                                        // scheme and topology

    var centroids = {};                 // nodes centroids according to topological spaces: centroids[node][technique] = (x,y,z)
    var topologies = [];                // available topologies
    var clusteringTopologies = [];      // available clustering topologies
    var activeTopology;                 // isomap, MDS, anatomy, tsne, PLACE, selection from centroids
    var nodesDistances = {};            // Euclidean distance between the centroids of all nodes

    var connectionMatrix = [];          // adjacency matrix
    var distanceMatrix = [];            // contains the distance matrix of the model: 1/(adjacency matrix)
    var nodesStrength = [];

    var threshold;                      // threshold for the edge value
    var numberOfEdges = 5;              // threshold the number of edges for shortest paths

    var edges = [];                     // contains the edges per dataType
    var edgeIdx = [];                   // 2D matrix where entries are the corresponding edge index

    var distanceArray;                  // contain the shortest path for current selected node
    var maxDistance = null;             // max value of distanceArray
    var distanceThreshold = 50;         // threshold for the distanceArray in percentage of the max value: 0 to 100
    var numberOfHops = 0;               // max number of hops for shortest path
    var graph;

    var metricValues = [];

    var clusters = {};                  // PLACE clusters, assumed level 4: clusters from 1 to 16
    var maxClusterHierarchicalLevel = 4;// max clustering hierarchical level
    var clusteringLevel = 4;            // default PLACE/PACE level
    var clusteringGroupLevel = 4;       // clustering group level used for color coding, 1 to 4
    var clusteringRadius = 5;           // sphere radius of PLACE/PACE visualization

    var fbundling = d3.GPUForceEdgeBundling().cycles(6).iterations(60).enable_keep_programs(true);

    this.clearModel = function () {
        groups = [];
        regions = {};
        icColorTable = [];

        centroids = {};
        topologies = [];
        clusteringTopologies = [];
        clusters = {};
        nodesDistances = {};

        connectionMatrix = [];
        distanceMatrix = [];

        edges = [];
        edgeIdx = [];
    };


    // data ready in model ready
    this.ready = function() {
        return (labelKeys && centroids && connectionMatrix);
    };

    // set the iso center color table ???
    this.setICColor = function (icData) {
        icColorTable = icData.data;
    };

    this.getDistanceArray = function () {
        return distanceArray;
    };

    // get the longest shortest path of the current selected node = the farthest node
    this.getMaximumDistance = function () {
        return maxDistance;
    };

    // store map between each node and its corresponding Atlas label#
    this.setLabelKeys = function (data, loc) {
        labelKeys = [];
        // data[0] is assumed to contain a string header
        for (var j = 1; j < data.length; j++) {
            labelKeys.push(data[j][loc]);
        }
    };

    // setting activeGroup: 0 = Anatomy, 1 = place, 2 = rich club, 3 = PLACE, 4 = id
    this.setActiveGroup = function (group) {
        activeGroup = group;
    };

    this.getActiveGroupName = function () {
        return activeGroup;
    };

    // create groups in order: Anatomy, place, rich club, id
    this.createGroups = function () {
        console.log("create groups");
        var len = labelKeys.length;
        var names = atlas.getGroupsNames();
        for (var i = 0; i < names.length; ++i)
            groups[names[i]] = new Array(len);

        for (var i = 0; i < len; ++i) {
            var label = labelKeys[i];
            var region = atlas.getRegion(label);
            for (var j = 0; j < names.length; ++j)
                groups[names[j]][i] = region[names[j]];
        }

        if (this.hasClusteringData()) {
            for (var i = 0; i < clusteringTopologies.length; ++i) {
                var topology = clusteringTopologies[i];
                groups[topology] = clusters[topology][clusters[topology].length - 1];
            }
        }

        activeGroup = names[0];
        this.prepareDataset();
    };

    // update the clustering group level, level can be 1 to 4
    this.updateClusteringGroupLevel = function (level) {
        if (this.hasClusteringData() && clusteringTopologies.indexOf(activeGroup) > -1 && clusters[activeGroup].length > 1) {
            groups[activeGroup] = clusters[activeGroup][level-1];
            clusteringGroupLevel = level;
        }
    };

    this.getClusteringGroupLevel = function () {
        return clusteringGroupLevel;
    };

    // return the group affiliation of every node according to activeGroup
    this.getActiveGroup = function () {
        var l = groups[activeGroup].length;
        var results = [];
        for (var i = 0; i < l; i++) {
            var element = groups[activeGroup][i];
            if (results.indexOf(element) == -1) {
                results[results.length] = element;
            }
        }
        return results;
    };


    // isomap, MDS, anatomy, tsne, selection from centroids
    this.setActiveTopology = function (topology) {
        if (activeTopology === topology)
            return;

        activeTopology = topology;
        this.computeEdgesForTopology(topology);
    };

    this.getActiveTopology = function () {
        return activeTopology;
    };

    this.computeNodesDistances = function (topology) {
        nodesDistances[topology] = [];
        var cen = centroids[topology];
        var nNodes = cen.length;
        var distances = new Array(nNodes);
        for (var i = 0; i < nNodes; i++) {
            distances[i] = new Array(nNodes);
        }
        for (var i = 0; i < nNodes; i++) {
            for (var j = i; j < nNodes; j++) {
                distances[i][j] = cen[i].distanceTo(cen[j]);
                distances[j][i] = distances[i][j];
            }
        }
        nodesDistances[topology] = distances;
    };

    // store nodes centroids according to topological spaces
    // technique can be: Isomap, MDS, tSNE, anatomy ...
    this.setCentroids = function (d, topology, offset) {
        var data = [];
        // data[0] is assumed to contain a string header
        for (var i = 1; i < d.length; i++) {
            data.push(new THREE.Vector3(d[i][0 + offset], d[i][1 + offset], d[i][2 + offset]));
        }
        centroids[topology] = scaleCentroids(data);
        this.computeNodesDistances(topology);
    };

    // set shortest path distance threshold and update GUI
    this.setDistanceThreshold = function (dt) {
        distanceThreshold = dt;
    };

    // get shortest path distance threshold
    this.getDistanceThreshold = function () {
        return distanceThreshold;
    };

    // store edge threshold and update GUI
    this.setThreshold = function (t) {
        threshold = t;
    };

    // get edge threshold
    this.getThreshold = function () {
        return threshold;
    };

    // set connection matrix
    this.setConnectionMatrix = function(d) {
        connectionMatrix = d.data;
        this.computeDistanceMatrix();
        this.computeNodalStrength();
    };

    // prepare the dataset data
    this.prepareDataset = function() {
        dataset = [];
        for (var i = 0; i < labelKeys.length; i++) {
            var label = labelKeys[i];
            var region = atlas.getRegion(label);
            dataset[i] = {
                position: centroids[activeTopology][i],
                name: region.region_name,
                group: groups[activeGroup][i],
                hemisphere: region.hemisphere,
                label: label
            };
        }
    };

    // get the dataset according to activeTopology
    this.getDataset = function() {
        for (var i = 0; i < dataset.length; i++) {
            dataset[i].position = centroids[activeTopology][i];
            dataset[i].group = groups[activeGroup][i];
        }
        return dataset;
    };

    // get connection matrix according to activeMatrix
    this.getConnectionMatrix = function() {
        return connectionMatrix;
    };

    // get a row (one node) from connection matrix
    this.getConnectionMatrixRow = function (index) {
        return connectionMatrix[index].slice(0);
    };

    // get the group of a specific node according to activeGroup
    this.getGroupNameByNodeIndex = function (index) {
        return groups[activeGroup][index];
    };

    // return if a specific region is activated
    this.isRegionActive = function(regionName) {
        return regions[regionName].active;
    };

    // toggle a specific region in order: active, transparent, inactive
    // set activation to false if inactive
    this.toggleRegion = function(regionName) {
        switch (regions[regionName].state) {
            case 'active':
                regions[regionName].state = 'transparent';
                regions[regionName].active = true;
                break;
            case 'transparent':
                regions[regionName].state = 'inactive';
                regions[regionName].active = false;
                break;
            case 'inactive':
                regions[regionName].state = 'active';
                regions[regionName].active = true;
                break;
        }
    };

    this.getCurrentRegionsInformation = function () {
        return regions;
    };

    // get region state using its name
    this.getRegionState = function(regionName) {
        return regions[regionName].state;
    };

    this.getRegionActivation = function(regionName) {
        return regions[regionName].active;
    };

    this.setCurrentRegionsInformation = function (info) {
        for (var element in regions) {
            if (info[element]) {
                regions[element] = info[element];
            }
        }
    };

    // set all regions active
    this.setAllRegionsActivated = function() {
        regions = {};
        for (var i = 0; i < groups[activeGroup].length; i++) {
            var element = groups[activeGroup][i];
            if (regions[element] === undefined)
            regions[element] = {
                active: true,
                state: 'active'
            }
        }
    };

    // get the connection matrix number of nodes
    this.getConnectionMatrixDimension = function () {
        return connectionMatrix.length;
    };

    // get top n edges connected to a specific node
    this.getTopConnectionsByNode = function(indexNode, n) {
        var row = this.getConnectionMatrixRow(indexNode);
        var sortedRow = this.getConnectionMatrixRow(indexNode).sort(function (a, b) {
            return b - a
        }); //sort in a descending flavor
        var indexes = new Array(n);
        for (var i = 0; i < n; i++) {
            indexes[i] = row.indexOf(sortedRow[i]);
        }
        return indexes;
    };

    this.getMaximumWeight = function () {
        return d3.max(connectionMatrix, function (d) {
            return d3.max(d, function (d) { return d; })
        });
    };

    this.getMinimumWeight = function () {
        return d3.min(connectionMatrix, function (d) {
            return d3.min(d, function (d) { return d; })
        });
    };

    this.getNumberOfEdges = function() {
        return numberOfEdges;
    };

    this.setNumberOfEdges = function(n) {
        numberOfEdges = n;
    };

    // get the region data of a specific node
    this.getRegionByIndex = function (index) {
        return dataset[index];
    };

    this.setMetricValues = function(data) {
        metricValues = data.data;

        metricQuantileScale = d3.scale.quantile()
            .domain(metricValues)
            .range(['#000080', '#0000c7', '#0001ff', '#0041ff', '#0081ff', '#00c1ff', '#16ffe1', '#49ffad',
                '#7dff7a', '#b1ff46', '#e4ff13', '#ffd000', '#ff9400', '#ff5900', '#ff1e00', '#c40000']);

        console.log("loaded metric file");
    };

// Jet colormap
//'#000080','#0000c7','#0001ff','#0041ff','#0081ff','#00c1ff','#16ffe1','#49ffad','#7dff7a',
// '#b1ff46','#e4ff13','#ffd000','#ff9400','#ff5900','#ff1e00','#c40000'
// Mine colormap
//'#c6dbef', '#9ecae1', '#6baed6', '#3182bd', '#08519c'

    /* BCT Stuff*/
    // compute nodal strength of a specific node given its row
    this.getNodalStrength = function(idx) {
        return nodesStrength[idx];
    };

    this.computeNodalStrength = function () {
        var nNodes = connectionMatrix.length;
        nodesStrength = new Array(nNodes);
        for (var i = 0; i < nNodes; ++i)
            nodesStrength[i] = d3.sum(connectionMatrix[i].slice(0));
    };

    // compute distance matrix = 1/(adjacency matrix)
    this.computeDistanceMatrix = function() {
        var nNodes = connectionMatrix.length;
        distanceMatrix = new Array(nNodes);
        graph = new Graph();
        var idx = 0;
        // for every node, add the distance to all other nodes
        for(var i = 0; i < nNodes; i++){
            var vertexes = [];
            var row = new Array(nNodes);
            edgeIdx.push(new Array(nNodes));
            edgeIdx[i].fill(-1); // indicates no connection
            for(var j = 0; j < nNodes; j++){
                vertexes[j] = 1/connectionMatrix[i][j];
                row[j] = 1/connectionMatrix[i][j];
                if (j > i && Math.abs(connectionMatrix[i][j]) > 0) {
                    edgeIdx[i][j] = idx;
                    idx++;
                }
            }
            distanceMatrix[i] = row;
            graph.addVertex(i,vertexes);
        }

        // mirror it
        for(var i = 0; i < nNodes; i++) {
            for(var j = i+1; j < nNodes; j++) {
                edgeIdx[j][i] = edgeIdx[i][j];
            }
        }
        console.log("Distance Matrix Computed");
    };

    // compute shortest path from a specific node to the rest of the nodes
    this.computeShortestPathDistances = function(rootNode) {
        console.log("computing spt");
        distanceArray = graph.shortestPath(String(rootNode));
        maxDistance = d3.max(distanceArray);
    };

    this.getHierarchy = function (rootIndex) {
        return graph.getHierarchy(rootIndex);
    };

    this.getPreviousMap = function () {
        return (graph) ? graph.getPreviousMap() : null;
    };

    this.getMaxNumberOfHops = function(){
        return graph.getMaxNumberOfHops();
    };

    this.setNumberOfHops = function(hops) {
        numberOfHops = hops;
    };

    this.getNumberOfHops = function () {
        return numberOfHops;
    };

    // compute the position of each node for a clustering topology according to clustering data
    // in case of PLACE or PACE, clustering level can be 1 to 4, clusters[topology][level]
    // in case of other clustering techniques: Q-modularity, no hierarchy information is applied
    // clusters[topology][0] contains the clustering information.
    // clusters starts by 1 not 0.
    this.computeNodesLocationForClusters = function(topology) {
        var platonic = new Platonics();
        var isHierarchical = topology === "PLACE" || topology === "PACE";
        var level = isHierarchical ? clusteringLevel-1 : 0;
        var cluster = clusters[topology][level];
        var totalNNodes = cluster.length;
        var maxNumberOfClusters = d3.max(cluster) - d3.min(cluster) + 1;
        var nClusters = ((isHierarchical)) ? Math.pow(2, clusteringLevel) : maxNumberOfClusters;
        // if hierarchical but the nClusters > maxNumberOfClusters
        // this only happens if the provided data have < 4 levels
        // of clusters. The clusteringLevel should discover that
        nClusters = Math.min(nClusters, maxNumberOfClusters);

        if (maxNumberOfClusters < 4)
            platonic.createTetrahedron();
        else if (maxNumberOfClusters < 7)
            platonic.createCube();
        else if (maxNumberOfClusters < 10)
            platonic.createDodecahedron();
        else if (maxNumberOfClusters < 20)
            platonic.createIcosahedron();
        else {
            console.error("Can not visualize clustering data.");
            return;
        }
        // use one of the faces to compute primary variables
        var face = platonic.getFace(0);
        var coneAxis = math.mean(face,0);
        coneAxis = math.divide(coneAxis, math.norm(coneAxis));
        var theta = Math.abs( Math.acos(math.dot(coneAxis, face[0]) ));
        var coneAngle = theta*0.6;
        var coneR = clusteringRadius*Math.sin(coneAngle/2);
        var coneH = clusteringRadius*Math.cos(coneAngle/2);
        var v1 = [], v2 = [], center = [];
        var centroids = new Array(totalNNodes+1);

        // assume clustering data starts at 1
        for (var i = 0; i < nClusters; i++) {
            var clusterIdx = [];
            for (var s = 0; s < totalNNodes; s++) {
                if (cluster[s] == (i+1)) clusterIdx.push(s);
            }
            var nNodes = clusterIdx.length;
            face = platonic.getFace(i);
            coneAxis = math.mean(face,0);
            coneAxis = math.divide(coneAxis, math.norm(coneAxis));
            v1 = math.subtract(face[0], face[1]);
            v1 = math.divide(v1, math.norm(v1));
            v2 = math.cross(coneAxis, v1);
            center = math.multiply(coneH, coneAxis);
            var points = sunflower(nNodes, coneR, center, v1, v2);
            // normalize and store
            for (var k = 0; k < nNodes; k++) {
                centroids[clusterIdx[k]+1] = math.multiply(clusteringRadius, math.divide(points[k], math.norm(points[k])));
            }
        }
        this.setCentroids(centroids, topology, 0);
    };

    // clusters can be hierarchical such as PLACE and PACE or not
    this.setClusters = function(data, loc, name) {
        var clusteringData = [];
        // data[0] is assumed to contain a string header
        for (var j = 1; j < data.length; j++) {
            clusteringData.push(data[j][loc]);
        }
        var temp = [];
        if (name === "PLACE" || name === "PACE") { // PLACE
            var maxNumberOfClusters = d3.max(clusteringData) - d3.min(clusteringData) + 1;
            console.log("Found " + maxNumberOfClusters + " clusters for " + name + " data.");
            maxClusterHierarchicalLevel = Math.ceil(Math.log2(maxNumberOfClusters));
            clusteringLevel = maxClusterHierarchicalLevel;
            console.log("Max clustering level to be used = " + maxClusterHierarchicalLevel);
            if (maxClusterHierarchicalLevel > 4) {
                console.error("Hierarchical data requires " + maxClusterHierarchicalLevel + " levels."+
                                "\n That is more than what can be visualized!!");
            }
            temp = new Array(maxClusterHierarchicalLevel); // final levels
            temp[maxClusterHierarchicalLevel-1] = clusteringData;
            for (var i = maxClusterHierarchicalLevel - 2; i >= 0; i--) {
                temp[i] = math.ceil(math.divide(temp[i + 1], 2.0));
            }
        } else {
            temp[0] = clusteringData;
        }
        clusters[name] = temp;
    };

    this.setClusteringLevel = function(level) {
        if (level == clusteringLevel) {
            return;
        }
        // clustering level assumes hierarchical data
        if (level > maxClusterHierarchicalLevel) {
            console.log("Clustering level set to more than the max possible for the current data.");
            console.log("Cap value to " + maxClusterHierarchicalLevel);
            clusteringLevel = maxClusterHierarchicalLevel;
        } else {
            clusteringLevel = level;
        }
        this.computeNodesLocationForClusters(activeTopology);
    };

    this.setClusteringSphereRadius = function(r) {
        if (r == clusteringRadius) {
            return;
        }
        clusteringRadius = r;
        this.computeNodesLocationForClusters(activeTopology);
    };

    this.getClusteringLevel = function() {
        return clusteringLevel;
    };

    this.getMaxClusterHierarchicalLevel = function() {
        return maxClusterHierarchicalLevel;
    };

    this.hasClusteringData = function () {
        return (clusteringTopologies.length > 0);
    };

    this.getClusteringTopologiesNames = function () {
        return clusteringTopologies;
    };

    this.setTopology = function (data) {
        // the first line is assumed to contain the data indicator type
        var dataType;
        for (var i = 0; i < data[0].length; i++) {
            dataType = data[0][i];
                if (dataType === "label") {
                    this.setLabelKeys(data, i);
                }
                else if (dataType ==="PLACE" ||  // structural
                    dataType ==="PACE" || // functional
                    dataType ==="Q" ||
                    dataType ==="Q-Modularity" ||
                    dataType.includes("Clustering") ) {
                    dataType = dataType.replace("Clustering", "");
                    this.setClusters(data, i, dataType);
                    this.computeNodesLocationForClusters(dataType);
                    topologies.push(dataType);
                    clusteringTopologies.push(dataType);
                    }
                else if (dataType === "") {}
                else { // all other topologies
                    this.setCentroids(data, dataType, i);
                    topologies.push(dataType);
                }
        }
        activeTopology = topologies[0];
        this.computeEdgesForTopology(activeTopology);
    };

    this.getTopologies = function () {
        return topologies;
    };

    /*
     * Since EB takes time for large networks, we are going to partially computes it
     * we are going to compute EB for only 1000 edges at a time following:
     * 1) all edges of selected node
     * 2) all edges of selected node neighbor
     * @param nodeIdx selected node index
     */
    this.performEBOnNode = function(nodeIdx) {
        var edges_ = [];
        var edgeIndices = [];
        var nNodes = connectionMatrix.length;
        var cen = centroids[activeTopology];
        // all edges of selected node
        for (var i = 0; i < nNodes; i++) {
            if (Math.abs(connectionMatrix[nodeIdx][i]) > 0) {
                edges_.push({
                    'source': cen[i],
                    'target': cen[nodeIdx]
                });
                edgeIndices.push(edgeIdx[nodeIdx][i]);
            }
        }
        // selected node neighbors
        var neighbors = nodesDistances[activeTopology][nodeIdx]
            .map(function(o, i) {return {idx: i, val: o}; }) // create map with value and index
            .sort(function(a, b) {return a.val - b.val;}); // sort based on value
        for (var i = 1; i < nNodes; i++) { // first one assumed to be self
            if (edges_.length >= 500)
                break;
            if (neighbors[i].idx != nodeIdx) {
                var row = connectionMatrix[neighbors[i].idx];
                for (var j = 0; j < nNodes; j++) {
                    if (Math.abs(row[j]) > 0 && j != nodeIdx) {
                        edges_.push({
                            'source': cen[neighbors[i].idx],
                            'target': cen[j]
                        });
                        edgeIndices.push(edgeIdx[neighbors[i].idx][j]);
                    }
                }
            }
        }
        fbundling.edges(edges_);
        var results = fbundling();

        for (i = 0; i <edges_.length; i++) {
            edges[edgeIndices[i]] = results[i];
        }
    };

    this.getActiveEdges = function() {
        return edges;
    };

    this.getEdgesIndeces = function() {
        return edgeIdx;
    };

    // linearly scale coordinates to a range -500 to +500
    // returns a function that can be used to scale any input
    // according to provided data
    var createCentroidScale = function(d){
        var l = d.length;
        var allCoordinates = [];

        for(var i=0; i < l; i++) {
            allCoordinates[allCoordinates.length] = d[i].x;
            allCoordinates[allCoordinates.length] = d[i].y;
            allCoordinates[allCoordinates.length] = d[i].z;
        }
        var centroidScale = d3.scale.linear().domain(
            [
                d3.min(allCoordinates, function(e){ return e; }),
                d3.max(allCoordinates, function(e){ return e; })
            ]
        ).range([-500,+500]);
        return centroidScale;
    };

    // scales and center centroids
    var scaleCentroids = function (centroids) {
        var centroidScale = createCentroidScale(centroids);

        // compute centroids according to scaled data
        var xCentroid = d3.mean(centroids, function(d){ return centroidScale(d.x); });
        var yCentroid = d3.mean(centroids, function(d){ return centroidScale(d.y); });
        var zCentroid = d3.mean(centroids, function(d){ return centroidScale(d.z); });

        var newCentroids = new Array(centroids.length);
        for (var i = 0; i < centroids.length; i++) {
            var x = centroidScale(centroids[i].x) - xCentroid;
            var y = centroidScale(centroids[i].y) - yCentroid;
            var z = centroidScale(centroids[i].z) - zCentroid;
            newCentroids[i] = new THREE.Vector3(x,y,z);
        }
        return newCentroids;
    };

    // compute the edges for a specific topology
    this.computeEdgesForTopology = function (topology) {
        console.log("Computing edges for " + topology);
        var nNodes = connectionMatrix.length;
        edges = [];
        for (var i = 0; i < nNodes; i++) {
            for (var j = i+1; j < nNodes; j++) {
                if (Math.abs(connectionMatrix[i][j]) > 0) {
                    var edge = [];
                    edge.push(centroids[topology][i]);
                    edge.push(centroids[topology][j]);
                    edges.push(edge);
                }
            }
        }

    }
}

var modelLeft = new Model();
var modelRight = new Model();