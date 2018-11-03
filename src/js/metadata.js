/*eslint-disable no-unused-lets*/
/*global d3, $*/
'use strict';

import {
    getMetaData
} from './data.js';

import {
    setSelectedLocations,
    setSelectedMeasurements
} from './data.js';

let metadata;

// static color mapping to the d3.schemeCategory10 -
// making it independet of the order of objects
let ordinalColorScheme = d3.scaleOrdinal(d3.schemeCategory10);


/**
 * Initialize the div with the svg element
 */
export function initMetadata() {
    metadata = getMetaData();
    ordinalColorScheme.domain(metadata['locations']);

    // append the metadata locations list
    let metadataOptions = metadata['locations'].map(function(d) {
        return '<option>' + d + '</option>';
    }).join();
    $('#metadata-locations')
        .append(metadataOptions)
        .selectpicker('refresh')
        .selectpicker('selectAll');


    // metadataMeasurements
    metadataOptions = Object.keys(metadata['measureUnit']).map(function(d) {
        return '<option>' + d + '</option>';
    }).join();
    $('#metadata-measurements')
        .append(metadataOptions)
        .selectpicker('refresh')
        .selectpicker('selectAll');

    // append the river network chart
    let height = 200,
        width = 200;
    let networkSVG = d3.select('#metadata-river-network')
        .append('svg')
        .attr('height', height)
        .attr('width', width);
    let nodes = metadata['locationsRelationships']['nodes'];
    let links = metadata['locationsRelationships']['links'];

    networkSVG.append('svg:defs').append('svg:marker')
        .attr('id', 'arrow')
        .attr('viewBox', '0 -5 10 10')
        .attr('refX', -20) //so that it comes towards the center.
        .attr('markerWidth', 8)
        .attr('markerHeight', 8)
        .attr('orient', 'auto')
        .append('svg:path')
        .attr('d', 'M0,-5L10,0L0,5');

    // append links
    networkSVG.append('g')
        .attr('stroke', '#000')
        .attr('stroke-width', 1.5)
        .selectAll('line')
        .data(links)
        .enter().append('line')
        .attr('x1', function(d) {
            return d.source[0];
        })
        .attr('y1', function(d) {
            return d.source[1];
        })
        .attr('x2', function(d) {
            return d.target[0];
        })
        .attr('y2', function(d) {
            return d.target[1];
        })
        .attr('marker-start', 'url(#arrow)');

    // append nodes
    networkSVG.append('g')
        .selectAll('circle')
        .data(nodes)
        .enter().append('circle')
        .style('fill', function(d) {
            return ordinalColorScheme(d['location']);
        })
        .attr('cx', function(d) {
            return d.x;
        })
        .attr('cy', function(d) {
            return d.y;
        })
        .attr('r', 10)
        .on('mouseover', function(d) {
            d3.select(this).attr('r', 20);
            $('#badge-' + d['location']).addClass('highlight');
        })
        .on('mouseout', function(d) {
            d3.select(this).attr('r', 10);
            $('#badge-' + d['location']).removeClass('highlight');
        })
        .on('click', function(d) {
            let selected = $('#metadata-locations').val();
            if (selected.includes(d['location'])) {
                selected = selected.filter(function(item) {
                    return item !== d['location'];
                });
            } else {
                selected.push(d['location']);
            }
            $('#metadata-locations').selectpicker('val', selected);
        });

    networkSVG.append('path')
        .style('fill', '#000')
        .attr('d', d3.symbol()
            .size(100)
            .type(d3.symbolStar))
        .attr('transform', 'translate(150, 30)')
        // .append('rect')
        // .attr('width', 20)
        // .attr('height', 20)
        // .style('fill', )
        .on('mouseover', function() {
            $('#metadata-info').append('<span class="badge badge-dark">Approximate location of waste dumping</span>');
        })
        .on('mouseout', function() {
            setTimeout(function() {
                $('#metadata-info').empty();
            }, 2000);
            // $('#metadata-info').delay(1000).empty();
        });



    // append the color legend
    metadata['locations'].forEach(function(d) {
        $('#metadata-legend').append(' <span id="badge-' + d + '" class="badge" style="background: ' + ordinalColorScheme(d) + ';">' + d + '</span> ');
    });
}


/**
 * On click listener for the metadata location select field
 */
$('#metadata-locations').on('change', function() {
    let selected = $.map($(this).find('option:selected'), function(o) {
        return o['label'];
    });
    setSelectedLocations(selected);
});

/**
 * On click listener for the metadata measurements select field
 */
$('#metadata-measurements').on('change', function() {
    $('#time-series-div').addClass('d-none');
    let selected = $.map($(this).find('option:selected'), function(o) {
        return o['label'];
    });
    setSelectedMeasurements(selected);
});

$(function() {
    $('[rel="tooltip"]').tooltip();
});