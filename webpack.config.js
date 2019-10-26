
module.exports = {
    mode: "production",
    entry: "./index.js",
    devtool: "source-map",
    target: "node",
    node: {
        process: false
    },
    output: {
        path: __dirname + "/bundle",
        filename: "bsp.js",
        library: "bsp",
        libraryTarget: "umd",
        globalObject: "this",
    },
    resolve: {
        extensions: [".js"]
    }
};