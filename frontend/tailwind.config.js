module.exports = {
  purge: ["./src/**/*.{js,jsx,ts,tsx}", "./public/index.html"],
  theme: {
    extend: {
      zIndex: {
        "-1": "-1",
      },
    },
    fontFamily: {
      sans: [
        "游ゴシック",
        "游ゴシック体",
        "YuGothic",
        "Yu Gothic",
        "メイリオ",
        "Meiryo",
        "ＭＳ ゴシック",
        "MS Gothic",
        "HiraKakuProN-W3",
        "TakaoExゴシック",
        "TakaoExGothic",
        "MotoyaLCedar",
        "Droid Sans Japanese",
        "sans-serif",
      ],
    },
    backgroundColor: (theme) => ({
      ...theme("colors"),
      primary: "#3baeda",
      cyan: "#36bc9b",
      volcano: "#e9573e",
      'custom-yellow': '#ffff00'
    }),
    textColor: (theme) => ({
      ...theme("colors"),
      primary: "#3baeda",
      cyan: "#36bc9b",
      volcano: "#e9573e",
    }),
    borderColor: (theme) => ({
      ...theme("colors"),
      primary: "#3baeda",
      cyan: "#36bc9b",
      volcano: "#e9573e",
    }),
  },
  variants: {
    extend: {
      backgroundColor: ["active"],
    },
  },
  plugins: [],
  corePlugins: {
    fontFamily: false,
  },
  important: true,
}
