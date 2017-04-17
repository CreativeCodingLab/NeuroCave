


var updateNeeded = true;

function PriorityQueue () {
    this._nodes = [];

    this.enqueue = function (priority, key) {
        this._nodes.push({key: key, priority: priority });
        this.sort();
    };
    this.dequeue = function () {
        return this._nodes.shift().key;
    };
    this.sort = function () {
        this._nodes.sort(function (a, b) {
            return a.priority - b.priority;
        });
    };
    this.isEmpty = function () {
        return !this._nodes.length;
    };
}

/**
 * Pathfinding starts here
 */
function Graph() {
    var INFINITY = 1/0;
    var vertices = [];
    var hierarchy = [];                 // the hierarchy map to reach every node from the rootNode, each level of nodes are grouped
    var previousMap = [];               // the index of the previous node in the shortest path in order to reach the rootNode
                                        // into an array, the furthest set of nodes are the last array = largest number of hops
    var rootNode = null;                // selected node


    // method to add vertices to graph
    this.addVertex = function(index, edges){
        vertices[index] = edges;
    };

    // compute shortest path from a start node to the rest of the nodes
    this.shortestPath = function (start) {
        var nodes = new PriorityQueue(),
            distances = [],
            previous = [],
            smallest, vertex, neighbor, alt;

        for(vertex in vertices) {
            if(vertex === start) {
                distances[vertex] = 0;
                nodes.enqueue(0, vertex);
            }
            else {
                distances[vertex] = INFINITY;
                nodes.enqueue(INFINITY, vertex);
            }

            previous[vertex] = null;
        }

        while(!nodes.isEmpty()) {
            smallest = nodes.dequeue();

            for(neighbor in vertices[smallest]) {
                alt = distances[smallest] + vertices[smallest][neighbor];

                if(alt < distances[neighbor]) {
                    distances[neighbor] = alt;
                    previous[neighbor] = parseInt(smallest);
                    nodes.enqueue(alt, neighbor);
                }
            }
        }
        previousMap = previous;
        rootNode = start;
        this.setHierarchy(rootNode);
        return distances;
    };

    this.getPreviousMap = function () {
        return previousMap;
    };

    this.setHierarchy = function(root){
        hierarchy = [];
        var el = [];
        hierarchy[0] = [];
        hierarchy[0].push(parseInt(root));

        for(var k=0; k < hierarchy.length; k++){
            el = [];
            for(var i=0; i < hierarchy[k].length; i++) {

                for (var j in previousMap) {
                    if (previousMap[j] == hierarchy[k][i]) {
                        el[el.length] = parseInt(j);
                    }
                }
            }
            if (el.length > 0) {
                hierarchy[hierarchy.length] = el;
            }
        }
    };

    this.getHierarchy = function(rootIndex){
        if(rootNode && rootNode == rootIndex){
            return hierarchy;
        }
        this.shortestPath(String(rootIndex));
        return hierarchy;
    };

    this.getMaxNumberOfHops = function () {
        return (hierarchy) ? hierarchy.length : 0;
    }
}
