/**
 * Created by Johnson on 11/10/2016.
 */

// https://en.wikipedia.org/wiki/Platonic_solid
/**
 * A class that returns the vertices and faces of a Platonic shape. The shape can be a tetrahedron, cube,
 * octahedron, dodecahedron or an icosahedron having 4, 6, 8, 12 and 20 faces respectively.
 * @constructor
 */
function Platonics() {

    var vertices = [];
    var faces = [];
    var numberOfVerticesPerFace = 0;

    this.getVertices = function() { return vertices; };
    this.getFaces = function() { return faces; };
    this.getNumberOfFaces = function() { return faces.length; };
    this.getNumberOfVerticesPerFace = function() { return  numberOfVerticesPerFace;};

    this.getFace = function(i) {
        var face = new Array(numberOfVerticesPerFace, new Array(3));
        for (var j = 0; j < numberOfVerticesPerFace; j++) {
            face[j] = vertices[faces[i][j]];
        }
        return face;
    };

    this.createTetrahedron = function() {

        vertices = [[0, 0, 0],
                    [1, 1, 0],
                    [1, 0, 1],
                    [0, 1, 1]];
        faces = [[0, 1, 2],
                 [0, 2, 3],
                 [0, 3, 1],
                 [3, 2, 1]];

        numberOfVerticesPerFace = 3;
        centerAndNormalize();
    };

    this.createCube = function() {

        vertices = [[0,	0, 0],
                    [1,	0, 0],
                    [0,	1, 0],
                    [1,	1, 0],
                    [0,	0, 1],
                    [1,	0, 1],
                    [0,	1, 1],
                    [1,	1, 1]];

        faces = [[0, 2, 3, 1],
                 [4, 5, 7, 6],
                 [1, 3, 7, 5],
                 [0, 4, 6, 2],
                 [0, 1, 5, 4],
                 [2, 6, 7, 3]];

        numberOfVerticesPerFace = 4;
        centerAndNormalize();
    };

    this.createOctahedron = function() {

        vertices = [[1, 0, 0],
                    [0, 1, 0],
                    [-1, 0, 0],
                    [0, -1, 0],
                    [0, 0, 1],
                    [0, 0, -1]];

        faces = [[0, 1, 4],
                 [1, 2, 4],
                 [2, 3, 4],
                 [3, 0, 4],
                 [0, 5, 1],
                 [1, 5, 2],
                 [2, 5, 3],
                 [0, 3, 5]];

        numberOfVerticesPerFace = 3;
        centerAndNormalize();
    };

    this.createDodecahedron = function() {

        vertices = [[-1.0000, -0.3820,       0],
                    [-1.0000,  0.3820,       0],
                    [-0.6180, -0.6180, -0.6180],
                    [-0.6180, -0.6180,  0.6180],
                    [-0.6180,  0.6180, -0.6180],
                    [-0.6180,  0.6180,  0.6180],
                    [-0.3820,       0, -1.0000],
                    [-0.3820,       0,  1.0000],
                    [      0, -1.0000, -0.3820],
                    [      0, -1.0000,  0.3820],
                    [      0,  1.0000, -0.3820],
                    [      0,  1.0000,  0.3820],
                    [ 0.3820,       0, -1.0000],
                    [ 0.3820,       0,  1.0000],
                    [ 0.6180, -0.6180, -0.6180],
                    [ 0.6180, -0.6180,  0.6180],
                    [ 0.6180,  0.6180, -0.6180],
                    [ 0.6180,  0.6180,  0.6180],
                    [ 1.0000, -0.3820,       0],
                    [ 1.0000,  0.3820,       0]];

        faces =[[13, 17, 11,  5,  7],
                [ 7,  3,  9, 15, 13],
                [12, 14,  8,  2,  6],
                [ 6,  4, 10, 16, 12],
                [10, 11, 17, 19, 16],
                [11, 10,  4,  1,  5],
                [ 8,  9,  3,  0,  2],
                [ 9,  8, 14, 18, 15],
                [19, 17, 13, 15, 18],
                [18, 14, 12, 16, 19],
                [ 1,  4,  6,  2,  0],
                [ 0,  3,  7,  5,  1]];

        numberOfVerticesPerFace = 5;
        centerAndNormalize();
    };

    this.createIcosahedron = function() {

        vertices = [[      0,       0,      0],
                    [ 0.8507,       0, 0.5257],
                    [ 0.2629,  0.8090, 0.5257],
                    [-0.6882,  0.5000, 0.5257],
                    [-0.6882, -0.5000, 0.5257],
                    [ 0.2629, -0.8090, 0.5257],
                    [ 0.6882,  0.5000, 1.3764],
                    [-0.2629,  0.8090, 1.3764],
                    [-0.8507,  0.0000, 1.3764],
                    [-0.2629, -0.8090, 1.3764],
                    [ 0.6882, -0.5000, 1.3764],
                    [      0,       0, 1.9021]];

        faces =[[0, 2, 1],
                [0, 3, 2],
                [0, 4, 3],
                [0, 5, 4],
                [0, 1, 5],
                [1, 2, 6],
                [2, 3, 7],
                [3, 4, 8],
                [4, 5, 9],
                [5, 1, 10],
                [6, 2, 7],
                [7, 3, 8],
                [8, 4, 9],
                [9, 5, 10],
                [10, 1, 6],
                [6, 7, 11],
                [7, 8, 11],
                [8, 9, 11],
                [9, 10, 11],
                [10, 6, 11]];

        numberOfVerticesPerFace = 3;
        centerAndNormalize();
    };

    centerAndNormalize = function() {
        var vCentroid = math.mean(vertices,0);
        for (var i=0; i<vertices.length; i++) {
            vertices[i] = math.subtract(vertices[i], vCentroid);
            vertices[i] = math.divide(vertices[i], math.norm(vertices[i]));
        }
    }
}