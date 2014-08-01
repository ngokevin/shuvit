var d3 = require('d3');
var $ = require('jquery');
var _ = require('underscore');

function CumulativeLineChart(element, rawData, _cfg) {
    var chart;
    var chartGroup;
    var data;

    var cfg = {
        chart: {
            axisPadding: 3,
            fontColor: 'rgb(245, 245, 245)',
            fontSize: '12',
            height: $('.chart').height(),
            opacity: '.95',
            topPadding: 15,
            title: '$',
            width: $('.chart').width()
        },
        line: {
            color: '#299283'
        },
        xAxis: {
            days: 7,
            padding: 5
        },
        yAxis: {
            padding: 35
        },
    };

    init(rawData, _cfg);  // Link. Start!.

    function init(rawData, _cfg) {
        cfg = $.extend(true, {}, cfg, _cfg);
        data = transform(rawData);
        render(element);
        console.log(data);
    }

    function transform(rawData) {
        if (cfg.xAxis.days !== -1) {
            rawData = trim(rawData);
        }

        // This will be our data point.
        var cumulativeProfit = 0;
        return _.map(rawData, function(d) {
            cumulativeProfit += (d.result - d.buyin);
            d.cumulativeProfit = cumulativeProfit;
            return d;
        });
    }

    function trim(rawData) {
        // Trim to the last n days of data.
        var minDate = new Date();
        minDate.setDate(minDate.getDate() - cfg.xAxis.days);
        return _.filter(rawData, function(d) {
            return d.date >= minDate;
        });
    }

    function render(element) {
        // Create canvas.
        chart = d3.select(element)
            .append('svg:svg')
            .attr('width', cfg.chart.width)
            .attr('height', cfg.chart.height);

        // Create scales.
        var xScale = d3.scale.linear()
            .domain([0, data.length])
            .range([0, cfg.chart.width - cfg.yAxis.padding]);

        var min = _.min(data, function(d) {return d.cumulativeProfit;}).cumulativeProfit;
        var max = _.max(data, function(d) {return d.cumulativeProfit;}).cumulativeProfit;
        var yScale = d3.scale.linear()
            .domain([min, max])
            .range([cfg.chart.topPadding,
                    cfg.chart.height - cfg.xAxis.padding - cfg.chart.topPadding]);

        // Group elements in the chart together to help padding.
        chartGroup = chart.append('g')
            .attr('transform',
                  'translate(' + cfg.yAxis.padding + ', ' + 0 + ')');

        var spacing = (cfg.chart.width - cfg.yAxis.padding) / data.length;

        // X axis text.
        chartGroup.selectAll('text.xAxis')
            .data(data)
            .enter()
            .append('svg:text')
            .attr('class', 'xAxis')
            .attr('fill', cfg.chart.fontColor)
            .attr('font-size', cfg.chart.fontSize + 'px')
            .attr('text-anchor', 'middle')
            .attr('x', function(d, i) {
                return xScale(data.indexOf(d)) + spacing / 2;
            })
            .attr('y', cfg.chart.height - cfg.chart.axisPadding)
            .text(function(d, i) {
                var modDays = cfg.xAxis.days;
                if (cfg.xAxis.days === -1) {
                    // Case where we show every day.
                    modDays = data.length;
                }
                if (data.length <= 7 ||
                    data.indexOf(d) % Math.floor(modDays / 6) === 0) {
                    // Show only about every 7 dates on xAxis.
                    return d.date.getMonth() + 1 + '-' + d.date.getDate();
                }
            });

        // Y axis text.
        chart.selectAll('text.yAxis')
            .data(_.range(min, max, 10))
            .enter()
            .append('svg:text')
            .attr('class', 'yAxis')
            .attr('fill', cfg.chart.fontColor)
            .attr('font-size', cfg.chart.fontSize + 'px')
            .attr('x', cfg.chart.axisPadding)
            .attr('y', function(d) {
                return yScale(d) + cfg.chart.fontSize / 2 - 1;
            })
            .text(function(d, i) {
                return '$' + d;
            });
    }

    function setDays(days) {
        cfg.xAxis.days = days;
        refresh();
    }

    function refresh(rawData) {
        $(element + ' svg').remove();
        cumulativeLineChart(element, rawData);
    }

    return {
        refresh: refresh,
        setDays: setDays
    };
}

module.exports = {
    CumulativeLineChart: CumulativeLineChart,
};
