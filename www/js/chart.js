var d3 = require('d3');
var $ = require('jquery');
var _ = require('underscore');


function CumulativeLineChart(element, rawData, _cfg) {
    var data;
    var height;
    var margin = {top: 10, right: 10, bottom: 40, left: 30};
    var width;

    var cfg = {
        xAxis: {
            days: -1
        }
    };

    init(rawData, _cfg);  // Link. Start!.

    function init(rawData, _cfg) {
        cfg = $.extend(true, {}, cfg, _cfg);

        height = $('.chart').height() - margin.top - margin.bottom;
        width = $('.chart').width() - margin.left - margin.right;

        data = transform(rawData);
        render(element);
    }

    function trim(rawData) {
        // Trim to the last n days of data.
        var minDate = new Date();
        minDate.setDate(minDate.getDate() - cfg.xAxis.days);
        return _.filter(rawData, function(d) {
            return d.date >= minDate;
        });
    }

    function transform(rawData) {
        // Trim to date.
        if (cfg.xAxis.days !== -1) {
            rawData = trim(rawData);
        }

        // Calculate profits.
        var cumulativeProfit = 0;
        rawData = _.map(rawData, function(d) {
            cumulativeProfit += (d.result - d.buyin);
            return cumulativeProfit;
        });

        // Start at 0.
        rawData.unshift(0);

        return rawData;
    }

    function render(element) {
        var min = _.min(data);
        min -= min * 0.05;
        var max = _.max(data);
        max += max * 0.05;

        var x = d3.scale.linear()
            .domain([0, data.length - 1])
            .range([0, width]);
        var y = d3.scale.linear()
            .domain([min, max])
            .range([height, 0]);

        var xAxis = d3.svg.axis()
            .tickFormat(function(n) {
                return Math.floor(n) !== n ? null : n;
            })
            .scale(x)
            .orient('bottom');
        var yAxis = d3.svg.axis()
            .scale(y)
            .orient('left');

        var line = d3.svg.line()
            .x(function(d, i) { return x(i); })
            .y(function(d, i) { return y(d); });

        var svg = d3.select(element)
            .append('svg:svg')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom)
            .append('g')
            .attr('transform',
                  'translate(' + margin.left + ',' + margin.top + ')');

        svg.append('g')
            .attr('class', 'x axis')
            .attr('transform', 'translate(0,' + height + ')')
            .call(xAxis)
          .append('text')
            .attr('x', 113)
            .attr('dy', 35)
            .style('text-anchor', 'end')
            .text('Tourney/Session No.');

        svg.append('g')
            .attr('class', 'y axis')
            .call(yAxis)
          .append('text')
            .attr('transform', 'rotate(-90)')
            .attr('y', 6)
            .attr('dy', '.71em')
            .style('text-anchor', 'end')
            .text('Profit ($)');

        svg.append('path')
            .datum(data)
            .attr('class', 'line')
            .attr('d', line);
    }

    function refresh(newRawData, cfg) {
        $(element + ' svg').remove();
        init(element, newRawData, cfg);
    }

    return {
        refresh: refresh,
    };
}

module.exports = {
    CumulativeLineChart: CumulativeLineChart,
};
