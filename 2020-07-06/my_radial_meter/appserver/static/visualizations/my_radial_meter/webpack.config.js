var webpack = require('webpack');
var path = require('path');

module.exports = {
    entry: 'my_radial_meter_source',
    resolve: {
        modules: [
            path.join(__dirname, 'src'),
            "node_modules",
        ]
    },
    output: {
        path: __dirname,
        filename: 'visualization.js',
        libraryTarget: 'amd'
    },
    externals: [
        'api/SplunkVisualizationBase',
        'api/SplunkVisualizationUtils'
    ]
};

