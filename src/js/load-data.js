/*eslint-disable no-unused-lets*/
/*global d3*/
'use strict';

import {
    setData,
    setMetaData,
    setTSNEData
} from './data.js';

/**
 * Parse the data and load it into the data object
 * @param {String} path - path to json file
 */
export function parseDataJSON(path) {
    d3.json(path).then(function(d) {
        setData(d);
    }, function() {
        alert('Could not load input json for the data');
    });
}

/**
 * Parse the meta data and load it into the meta data object
 * @param {String} path - path to json file
 */
export function parseMetadataJSON(path) {
    d3.json(path).then(function(d) {
        // console.log(d);
        setMetaData(d);
    }, function() {
        alert('Could not load input json for the metadata');
    });
}

/**
 * Parse the tsne data and load it into the tsne object
 * @param {String} path - path to json file
 */
export function parseTSNEData(path) {
    d3.csv(path)
        .then(function(tsne) {
            let dateparser = d3.timeParse('%Y-%m-%d');

            tsne.forEach(function(d) {
                d['date'] = dateparser(d['date']);
                d.x = +d.x;
                d.y = +d.y;
            });
            setTSNEData(tsne);
        });

}