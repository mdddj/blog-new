import type { ReactDoctorConfig } from "react-doctor/api";

const config: ReactDoctorConfig = {
  $schema: "https://react.doctor/schema/config.json",

  // 阻塞级别:error 时,扫描发现 error 级别问题会让命令以非零退出码结束(适配 CI)。
  // 可选: "error" | "warning" | "none"
  blocking: "error",

  // 依赖供应链评分(Socket.dev),默认开启,每直接依赖一次网络请求。
  // 博客项目依赖较少,保持默认;如需关闭: enabled: false
  supplyChain: {
    enabled: true,
    minScore: 50,
    severity: "error",
    includeDevDependencies: true,
  },

  // 死代码分析(deslop-js),默认开启;在 --diff / --staged 模式下自动跳过。
  deadCode: true,

  // 规则开关示例(按需启用/关闭):
  // rules: {
  //   "react-doctor/no-fetch-in-effect": "error",
  //   "react-doctor/no-derived-state-effect": "off",
  // },

  // 需要跳过扫描的文件/目录(相对扫描目录的 glob):
  // ignore: {
  //   files: ["src/app/(blog)/docs/**"],
  // },
};

export default config;
