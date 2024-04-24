import { defineUserConfig } from "vuepress";
import theme from "./theme.js";

export default defineUserConfig({
  base: "/",

  lang: "zh-CN",
  title: "拂晓",
  description: "记录",

  theme,

  // 和 PWA 一起启用
  // shouldPrefetch: false,
});