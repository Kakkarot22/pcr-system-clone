process.env.BROWSER = "none"

const { CracoAliasPlugin } = require("react-app-alias")
const CracoLessPlugin = require("craco-less")

module.exports = {
  babel: {
    presets: [],
    plugins: [
      [
        "import",
        { libraryName: "antd", libraryDirectory: "es", style: true },
        "ant",
      ],
      [
        "import",
        {
          libraryName: "@ant-design/icons",
          libraryDirectory: "es/icons",
          camel2DashComponentName: false,
        },
        "ant-design-icons",
      ],
    ],
    loaderOptions: (babelLoaderOptions, { env, paths }) => {
      return babelLoaderOptions
    },
  },
  plugins: [
    {
      plugin: CracoAliasPlugin,
      options: {
        source: "jsconfig",
        // baseUrl SHOULD be specified
        // plugin does not take it from jsconfig
        baseUrl: "./src",
      },
    },
    {
      plugin: CracoLessPlugin,
      options: {
        lessLoaderOptions: {
          lessOptions: {
            modifyVars: {
              "@primary-color": "#21acd7",
              "@text-color": "rgba(0, 0, 0, 0.60)",
              "@heading-color": "rgba(0, 0, 0, 0.60)",
              "@table-header-bg": "#21acd7",
              "@table-header-color": "#FFF",
              "@table-header-sort-bg": "#21acd7",
              "@table-header-sort-active-bg": "#21acd7",
              "@disabled-color": "rgba(0, 0, 0, 0.60)",
            },
            javascriptEnabled: true,
          },
        },
      },
    },
  ],
}
