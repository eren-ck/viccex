/*eslint-disable no-unused-lets*/
/*global d3, $*/
'use strict';

import {
    getDataMeasurements,
    getMetaData,
    getCurrentMinMax,
    setCurrentMinMax
} from './data.js';

let svg, g; // svg for the sampling strategy vis
let x, x2, y, xAxis, yAxis, gXaxis; //  define scales and axis
let data;

let width, height,
    margin = {
        top: 10,
        right: 10,
        bottom: 10,
        left: 70
    };

// static color mapping to the d3.schemeCategory10 -
// making it independet of the order of objects
let ordinalColorScheme = d3.scaleOrdinal(d3.schemeCategory10);

let globalScale;
let localScales = {};

/**
 * Initialize the div with the svg element
 * @param {String} domSelector - To which svg to append the svg
 */
export function initSamplingStrategy(domSelector) {
    // console.log(domSelector);
    width = $(domSelector).width() - margin.left;
    height = 250; // $(domSelector).height() * 0.8 - margin.bottom;

    // init the zoom
    let zoom = d3.zoom()
        .scaleExtent([1, 100])
        .translateExtent([
            [0, 0],
            [width, height]
        ])
        .extent([
            [0, 0],
            [width, height]
        ])
        .on('zoom', function() {
            let t = d3.event.transform;
            // change scaling function
            setCurrentMinMax(t.rescaleX(x2).domain());
        });

    // create the svg
    svg = d3.select(domSelector)
        .classed('svg-container', true)
        // to make it responsive with css
        .append('svg')
        .attr('height', height)
        .attr('width', width)
        .call(zoom);

    // append a group for the elements
    g = svg.append('g')
        .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

    width = width * 0.9;
    height = height * 0.9;

    // get min max
    let metadata = getMetaData();
    // get ordinal values for y axis
    let yDomain = metadata['locations'];

    // define the scales
    x = d3.scaleTime().domain(getCurrentMinMax()).range([0, width]);
    x2 = d3.scaleTime().domain(getCurrentMinMax()).range([0, width]);
    y = d3.scalePoint().domain(yDomain).range([0, height - 10]);

    xAxis = d3.axisBottom(x).tickSize(0);
    yAxis = d3.axisLeft(y).tickSize(0);

    // append the axis
    gXaxis = g.append('g')
        .attr('class', 'axis x-axis')
        .attr('transform', 'translate(0,' + height + ')')
        .call(xAxis);

    g.append('g')
        .attr('class', 'axis axis--y')
        .call(yAxis);


    // get the data
    data = getDataMeasurements();

    // define global and local opacity scales for the coloring of the circle
    // console.log(data);
    let globalMinMaxCount = [d3.min(data, function(d) {
            return d['count'];
        }),
        d3.max(data, function(d) {
            return d['count'];
        })
    ];
    // the global scale
    globalScale = d3.scaleLinear()
        .domain(globalMinMaxCount)
        .range([0.2, 1]);

    // the local scales
    let localMinMax = {};
    data.forEach(function(d) {
        if (!(d['location'] in localMinMax)) {
            localMinMax[d['location']] = [d['count'], d['count']];
        }
        if (d['count'] < localMinMax[d['location']][0]) {
            localMinMax[d['location']][0] = d['count'];
        }
        if (d['count'] > localMinMax[d['location']][1]) {
            localMinMax[d['location']][1] = d['count'];
        }
    });

    for (let key in localMinMax) {
        localScales[key] = d3.scaleLinear()
            .domain(localMinMax[key])
            .range([0.2, 1]);
    }
    // define the color scheme
    ordinalColorScheme.domain(metadata['locations']);

    draw();
}



/**
 * Draw function
 */
