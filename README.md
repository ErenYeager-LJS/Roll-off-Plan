# Roll-off-Plan

本仓库包含一个本地优先的营养记录 PWA。它用于记录早餐、午餐、晚餐和每日体重，自动计算热量、蛋白质、碳水、脂肪，并显示波动图。

手机和电脑访问同一个本地服务时，数据会写入同一个 SQLite 数据库，因此可以同步查看。

## 运行

在 `营养记录PWA/` 目录运行：

```powershell
npm start
```

电脑打开：

```text
http://localhost:8080/
```

iPhone 打开：

1. 让电脑和 iPhone 连接同一个 Wi-Fi。
2. 在电脑 PowerShell 运行 `ipconfig`，找到无线网卡 IPv4 地址。
3. iPhone Safari 打开 `http://电脑IPv4地址:8080/`。
4. Safari 分享按钮 -> 添加到主屏幕。

数据保存在电脑本地 SQLite 文件：

```text
server/nutrition.db
```

## 功能

- 记录早餐、午餐、晚餐。
- 从内置食物库选择食物并输入重量。
- 新增自定义食物，填写每 100g 热量、蛋白质、碳水、脂肪。
- 自动计算每日热量、蛋白质、碳水、脂肪。
- 显示偏低、合适、偏高。
- 记录每日体重。
- 查看体重、热量、蛋白质、碳水、脂肪波动图。
- 手机和电脑同步查看同一个 SQLite 数据库。

## 测试

```powershell
npm test
npm run check
```

