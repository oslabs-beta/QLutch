const HtmlWebPackPlugin = require("html-webpack-plugin");
const path = require('path');



module.exports = {
    mode: 'development',
    entry: "./src/client/index.js",
    output: {
        path: path.join(__dirname, 'dist'),
        filename: "bundle.js"
    },
    module: {
        rules: [
            {
                test: /\.(js|jsx)$/,
                exclude: /node_modules/,
                use: {
                    loader: "babel-loader"
                }
            },
            {
                test: /\.s?css$/,
                use: ['style-loader', 'css-loader', 'sass-loader']
            },
            {
                test: /\.(png|svg|jpg|gif)$/,
                loader: "file-loader",
                options: { name: '/static/[hash].[ext]' }
            }
        ]
    },
    resolve: {
        extensions: ['.js', '.jsx'],
    },
    plugins: [
        new HtmlWebPackPlugin({
            template: './src/client/index.html', 
        }),
    ],
    devServer: {
        // historyApiFallback: true,
        // proxy: {
        //     '/api': 'http://localhost:3000'

        // },
        static: {
            directory: path.join(__dirname, 'build'),
            publicPath: '/build'
        },
        port: 8080
    }
};