const path = require('path');
const nodeExternals = require('webpack-node-externals');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const Dotenv = require('dotenv-webpack');

const version = require('./package.json').version;
process.env.APP_VERSION = version.replace('-BUILD-COMMIT', '');

module.exports = (env) => {
    return {
        mode: 'production',

        watch: env.NODE_ENV === 'development' ? true : false,
        devtool: 'inline-source-map',

        entry: {
            index: {
                import: './src/app.ts',
            },
        },

        module: {
            rules: [
                {
                    test: /\.tsx?$/,
                    use: 'ts-loader',
                },
            ],
        },

        resolve: {
            extensions: ['.tsx', '.ts', '.js'],
            alias: {
                '~': path.resolve(__dirname, 'src/'),
            },
        },

        output: {
            filename: '[name].js',
            path: path.resolve(__dirname, 'dist'),
        },

        target: 'node',

        externals: [nodeExternals()],

        plugins: [
            new Dotenv(),
            new CopyWebpackPlugin({
                patterns: [
                    {
                        from: './public',
                        to: 'public',
                    },
                    {
                        from: './src/views',
                        to: 'views',
                    },
                    {
                        from: './src/scripts',
                        to: 'scripts',
                    },
                ],
            }),
        ],
    };
};