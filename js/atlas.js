/**
 * Created by Johnson on 2/27/2017.
 */



/*
     set the Atlas look up table from loaded data for each node label
     for each label we have:
     label#: label number in the Atlas (mandatory)
     group: anatomical grouping : lobe name (mandatory)
     region_name: region name (mandatory)
     hemisphere: left or right (mandatory)
     place: embeddness (optional)
     rich_club: rich club affiliation: region name vs non-RichClub (optional)
 */
import {sphereResolution,getSphereResolution,setSphereResolution} from "./graphicsUtils";

function Atlas(data) {

    var lut = {};
    var colorCodingGroups = [];

    var setLut = function (d) {
        // make sure the mandatory fields exist
        var temp = ["label", "Anatomy", "region_name", "hemisphere"];
        var fields = [];
        for (var key in d.data[0])
            fields.push(key);
        for (var i = 0; i < temp.length; ++i) {
            if (fields.indexOf(temp[i]) == -1)
                console.log("Missing mandatory field in Atlas data: " + temp[i]);
        }
        colorCodingGroups = fields;
        // take out label, region_name and hemisphere
        // for (var i = colorCodingGroups.length-1; i > -1; --i) {
        //     if (colorCodingGroups[i] == "label" || colorCodingGroups[i] == "region_name" || colorCodingGroups[i] ==  "hemisphere")
        //         colorCodingGroups.remove(i);
        // }

        colorCodingGroups = colorCodingGroups.filter(val => val !== "label");
        colorCodingGroups = colorCodingGroups.filter(val => val !== "region_name");
        colorCodingGroups = colorCodingGroups.filter(val => val !== "hemisphere");

        // store data
        var el;
        for (var i = 0; i < d.data.length; ++i) {
            el = d.data[i];
            el.visibility = true;
            lut[d.data[i].label] = el;
        }
        setSphereResolution((d.data.length < 1000) ? 12 : (d.data.length < 2000) ? 8 : 4);
    };


    // get the region of a specific node (edge)
    this.getRegion = function (label) {
        return lut[label];
    };

    // get the region name of a specific node (edge)
    this.getRegionName = function (label) {
        return lut[label].name;
    };

    // get the label visibility
    this.getLabelVisibility = function(label) {
        return lut[label].visibility;
    };

    // set the label visibility: label is an index, visibility is boolean
    this.setLabelVisibility = function(label, visibility) {
        if (lut[label] != undefined)
            lut[label].visibility = visibility;
        else {
            console.log("It isn't possible to set visibility of the label");
        }
    };

    this.getGroupsNames = function () {
        return colorCodingGroups;
    };

    // constructor call
    setLut(data);
}

export {Atlas}