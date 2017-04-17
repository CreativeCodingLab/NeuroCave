/**
 * Created by giorgioconte on 16/04/15.
 */

// TODO fix all upload buttons 
var uploadTopology = function (model) {
    console.log("I am here");
    var f;
    switch (model) {
        case (modelLeft):
            f = document.getElementById("topologyLeft");
            console.log("I am here left");
            break;
        case (modelRight):
            f = document.getElementById("topologyRight");
            console.log("I am here right");
            break;
        }

    if (f.files && f.files[0]) {
        var reader = new FileReader();

        reader.onload = function (e) {
            var v = e.target.result;
            Papa.parse(v, {
                    download: true,
                    delimiter: ",",
                    dynamicTyping: true,
                    header: false,
                    complete: function (results) {
                        model.setTopology(results.data);
                        d3.select('#topologyBtn').attr('class','load');
                        dhtmlx.message("Topology Uploaded");
                    }
                }
            )
        };
        reader.readAsDataURL(f.files[0]);
    }
};

uploadNormalConnections = function (model) {
    var f = document.getElementById("anatomyConnections");
    if (f.files && f.files[0]) {
        var reader = new FileReader();
        reader.onload = function (e) {
            var v = e.target.result;
            Papa.parse(v, {
                    download: true,
                    dynamicTyping: true,
                    delimiter: ',',
                    header: false,
                    complete: function (results) {
                        model.setConnectionMatrix(results);
                        d3.select('#connectionsBtn').attr('class','load');
                        dhtmlx.message("Adjacency Matrix Uploaded");
                    }
                }
            )
        };
        reader.readAsDataURL(f.files[0]);
    }
};

var uploadCustomMetric = function (model) {
    var f = document.getElementById("customMetric");
    if (f.files && f.files[0]) {
        var reader = new FileReader();
        reader.onload = function (e) {
            var v = e.target.result;
            Papa.parse(v, {
                    download: true,
                    delimiter: ",",
                    dynamicTyping: true,
                    complete: function (results) {
                        model.setMetricValues(results);
                        metric = true;
                        d3.select('#customMetricBtn').attr('class','load');
                        dhtmlx.message("Custom Metric Uploaded");
                    }
                }
            )
        };

        reader.readAsDataURL(f.files[0]);
    }
};

var start = function () {
   queue()
       .defer(store)
       .awaitAll(function(){
           var vr = getTechnology();
           document.location.href = 'visualization.html?dataset=null&vr='+vr+'&load=1&metric='+metric;
       });
};


var store = function(callback){
    localStorage.setItem("labelKeys", JSON.stringify(labelKeys));
    localStorage.setItem("centroids", JSON.stringify(centroids));
    localStorage.setItem("normal",JSON.stringify(connectionMatrix['normal']));
    localStorage.setItem("metricValues",JSON.stringify(metricValues));
   // localStorage.setItem("isomap",JSON.stringify(connectionMatrix['isomap']));
    callback(null,null);
};

var getTechnology = function () {
    if( $('#desktop').is(':checked') ){
        return 0;
    }
    if( $('#oculusv1').is(':checked') ){
        return 1;
    }
    if( $('#oculusv2').is(':checked') ){
        return 2;
    }
};

