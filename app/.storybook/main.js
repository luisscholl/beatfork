module.exports = {
  "stories": [
    "../src/**/*.stories.mdx",
    "../src/**/*.stories.@(js|jsx|ts|tsx)"
  ],
  "addons": [
    "@storybook/addon-links",
    "@storybook/addon-essentials",
    "@storybook/preset-scss",
    "storybook-addon-react-router-v6"
  ],
  webpackFinal: async (config, { configType }) => {
    for (let rule of config.module.rules) {
      if (String(rule.test) === String(/\.s[ca]ss$/)) {
        rule.use.splice(2, 0, {
          loader: "resolve-url-loader",
          options: undefined
        })
      }
    }
    config.module.rules.push({
      test: /\.(glsl|vs|fs)$/,
      exclude: [/node_modules/],
      use: ["ts-shader-loader"]
    });

    // Return the altered config
    return config;
  },
}