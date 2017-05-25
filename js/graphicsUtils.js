/**
 * Created by giorgioconte on 26/02/15.
 */

var shpereRadius = 3.0;             // normal sphere radius
var sphereResolution = 12;
var dimensionFactor = 1;

var sphereNormal = new THREE.SphereGeometry( shpereRadius, sphereResolution, sphereResolution);
var boxNormal = new THREE.BoxGeometry( 1.5*shpereRadius, 1.5*shpereRadius, 1.5*shpereRadius);

// create normal edge geometry: sphere or cube
getNormalGeometry = function(hemisphere) {
    if(hemisphere == "left"){
        return sphereNormal;
    } else if(hemisphere == "right"){
        return boxNormal;
    }
};

// scaling the glyphs
setDimensionFactor = function(value){

    var val = 1/dimensionFactor*value;
    sphereNormal.scale(val, val, val);
    boxNormal.scale(val, val, val);

    dimensionFactor = value;
};

// return the material for a node (vertex) according to its state: active or transparent
getNormalMaterial = function(model, group) {
    var material, opacity = 1.0;
    switch (model.getRegionState(group)){
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
    material = new THREE.MeshPhongMaterial({
        color: scaleColorGroup(model, group),
        shininess: 50,
        transparent: true,
        specular: 0x222222,
        reflectivity:1.3,
        opacity: opacity
    });
    return material;
};

/**
 * Distribute n points uniformly on a circle
 * @param n     number of points
 * @param R     radius of the circle
 * @param c     center of the circle in 3D
 * @param v1    unit vector in the plane containing the circle
 * @param v2    unit vector in the plane containing the circle
 * @returns {*} array of the coordinates of the points
 */
sunflower = function(n, R, c, v1, v2) {
    var alpha = 2;
    var b = Math.round(alpha*Math.sqrt(n));      // number of boundary points
    var phi = (Math.sqrt(5)+1)/2;           // golden ratio
    var k = math.range(1,n+1);
    var theta = math.multiply(k, (2*Math.PI)/(phi*phi));
    var r = math.divide(math.sqrt(math.add(k,-0.5)), Math.sqrt(n-(b+1)/2));
    var idx = math.larger(k, n-b);
    // r( k > n-b ) = 1; % put on the boundary
    r = math.add(math.dotMultiply(r, math.subtract(1,idx)),idx);
    var tmp1 = math.dotMultiply(math.cos(theta),r);
    var tmp2 = math.dotMultiply(math.sin(theta),r);
    var points = [math.add(math.add(math.multiply(tmp1,v1[0]*R), math.multiply(tmp2,v2[0]*R)), c[0]),
                  math.add(math.add(math.multiply(tmp1,v1[1]*R), math.multiply(tmp2,v2[1]*R)), c[1]),
                  math.add(math.add(math.multiply(tmp1,v1[2]*R), math.multiply(tmp2,v2[2]*R)), c[2])];
    return math.transpose(points);
};