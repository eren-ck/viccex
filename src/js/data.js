/*eslint-disable no-unused-lets*/
/*global $, d3*/
'use strict';

import {
    draw
} from './sampling-strategy';

import {
    updateTimeSeries
} from './timeseries.js';

import {
    updateTSNE
} from './tsne.js';

let data; // the basic data with the extracted features
let metadata; // basic metadata - see metadata json file
let dataMeasurements; // measurements per day per location
let tSNEData; // tSNE data

let selectedLocations; // used for filters
let selectedMeasurements;

let currentMinMax; // current min max date of the specific zoom level

/** Getter and Setter ** /

/**
 * Get data variable
 */
export function getData() {
    return data;
}

/**
 * Set the parsed csv data
 */
export function setData(d) {
    data = d;
    // compute for the first time the measurements per day
    updateDataMeasurements();
}

/**
 * Get the metadata
 */
export function getMetaData() {
    return metadata;
}

/**
 * Set the metadata variable
 */
export function setMetaData(d) {
    metadata = d;
    selectedLocations = metadata['locations'];
    selectedMeasurements = Object.keys(metadata['measureUnit']);
    // set min max for the overall time slot
    let parseTime = d3.timeParse('%Y-%m-%d');
    currentMinMax = [parseTime(metadata['date']['min']), parseTime(metadata['date']['max'])];
}

/**
 * Get parsed csv data measurements
 */
export function getDataMeasurements() {
    return dataMeasurements.filter(d => d['date'] >= currentMinMax[0] && d['date'] <= currentMinMax[1]);
}

export function updateDataMeasurements() {
    let tmp_result = {};
    let parseTime = d3.timeParse('%Y-%m-%d');
    // filter using selected Measurements and selected Locations
    let tmpData = Object.keys(data)
        .filter(key => selectedMeasurements.includes(key))
        .reduce((obj, key) => {
            obj[key] = data[key]['values'];
            obj[key] = Object.keys(obj[key])
                .filter(key2 => selectedLocations.includes(key2))
                .reduce((obj2, key2) => {
                    obj2[key2] = obj[key][key2];
                    return obj2;
                }, {});
            return obj;
        }, {});
    // console.log(tmpData);
    // count the number of measurements per day
    for (let key in tmpData) {
        // console.log(key);
        for (let key2 in tmpData[key]) {
            if (!tmp_result.hasOwnProperty(key2)) {
                tmp_result[key2] = {};
            }
            tmpData[key][key2].forEach(function(d) {
                // count number of measurements
                if (!tmp_result[key2].hasOwnProperty(d['time'])) {
                    tmp_result[key2][d['time']] = {};
                    tmp_result[key2][d['time']]['count'] = 0;
                    // add the chemical measurement
                    tmp_result[key2][d['time']]['measurements'] = {};
                    tmp_result[key2][d['time']]['measurements'][key] = [d['value']];
                } else {
                    tmp_result[key2][d['time']]['count']++;
                    // add the chemical measurement
                    if (tmp_result[key2][d['time']]['measurements'].hasOwnProperty(key)) {
                        tmp_result[key2][d['time']]['measurements'][key].push(d['value']);
                    } else {
                        tmp_result[key2][d['time']]['measurements'][key] = [d['value']];
                    }
                }
            });
        }
    }
    // console.log(tmp_result);
    // change data format into list of objects
    let result = [];
    for (let key in tmp_result) {
        for (let key2 in tmp_result[key]) {
            result.push({
                'location': key,
                'date': parseTime(key2),
                'count': tmp_result[key][key2]['count'],
                'measurements': tmp_result[key][key2]['measurements']
            });
        }
    }
    setDataMeasurements(result);
    // console.log(result);
}

/**
 * Get parsed csv data measurements
 */
