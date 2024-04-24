import { sidebar } from "vuepress-theme-hope";

export default sidebar({
  "/": [
    // "",
    {
      text: "Redis",
      prefix: "ops/",
      // link: "ops/",
      // activeMatch: "^/ops/$",
      children:[
         "redis"
      ]
    },
  ],
  // "/ops/":"structure"
});
