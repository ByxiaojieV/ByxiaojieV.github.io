# 教程配置说明

## 文件说明

`tutorial-config.js` 是专门用于配置教程内容的 JavaScript 文件。

## 如何编辑教程

### 1. 修改标题

```javascript
title: "使用教程",  // 修改这里的文字
```

### 2. 添加/修改步骤

每个步骤包含以下字段：

```javascript
{
    number: 1,              // 步骤编号
    title: "获取二维码",     // 步骤标题
    content: "在游戏中...", // 步骤内容（支持 HTML）
    image: "images/step1.png", // 图片路径（可选）
    note: "注意：..."       // 注意事项（可选）
}
```

### 3. HTML 标签支持

在 `content` 和 `note` 字段中可以使用：

- `<strong>文字</strong>` - 加粗强调
- `<code>代码</code>` - 代码高亮显示
- `<br>` - 换行
- 普通文字

### 4. 添加图片

1. 将图片放入 `images` 文件夹
2. 在对应步骤中填写图片路径：
   ```javascript
   image: "images/step1.png",
   ```
3. 留空表示不显示图片（会显示占位符）：
   ```javascript
   image: "",
   ```

### 5. 添加注意事项

在步骤中添加蓝色高亮的注意事项框：

```javascript
note: "<strong>注意：</strong>这是重要提示！"
```

不需要注意事项时留空：

```javascript
note: ""
```

### 6. 增加或减少步骤

在 `steps` 数组中添加或删除对象即可：

```javascript
steps: [
    { number: 1, title: "...", content: "...", image: "", note: "" },
    { number: 2, title: "...", content: "...", image: "", note: "" },
    { number: 3, title: "...", content: "...", image: "", note: "" },
    // 在这里添加更多步骤
]
```

## 示例

### 完整步骤示例

```javascript
{
    number: 1,
    title: "获取二维码",
    content: "在游戏中将该 QR Code 画面截图。",
    image: "images/step1.png",
    note: "注意"
}
```

### 不带图片和注意事项的步骤

```javascript
{
    number: 2,
    title: "简单步骤",
    content: "这是一个简单的步骤说明。",
    image: "",
    note: ""
}
```

### 只有图片没有注意事项

```javascript
{
    number: 3,
    title: "图片展示",
    content: "查看下方截图了解详情。",
    image: "images/step3.png",
    note: ""
}
```

## 注意事项

1. 修改后刷新页面即可看到效果
2. 确保 `tutorial-config.js` 在 `index.html` 中已引入
3. 图片路径相对于 `index.html` 文件
4. 步骤编号会自动显示在圆形图标中
5. 内容支持 HTML，可以灵活排版