export function getStatisticData() {
    let stats = [
        'length', 'mean', 'median', 'maximum', 'minimum', 'kurtosis', 'skewness',
        'variance', 'abs_energy', 'mean_change', 'sample_entropy', 'count_above_mean',
        'count_below_mean', 'standard_deviation', 'sum_of_reoccurring_data_points',
        'variance_larger_than_standard_deviation', 'ratio_value_number_to_time_series_length'
    ];
    // filter with the selected measurements and locations
    let tmp_result = {};
    for (let key in data) {
        if (selectedMeasurements.includes(key)) {
            tmp_result[key] = {};
            stats.forEach(function(d) {
                let stat = data[key]['features_w_null_relevant'][d];
                // filter the locations which are not selected
                stat = Object.keys(stat)
                    .filter(key2 => selectedLocations.includes(key2))
                    .reduce((obj, key2) => {
                        obj[key2] = stat[key2];
                        return obj;
                    }, {});
                tmp_result[key][d] = stat;
            });
        }
    }
    // change data format
    let tmp_result2 = {};
    for (let key in tmp_result) { // key = measurement
        tmp_result2[key] = {};
        for (let key2 in tmp_result[key]) { // extracted statistic
            for (let key3 in tmp_result[key][key2]) { // extracted statistic
                if (key3 in tmp_result2[key]) {
                    tmp_result2[key][key3][key2] = tmp_result[key][key2][key3];
                } else {
                    tmp_result2[key][key3] = {};
                    tmp_result2[key][key3][key2] = tmp_result[key][key2][key3];
                }
            }
        }
    }
    // change the data format again to a array of arrays
    let result = [];
    for (let key in tmp_result2) {
        for (let key2 in tmp_result2[key]) {
            let tmp_array = [key, key2];
            stats.forEach(function(d) {
                tmp_array.push(tmp_result2[key][key2][d]);
            });
            result.push(tmp_array);
        }
    }
    return result;
}


/**
 * Get parsed csv data measurements
 * @param {String} measurement - chemical measurement
 */
export function getTimeSeriesData(measurement) {
    let parseTime = d3.timeParse('%Y-%m-%d');
    let result = [];
    for (let key in data[measurement]['values']) {
        data[measurement]['values'][key].forEach(function(d) {
            d['location'] = key;
            d['date'] = parseTime(d['time']);
            result.push(d);
        });
    }
    result = result.filter(d => d['date'] >= getCurrentMinMax()[0] &&
        d['date'] <= getCurrentMinMax()[1] &&
        selectedLocations.includes(d['location']));

    return result;
}
/**
 * Set dataMeasurements variable
 */
export function setDataMeasurements(d) {
    dataMeasurements = d;
    if ($('#sampling-stragety-div > svg').length) {
        draw();
        updateTSNE();
    }
    // console.log(dataMeasurements.length);
}

export function setTSNEData(d) {
    tSNEData = d;
}

export function getTSNEData() {
    let measurementsDates = getDataMeasurements();
    measurementsDates = measurementsDates.map(function(d) {
        return d['date'].getTime();
    });
    // let filterDates = dataMeasurements
    return tSNEData.filter(d => measurementsDates.includes(d['date'].getTime()) &&
        selectedLocations.includes(d['location']));
    // d['date'] >= currentMinMax[0] &&
    // d['date'] <= currentMinMax[1] &&
    // selectedLocations.includes(d['location']) &&

}

/**
 * Get selectedLocations
 */
export function getSelectedLocations() {
    return selectedLocations;
}

/**
 * Set the selectedLocations
 */
export function setSelectedLocations(d) {
    selectedLocations = d;
    // compute for the first time the measurements per day
    updateDataMeasurements();
    if (!$('#time-series-div').hasClass('d-none')) {
        updateTimeSeries();
    }
}

/**
 * Get selectedMeasurements
 */
export function getSelectedMeasurements() {
    return selectedMeasurements;
}

/**
 * Set the selectedMeasurements
 */
export function setSelectedMeasurements(d) {
    selectedMeasurements = d;
    // compute for the first time the measurements per day
    updateDataMeasurements();
}

/**
 * Get currentMinMax
 */
export function getCurrentMinMax() {
    return currentMinMax;
}

/**
 * Set the currentMinMax
 */
export function setCurrentMinMax(d) {
    currentMinMax = d;
    // draw the sampling strategy vis
    draw();
    updateTSNE();
    // check if time series is visible and update
    if (!$('#time-series-div').hasClass('d-none')) {
        updateTimeSeries();
    }
}