export function draw() {
    data = getDataMeasurements();
    // preprocess the data correctly

    let binnedData = [];
    // aggregate to 100 circles per x-axis
    // console.log($('#sampling-stragety-aggregate-buttons').hasClass('active'));
    if ($('#sampling-stragety-aggregate-buttons').hasClass('active')) {
        binnedData = binData(data, 50);
    } else {
        binnedData = data;
    }

    // update the x scaling
    x.domain(getCurrentMinMax());

    // DATA JOIN -- sampling circles
    let samplingCircles = g.selectAll('circle')
        .data(binnedData);
    // UPDATE -- sampling circles
    samplingCircles
        .enter().append('circle')
        .merge(samplingCircles)
        .attr('r', 5)
        .attr('cx', function(d) {
            return x(d['date']);
        })
        .attr('cy', function(d) {
            return y(d['location']);
        })
        .attr('class', function(d) {
            return 'c-' + d['location'] + '-' + d['date'].getFullYear() + d['date'].getMonth() + d['date'].getDate();
        })
        .style('fill', function(d) {
            return ordinalColorScheme(d['location']);
        })
        .style('opacity', function(d) {
            if ($('#global-scale').is(':checked')) {
                return globalScale(d['count']);
            } else {
                return localScales[d['location']](d['count']);
            }
        })
        .style('stroke', '#737373')
        .style('stroke-width', 0.5)
        .on('mouseover', function(d) {
            d3.selectAll('.c-' + d['location'] + '-' + d['date'].getFullYear() + d['date'].getMonth() + d['date'].getDate())
                .attr('r', 20)
                .style('stroke', '#737373')
                .style('stroke-width', 2);
            let measurements = d['measurements'];
            if (typeof measurements === 'object') {

                for (let key in measurements) {
                    $('#metadata-info').append('<span class="badge badge-dark">' + key + ': ' + measurements[key].join(' ; ') + '</span>');
                }
            } else {
                $('#metadata-info').append('<span class="badge badge-dark">' + measurements + '</span>');
            }
        })
        .on('mouseout', function(d) {
            d3.selectAll('.c-' + d['location'] + '-' + d['date'].getFullYear() + d['date'].getMonth() + d['date'].getDate())
                .attr('r', 4)
                .style('stroke', '#737373')
                .style('stroke-width', 0.5);
            $('#metadata-info').empty();
        })
        .on('click', function(d) {
            if (typeof d['measurements'] === 'object') {
                let selected = Object.keys(d['measurements']);
                $('#metadata-measurements').selectpicker('val', selected);
            }
        });

    // EXIT
    samplingCircles.exit().remove();

    // update x axis
    gXaxis.call(xAxis);
}

/**
 * Jquery on change listeners
 * Update from global to local scale and vise versa
 */
$('#sampling-stragety-scale-buttons :input').change(function() {
    draw();
});

/**
 * Jquery on change listeners
 * Update change from aggregated version to all version
 */
$('#sampling-stragety-aggregate-buttons').on('click', function() {
    // two toggles are just a fix - change code
    $('#sampling-stragety-aggregate-buttons').toggleClass('active');
    draw();
    $('#sampling-stragety-aggregate-buttons').toggleClass('active');

});

/**
 * Bin the data by the zoom level
 * @param {array} dat - Array of objects
 * @param {number} max - maximum number of elements per axis
 */
function binData(filteredData, max) {
    let result = [];
    // group by location
    let grouped = groupBy(filteredData, 'location');
    // aggregate and average the objects
    for (let key in grouped) {
        // if the group has more than max elements
        if (grouped[key].length > max) {
            let ratio = Math.ceil(grouped[key].length / max);
            // sort the subgroup by the date
            let sortedTmp = grouped[key].sort(function(a, b) {
                if (a['date'] < b['date']) {
                    return -1;
                }
                if (a['date'] > b['date']) {
                    return 1;
                }
                return 0;
            });
            // temp element needed to store max elements and aggregate these elements
            let tmp = [sortedTmp[0]];
            // aggregate and average
            for (let i = 1; i < sortedTmp.length; i++) {
                if (i % ratio === 0) {
                    result.push(aggregateMean(tmp));
                    tmp = [];
                } else {
                    tmp.push(sortedTmp[i]);
                }
            }
            if (tmp.length) {
                result.push(aggregateMean(tmp));
            }
        }
        // less than max elements therefore no binning is needed
        else {
            result = result.concat(grouped[key]);
        }
    }
    return result;
}

/**
 * Helper function to group an array of objects by a key
 * @param {array} xs
 * @param {string} key
 */
function groupBy(xs, key) {
    return xs.reduce(function(rv, x) {
        (rv[x[key]] = rv[x[key]] || []).push(x);
        return rv;
    }, {});
}

/**
 * Helper function to aggregate and average an array of objects
 */
function aggregateMean(d) {
    let location = d[0]['location'];
    // average date with a d3 scale
    let date = d3.scaleTime().domain([0, 1]).range([d[0]['date'], d[d.length - 1]['date']])(0.5);
    // aggregate and average the number of countes elements
    let count = d.reduce((p, c) => p + c['count'], 0) / d.length;
    return {
        'location': location,
        'date': date,
        'count': count,
        'measurements': 'This sample object is aggregated'
    };
}