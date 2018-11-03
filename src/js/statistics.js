/*eslint-disable no-unused-lets*/
/*global $, d3*/
'use strict';

import {
    getStatisticData
} from './data.js';

import {
    updateTimeSeries
} from './timeseries.js';

let domSelector = '#statistics-table > tbody:nth-child(2)';
/**
 * Initialize the div with the svg element
 */
function updateStatisticsModal() {
    $(domSelector).empty();
    let data = getStatisticData();
    let tableString = '';

    let markerEmtpyRow = data[0][0];

    data = data.sort(compare);
    let minMax = [d3.min(data, function(d) {
            return d[15];
        }),
        d3.max(data, function(d) {
            return d[15];
        })
    ];

    let colorScale = d3.scaleSqrt()
        .domain(minMax)
        .range(['#fff', '#ef3b2c']);

    data.forEach(function(d) {
        if (markerEmtpyRow !== d[0]) {
            tableString += '<tr class="blank-row"></tr>';
            markerEmtpyRow = d[0];
        }
        tableString += '<tr id="' + (d[0] + '---' + d[1]) + '" style="background: ' + colorScale(d[15]) + '">';
        d.forEach(function(elm) {
            if (elm !== undefined) {
                if (Number(elm) === elm && elm % 1 !== 0) {
                    tableString += '<td>' + parseFloat(elm).toFixed(2) + '</td>';
                } else {
                    tableString += '<td>' + elm + '</td>';
                }
            } else {
                tableString += '<td></td>';
            }
        });
        tableString += '</tr>';
    });
    $(domSelector).append(tableString);
}

function compare(a, b) {
    if (a[15] < b[15])
        return 1;
    if (a[15] > b[15])
        return -1;
    return 0;
}


// $('#statistics-button').on('click', function() {
$('#statistics-modal').on('shown.bs.modal', function() {
    updateStatisticsModal();
    $('div.col-md-12:nth-child(4)').tooltip('hide');
});

$(domSelector).on('click', 'tr', function() {
    // get the right info
    let id = $(this).attr('id');
    let measurement = id.split('---')[0];
    // let location = id.split('---')[1];
    // select the right elements in the selection process

    // $('#metadata-locations').selectpicker('selectAll');
    $('#metadata-measurements').selectpicker('val', measurement);
    updateTimeSeries(measurement);

    $('#statistics-modal').modal('toggle');
    $('#time-series-div').removeClass('d-none');
});