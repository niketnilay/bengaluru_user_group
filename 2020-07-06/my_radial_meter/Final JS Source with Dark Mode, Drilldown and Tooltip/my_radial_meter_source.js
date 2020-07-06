define([
    'jquery',
    'underscore',
    'api/SplunkVisualizationBase',
    'api/SplunkVisualizationUtils',
    'd3'
],
    function (
        $,
        _,
        SplunkVisualizationBase,
        SplunkVisualizationUtils,
        d3
    ) {
            // Niket - DARK THEME 1 of 2
            // Use SplunkVisualizationUtils to get Current Theme and set variable isDarkTheme
            // Based on dark theme set Font Color and Background Color.
            var isDarkTheme = SplunkVisualizationUtils.getCurrentTheme && SplunkVisualizationUtils.getCurrentTheme() === 'dark';

            var backgroundColor = isDarkTheme ? '#222528' : '#ffffff';
            var fontColor = isDarkTheme ? '#ffffff' : '#222528';
        return SplunkVisualizationBase.extend({
            initialize: function () {
                // Save this.$el for convenience
                this.$el = $(this.el);

                // Add a css selector class
                this.$el.addClass('splunk-radial-meter');
            },
            getInitialDataParams: function () {
                return ({
                    outputMode: SplunkVisualizationBase.ROW_MAJOR_OUTPUT_MODE,
                    count: 10000
                });
            },
            formatData: function(data, config) {
                // Check for an empty data object
                if(data.rows.length < 1){
                    return false;
                }
                var datum = SplunkVisualizationUtils.escapeHtml(parseFloat(data.rows[0][0]));
                // Check for invalid data
                if(_.isNaN(datum)){
                    throw new SplunkVisualizationBase.VisualizationError(
                        'This meter only supports numbers'
                    );
                }
                return datum;
            },
            updateView: function (data, config) {

                // Return if no data
                if (!data) {
                    return;
                }

                // Assign datum to the data object returned from formatData
                var datum = data;

                // Clear the div
                this.$el.empty();

                // Get color config or use a default yellow shade
                var mainColor = config[this.getPropertyNamespaceInfo().propertyNamespace + 'mainColor'] || '#f7bc38';

                // Set meter max value or use a default
                var maxValue = parseFloat(this._getEscapedProperty('maxValue', config)) || 100;

                // Set height and width
                var height = 220;
                var width = 220;

                // Niket - Drilldown - 1 of 5
                // Get from configuration whether Drilldown is enabled or not.
                // If Drilldown is enabled convert cursor from Arrow to Pointer (Hand)
                this.useDrilldown = this._isEnabledDrilldown(config);

                var cursor = 'arrow';
                if (this.useDrilldown) {
                    cursor = 'pointer';
                }
                // Create a radial scale representing part of a circle
                var scale = d3.scaleLinear()
                    .domain([0, maxValue])
                    .range([- Math.PI * .75, Math.PI * .75])
                    .clamp(true);
                    .0

                // Create parameterized arc definition
                var arc = d3.arc()
                    .startAngle(function (d) {
                        return scale(0);
                    })
                    .endAngle(function (d) {
                        return scale(d)
                    })
                    .innerRadius(70)
                    .outerRadius(85);

                // SVG setup
                var svg = d3.select(this.el)
                    .append('svg')
                    .attr('width', width)
                    .attr('height', height)
                    // Niket - Dark Mode Change 2 of 2. 
                    // COMMENT following line for Transparent Background Color.
                    .style('background', '#fff')
                    .append('g')
                    .attr('transform', 'translate(' + width / 2 + ',' + height / 2 + ')');
                // Background arc
                svg.append('path')
                    .datum(maxValue)
                    .attr('d', arc)
                    .style('fill', 'lightgray')

                    // Niket - UNCOMMENT FOR Drilldown - 2 of 5
                    // For SVG sections with Drilldown change cursor style and bind the click event.
                    .style('cursor', cursor)
                    .on('click', this._drilldown.bind(this));
                // Fill arc
                svg.append('path')
                    .datum(datum)
                    .attr('d', arc)
                    .style('fill', mainColor)

                    // Niket - UNCOMMENT FOR Drilldown - 3 of 5
                    // For SVG sections with Drilldown change cursor style and bind the click event.
                    .style('cursor', cursor)
                    .on('click', this._drilldown.bind(this));
                // Text
                svg.append('text')
                    .datum(datum)
                    .attr('class', 'meter-center-text')
                    .style('text-anchor', 'middle')
                    .style('fill', mainColor)
                    .text(function (d) {
                        return parseFloat(d);
                    })
                    .attr('transform', 'translate(' + 0 + ',' + 20 + ')')
                    // Niket - UNCOMMENT FOR Drilldown - 3 of 5
                    // For SVG sections with Drilldown change cursor style and bind the click event.
                    .style('cursor', cursor)
                    .on('click', this._drilldown.bind(this));


                // Niket - UNCOMMENT FOR Tooltip
                // d3 svg based tooltip is created
                // mouseover() and mouseout() event bound to toggle tooltip
                var tooltipContainer=svg.append('g')
                    .style("visibility", "hidden")                
                tooltipContainer.append('rect')
                    .style('fill',fontColor)
                    .style('width','120px')
                    .style('height','50px')
                    .attr('rx','5')
                    .attr('ry','5')
                    .attr('transform', 'translate(' + -30 + ',' + -60 + ')')
                tooltipContainer.append('text')
                    .datum(datum)
                    .attr('class', 'tooltip-text')
                    .style("fill", backgroundColor)
                    .attr('transform', 'translate(' + -15 + ',' + -30 + ')')
                    .text(function (d) {
                        var data=parseFloat(d);
                        var TooltipText="Value: "+data;
                        return TooltipText;
                    })
                svg.on("mouseover", function(){return tooltipContainer.style("visibility", "visible");})
                .on("mouseout", function(){return tooltipContainer.style("visibility", "hidden");});

            },
            _getEscapedProperty: function (name, config) {
                var propertyValue = config[this.getPropertyNamespaceInfo().propertyNamespace + name];
                return SplunkVisualizationUtils.escapeHtml(propertyValue);
            },
            // Niket - UNCOMMENT FOR Drilldown - 5 of 5
            // _drilldown function() Get the value for the drilldown 
            //            and assign to payload as value (i.e. token $row.value$)
            // _isEnabledDrilldown function() gets the visualization drilldown configuration
            //            and sets to true or false depending on whether drilldown is set or not.
            _drilldown: function (d, i) {
                var data = this.getCurrentData();
                var payload = {
                    action: SplunkVisualizationBase.FIELD_VALUE_DRILLDOWN,
                    data: {}
                };
                payload.data["value"] = data;
                this.drilldown(payload);
            },
            _isEnabledDrilldown: function (config) {
                if (config['display.visualizations.custom.drilldown'] && config['display.visualizations.custom.drilldown'] === 'all') {
                    return true;
                }
                return false;
            }
        });
    });
