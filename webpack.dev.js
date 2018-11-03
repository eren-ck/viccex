const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin')

// Module for the index.html
module.exports = [{
    mode: 'development',
    target: 'web',
    entry: './src/js/app.js',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'bundle.js'
    },
    module: {
        rules: [{
                test: /\.css$/,
                use: ['style-loader', 'css-loader']
            },
            {
                test: /\.(png|jpeg)$/,
                loader: 'file-loader'
            }
        ]
    },
    plugins: [
        new CopyWebpackPlugin([{
                from: 'static',
                to: ''
            },
            {
                from: 'src/*.html',
                to: '',
                flatten: true
            },
            {
                from: 'data/*',
                to: ''
            }
        ], {
            copyUnmodified: false
        }),
    ]
}, ];