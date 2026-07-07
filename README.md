# 营养记录器 PWA

本地优先的三餐营养记录工具。支持 iPhone Safari 打开并添加到主屏幕。

## 运行

在工作区根目录运行：

```powershell
python -m http.server 8080
```

电脑打开：

```text
http://localhost:8080/营养记录PWA/
```

iPhone 打开：

1. 让电脑和 iPhone 连接同一个 Wi-Fi。
2. 在电脑 PowerShell 运行 `ipconfig`，找到无线网卡 IPv4 地址。
3. iPhone Safari 打开 `http://电脑IPv4地址:8080/营养记录PWA/`。
4. Safari 分享按钮 -> 添加到主屏幕。

## 功能

- 记录早餐、午餐、晚餐。
- 从内置食物库选择食物并输入重量。
- 新增自定义食物，填写每 100g 热量、蛋白质、碳水、脂肪。
- 自动计算每日热量、蛋白质、碳水、脂肪。
- 显示偏低、合适、偏高。
- 数据保存在当前浏览器本地。

## 测试

```powershell
npm test
```

也可以在工作区根目录运行：

```powershell
node --test 营养记录PWA/tests/nutrition-core.test.mjs
```
