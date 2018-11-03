/*eslint-disable no-unused-lets*/
/*global $*/
'use strict';

import {
    parseDataJSON,
    parseMetadataJSON,
    parseTSNEData
} from './load-data.js';

import {
    initSamplingStrategy
} from './sampling-strategy.js';

import {
    initTimeSeries
} from './timeseries.js';

import {
    initMetadata
} from './metadata.js';

import {
    initTSNE
} from './tsne.js';

import '../css/style.css';

import {
    getData,
    getMetaData,
    getDataMeasurements,
    getTSNEData
} from './data.js';

import './statistics.js';

$(document).ready(function() {
    let path = './data/data.json';
    parseDataJSON(path);
    path = './data/metadata.json';
    parseMetadataJSON(path);
    path = './data/tsne_data3.csv';
    parseTSNEData(path);

    initVis();
});

/**
 * Init the visualizations
 */
function initVis() {
    setTimeout(function() {
        if (getData() && getMetaData() && getDataMeasurements() && getTSNEData()) {
            // init the different visualizations after the
            // succesfully loading the data
            // console.log(data);
            // console.log(metadata);
            // console.log(dataMeasurements);
            initSamplingStrategy('#sampling-stragety-div');
            initTimeSeries();
            initTSNE('#t-sne-vis');
            initMetadata();
            return;
        }
        initVis();
    }, 500);
}