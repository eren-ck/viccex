/*eslint-disable no-unused-lets*/
/*global d3, $*/
'use strict';

import {
    getMetaData,
    getTSNEData,
    getCurrentMinMax
} from './data.js';

let svg, g;

let width,
    height,
    margin = {
        top: 30,
        right: 10,
        bottom: 10,
        left: 70
    };


let ordinalColorScheme = d3.scaleOrdinal(d3.schemeCategory10);

let x, x2, y, y2, timeScale; //  define scales and axis

/**
 * Initialize the div with the svg element
 * @param {String} domSelector - To which svg to append the svg
 */
export function initTSNE(domSelector) {
    // get data
    let metadata = getMetaData();
    // get dimensions
    width = $(domSelector).width();
    height = 500; // $(mainSelector).height() || 300;

    let zoom = d3.zoom()
        .scaleExtent([1, 10])
        .translateExtent([
            [0, 0],
            [width * 0.9, height * 0.9]
        ])
        .extent([
            [0, 0],
            [width * 0.9, height * 0.9]
        ])
        .on('zoom', function() {
            x = d3.event.transform.rescaleX(x2);
            y = d3.event.transform.rescaleY(y2);
            // change scaling function
            updateTSNE();
        });

    // create the svg
    svg = d3.select(domSelector)
        .attr('id', 'viscontainer')
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

    let data = getTSNEData();

    x = d3.scaleLinear()
        .range([0, width]).domain([
            d3.min(data, function(d) {
                return d['x'];
            }),
            d3.max(data, function(d) {
                return d['x'];
            })
        ]);

    x2 = d3.scaleLinear()
        .range([0, width]).domain([
            d3.min(data, function(d) {
                return d['x'];
            }),
            d3.max(data, function(d) {
                return d['x'];
            })
        ]);

    y = d3.scaleLinear()
        .range([0, height])
        .domain([
            d3.max(data, function(d) {
                return d['y'];
            }),
            d3.min(data, function(d) {
                return d['y'];
            })
        ]);

    y2 = d3.scaleLinear()
        .range([0, height])
        .domain([
            d3.max(data, function(d) {
                return d['y'];
            }),
            d3.min(data, function(d) {
                return d['y'];
            })
        ]);

    // append the axis
    g.append('g')
        .attr('class', 'axis x-axis')
        .attr('transform', 'translate(0,' + height + ')')
        .call(d3.axisBottom(x).ticks(0));

    g.append('g')
        .attr('class', 'axis axis--y')
        .call(d3.axisLeft(y).ticks(0));

    timeScale = d3.scaleTime()
        .domain(getCurrentMinMax())
        .range([0.2, 1]);

    ordinalColorScheme.domain(metadata['locations']);

    updateTSNE();
}


/**
 * Update the tsne
 */
export function updateTSNE() {
    let data = getTSNEData();
    // filter using the zoom scales
    data = data.filter(d => d['x'] >= x.domain()[0] &&
        d['x'] <= x.domain()[1] &&
        d['y'] <= y.domain()[0] &&
        d['y'] >= y.domain()[1]);

    // DATA JOIN -- sampling circles
    let circles = g.selectAll('circle')
        .data(data);
    // UPDATE -- sampling circles
    circles
        .enter().append('circle')
        .merge(circles)
        .attr('r', 3)
        .attr('cx', function(d) {
            return x(d['x']);
        })
        .attr('cy', function(d) {
            return y(d['y']);
        })
        .attr('class', function(d) {
            return 'c-' + d['location'] + '-' + d['date'].getFullYear() + d['date'].getMonth() + d['date'].getDate();
        })
        .style('fill', function(d) {
            return ordinalColorScheme(d['location']);
        })
        .style('opacity', function(d) {
            return timeScale(d[['date']]);
        })
        .style('stroke', '#737373')
        .style('stroke-width', 0.5)
        .on('mouseover', function(d) {
            let selectString = '.c-' + d['location'] + '-' + d['date'].getFullYear() + d['date'].getMonth() + d['date'].getDate();
            d3.selectAll(selectString)
                .attr('r', 20)
                .style('stroke', '#737373')
                .style('stroke-width', 2);
            // append measurement info the info fiv
            if (d3.select('#sampling-stragety-div').select(selectString).data()[0]) {

                let measurements = d3.select('#sampling-stragety-div').select(selectString).data()[0]['measurements'];
                if (typeof measurements === 'object') {

                    for (let key in measurements) {
                        $('#metadata-info').append('<span class="badge badge-dark">' + key + ': ' + measurements[key].join(' ; ') + '</span>');
                    }
                } else {
                    $('#metadata-info').append('<span class="badge badge-dark">' + measurements + '</span>');
                }
            } else {
                $('#metadata-info').append('<span class="badge badge-dark">' + 'They measures are filterecd using the measurement filtering' + '</span>');
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
            let selectString = '.c-' + d['location'] + '-' + d['date'].getFullYear() + d['date'].getMonth() + d['date'].getDate();
            if (d3.select('#sampling-stragety-div').select(selectString).data()[0]) {
                let measurements = d3.select('#sampling-stragety-div').select(selectString).data()[0]['measurements'];

                if (typeof measurements === 'object') {
                    let selected = Object.keys(measurements);
                    $('#metadata-measurements').selectpicker('val', selected);
                }
            }
        });

    // EXIT
    circles.exit().remove();

    // draw lines
    let line = d3.line()
        .x(function(d) {
            return x(d[0]);
        })
        .y(function(d) {
            return y(d[1]);
        });

    let lineData = [];
    g.selectAll('path').remove();
    if ($('#tsne-line-button').hasClass('active')) {
        let grouped = groupBy(data, 'location');
        lineData = {};
        // let tmp = {}
        for (let key in grouped) {
            grouped[key].forEach(function(d) {
                if (key in lineData) {
                    lineData[key]['points'].push([d['x'], d['y']]);
                } else {
                    lineData[key] = {
                        'location': key,
                        'points': [
                            [d['x'], d['y']]
                        ]
                    };
                }
            });
        }
        lineData = Object.values(lineData);
        g.selectAll('path')
            .data(lineData)
            .enter().append('path')
            .attr('class', 'timeline')
            .attr('d', function(d) {
                return line(d['points']);
            })
            .style('stroke', function(d) {
                return ordinalColorScheme(d['location']);
            });
    }

    // update x axis
}

/**
 * Jquery on change listeners
 * Update change from tsne draw line
 */
$('#tsne-line-button').on('click', function() {
    // two toggles are just a fix - change code
    $('#tsne-line-button').toggleClass('active');
    updateTSNE();
    $('#tsne-line-button').toggleClass('active');
});

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