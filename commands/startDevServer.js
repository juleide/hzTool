import fs from 'fs';
import path from 'path';
import inquirer from 'inquirer';
import liveServer from 'live-server';
import { createProxyMiddleware } from 'http-proxy-middleware';

export default async function startDevServer(options) {
    let proxyConfig = {};
    const defaultConfigPath = path.resolve(process.cwd(), 'proxy.config.json');

    // 如果用户提供了配置文件路径，尝试读取并解析配置文件
    if (options.config) {
      const absoluteConfigPath = path.resolve(process.cwd(), options.config);
      if (fs.existsSync(absoluteConfigPath)) {
        try {
          const config = JSON.parse(fs.readFileSync(absoluteConfigPath, 'utf8'));
          proxyConfig = config.proxy || {};
        } catch (err) {
          console.error("读取或解析配置文件失败，请确保文件路径正确并且内容是有效的 JSON 格式。", err);
          return;
        }
      } else {
        console.error("指定的配置文件不存在，请检查路径。");
        return;
      }
    } else {
      // 判断是否存在默认配置文件
      if (fs.existsSync(defaultConfigPath)) {
        try {
          const config = JSON.parse(fs.readFileSync(defaultConfigPath, 'utf8'));
          proxyConfig = config.proxy || {};
        } catch (err) {
          console.error("读取或解析默认配置文件失败，请确保内容是有效的 JSON 格式。", err);
          return;
        }
      } else {
        // 默认配置文件不存在，询问用户是否创建
        const answers = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'createConfig',
            message: '未提供代理配置文件 (proxy.config.json)。是否创建一个新的代理配置文件？',
            default: true
          }
        ]);

        if (answers.createConfig) {
          const defaultConfig = {
            proxy: {
              "/api": {
                "target": "http://localhost:5000",
                "changeOrigin": true,
                "pathRewrite": { "^/api": "" }
              }
            }
          };

          fs.writeFileSync(defaultConfigPath, JSON.stringify(defaultConfig, null, 2), 'utf8');
          console.log(`已创建默认代理配置文件 ${defaultConfigPath}`);
          proxyConfig = defaultConfig.proxy;
        } else {
          console.log('启动开发服务器，未设置代理配置。');
        }
      }
    }
    const proxyMiddlewares = Object.keys(proxyConfig).map(context => {
      return {
        route: context,
        handle: createProxyMiddleware(proxyConfig[context])
      };
    });

    const params = {
      port: options.port || 8080, // 设置服务器端口，默认是 8080
      host: "127.0.0.1", // 设置服务器主机，默认是 0.0.0.0
      root: ".", // 设置服务器根目录，默认是当前目录
      open: true, // 自动打开浏览器
      file: "index.html", // 如果存在该文件，所有的路由都会返回这个文件
      wait: 100, // 监听文件更改的延迟，单位毫秒
      logLevel: 2, // 0 = 关闭日志, 1 = 错误信息, 2 = 所有信息
      middleware: proxyMiddlewares.map(mw => ({
        route: mw.route,
        handle: mw.handle,
      }))
    };

    liveServer.start(params);
    console.log(`开发服务器已启动，访问 http://localhost:${params.port}`);
}