const path = require('path');
const webpack = require('webpack');
//const UglifyJsPlugin = require("uglifyjs-webpack-plugin");
//const MiniCssExtractPlugin = require("mini-css-extract-plugin");
//const OptimizeCSSAssetsPlugin = require("optimize-css-assets-webpack-plugin");

module.exports = (env, argv) => {
  const mode = argv.mode;
  return {
    entry: './source/index',
    output: {
      path: path.join(__dirname, 'public'),
      filename: 'js/app.js',
      publicPath: '/',
    },
    devServer: {
      contentBase: path.join(__dirname, 'public'),
      allowedHosts: [
        'localhost',
        '0.0.0.0',
      ],
      port: 9999,
      publicPath: '/',
      historyApiFallback: true,
      overlay: true
    },
    resolve: {
      alias: {
        'root': path.resolve(__dirname, 'source/'),
        'Components': path.resolve(__dirname, 'source/components/'),
        'Containers': path.resolve(__dirname, 'source/containers/'),
        'Reducers': path.resolve(__dirname, 'source/reducers/'),
        'Actions': path.resolve(__dirname, 'source/actions/'),
      }
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
       /* {
          test: /\.css$/,
          use: [
            mode !== 'production' ? 'style-loader' : MiniCssExtractPlugin.loader, 'css-loader'
          ]
        }*/
      ]
    },
    /*plugins: [
      new MiniCssExtractPlugin({
        filename: "css/[name].css",
        chunkFilename: "css/[id].css"
      })
    ],
    optimization: {
      minimizer: [
        new UglifyJsPlugin({
          cache: true,
          parallel: true,
          sourceMap: true
        }),
        new OptimizeCSSAssetsPlugin({})
      ]
    }*/
  }
};
