import { navbar } from "vuepress-theme-hope";

export default navbar([
  "/",
  {
    text: "工具",
    icon: "tools",
    prefix: "/ops/",
    link: "ops/redis.md",
  },
  // "/ops/"
]);
