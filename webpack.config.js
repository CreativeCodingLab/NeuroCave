// webpack.config.js
const path = require( 'path' );
module.exports = {
    context: __dirname,
    entry: ['./js/main.js'],
    output: {
        path: path.resolve( __dirname, 'public' ),
        filename: 'main.js',
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: 'babel-loader',
            }
        ]
    }
};