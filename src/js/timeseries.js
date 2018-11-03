/*eslint-disable no-unused-lets*/
/*global d3, $*/
'use strict';

import {
    getMetaData,
    getTimeSeriesData,
    getCurrentMinMax,
    setCurrentMinMax
} from './data.js';



let headerSelector = '#time-series-div .card-header';
let mainSelector = '#time-series-div .card-body';
let svg, g;


let ordinalColorScheme;
let x, x2, y, xAxis, yAxis, gXaxis, gYaxis; //  define scales and axis
let measurement = '';


let width,
    height,
    margin = {
        top: 10,
        right: 10,
        bottom: 10,
        left: 70
    };

/**
 * Initialize the div with the svg element
 */
export function initTimeSeries() {

    // get data
    let metadata = getMetaData();

    // get dimensions
    width = $(mainSelector).width();
    height = 250; // $(mainSelector).height() || 300;

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
    svg = d3.select(mainSelector)
        .classed('svg-container', true)
        // to make it responsive with css
        .append('svg')
        .attr('height', height)
        .attr('width', width)
        .call(zoom);

    width = width * 0.9;
    height = height * 0.9;

    // append a group for the elements
    g = svg.append('g')
        .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

    // // create scales and axis
    x = d3.scaleTime().domain(getCurrentMinMax()).range([0, width]);
    x2 = d3.scaleTime().domain(getCurrentMinMax()).range([0, width]);

    y = d3.scaleLinear().range([height, 0]).domain([0, 1]);

    xAxis = d3.axisBottom(x).tickSize(0);
    yAxis = d3.axisLeft(y).tickSize(0);

    ordinalColorScheme = d3.scaleOrdinal(d3.schemeCategory10);
    ordinalColorScheme.domain(metadata.locations);

    gXaxis = g.append('g')
        .attr('class', 'axis x-axis')
        .attr('transform', 'translate(0,' + height + ')')
        .call(xAxis);

    gYaxis = g.append('g')
        .attr('class', 'axis axis--y')
        .call(yAxis);
}

/**
 * Update the line chart with the measurement
 * @param {String} measurement - chemical measurement
 */
export function updateTimeSeries(m) {
    if (m) {
        measurement = m;
    }

    // update the x scaling
    x.domain(getCurrentMinMax());
    // change the header
    $(headerSelector).html('Time series: ' + measurement);

    let filteredData = [];
    if (measurement !== '') {
        filteredData = getTimeSeriesData(measurement);
    }

    let yMin = d3.min(filteredData, function(d) {
        return d['value'];
    });
    if (yMin > 0) {
        yMin = 0;
    }

    let yMax = d3.max(filteredData, function(d) {
        return d['value'];
    });

    y.domain([yMin, yMax]);

    // DATA JOIN -- sampling circles
    let circles = g.selectAll('circle')
        .data(filteredData);
    // UPDATE -- sampling circles
    circles
        .enter().append('circle')
        .merge(circles)
        .attr('r', 5)
        .attr('cx', function(d) {
            return x(d['date']);
        })
        .attr('cy', function(d) {
            return y(d['value']);
        })
        .attr('class', function(d) {
            return 'c-' + d['location'] + '-' + d['date'].getFullYear() + d['date'].getMonth() + d['date'].getDate();
        })
        .style('fill', function(d) {
            return ordinalColorScheme(d['location']);
        })
        .style('stroke', '#737373')
        .style('stroke-width', 0.5)
        // .style('opacity', function(d) {
        //     opacityScale(d['value']);
        // })
        .on('mouseover', function(d) {
            d3.selectAll('.c-' + d['location'] + '-' + d['date'].getFullYear() + d['date'].getMonth() + d['date'].getDate())
                .attr('r', 20)
                .style('stroke', '#737373')
                .style('stroke-width', 2);
            for (let key in d) {
                $('#metadata-info').append('<span class="badge badge-dark">' + key + ': ' + d[key] + '</span>');
            }
        })
        .on('mouseout', function(d) {
            d3.selectAll('.c-' + d['location'] + '-' + d['date'].getFullYear() + d['date'].getMonth() + d['date'].getDate())
                .attr('r', 4)
                .style('stroke', '#737373')
                .style('stroke-width', 0.5);
            $('#metadata-info').empty();
        });
    // .on('click', function(d) {
    //     // console.log(d);
    //     // if (typeof d['measurements'] === 'object') {
    //     //     let selected = Object.keys(d['measurements']);
    //     //     $('#metadata-measurements').selectpicker('val', selected);
    //     // }
    // });

    // EXIT
    circles.exit().remove();

    gXaxis.call(xAxis);
    gYaxis.call(yAxis);

}