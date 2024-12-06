# chrome extension markmap

<!-- region:toc -->

<!-- endregion:toc -->

## 🔗 links

- https://mixmark-io.github.io/turndown/
- https://markmap.js.org/repl

## 📒 在 markmap 中，toggle recursively 开关有什么用？

在 Markmap 中，`toggle recursively` 开关用于控制节点的展开和折叠行为。Markmap 是一个将 Markdown 转换为思维导图的工具，允许用户以视觉化的方式浏览结构化的信息。

当使用 `toggle recursively` 功能时，它的作用如下：

- **启用时**：当你点击展开或折叠某个节点时，该操作不仅会影响当前节点，还会影响到其所有子节点。例如，如果你选择展开一个父节点，那么它下面的所有层级的子节点都会被一同展开；同理，如果选择折叠，则整个分支都会被折叠起来。
- **禁用时**：每次你点击展开或折叠节点时，只会改变直接子节点的状态。比如，展开一个父节点只会显示它直接下的子节点，而这些子节点本身的内容（如果有）仍然是折叠状态，需要单独操作来展开。

这个功能对于处理复杂或者多层次的数据结构特别有用，因为它让用户能够更精细地控制视图中展示的信息量，从而更容易找到他们想要查看的具体内容，同时保持界面整洁不混乱。根据个人需求和偏好，你可以开启或关闭此选项以获得最佳浏览体验。

## 📒 `content.js` 和 `service-worker.js` 在浏览器扩展中的运行时机

### `content.js`

`content.js` 是一个内容脚本（content script），它会在指定的网页加载时注入并执行。根据你在 `manifest.json` 中的配置：

```json
"content_scripts": [
  {
    "js": ["content.js"],
    "matches": [
      "https://github.com/*"
    ]
  }
]
```

`content.js` 的运行时机如下：

- **页面匹配**：当用户访问的 URL 匹配 `"https://github.com/*"` 时，`content.js` 会被注入到该页面中。
- **页面加载**：`content.js` 会在页面加载完成后执行。具体来说，它会在 `DOMContentLoaded` 事件触发后执行，这意味着页面的 DOM 已经完全加载和解析，但样式表、图像和子框架可能仍在加载。
- **隔离环境**：内容脚本运行在一个与页面脚本隔离的环境中，这意味着它不能直接访问页面的 JavaScript 变量和函数，但可以通过 `window.postMessage` 进行双向通信。

### `service-worker.js`

`service-worker.js` 是一个服务工作者（service worker），它是一个在后台运行的脚本，可以拦截和处理网络请求，管理缓存等。根据你在 `manifest.json` 中的配置：

```json
"background": {
  "service_worker": "service-worker.js"
}
```

`service-worker.js` 的运行时机如下：

- **安装**：当扩展第一次被安装或更新时，`service-worker.js` 会被安装。安装事件通常用于设置缓存。
- **激活**：安装成功后，`service-worker.js` 会被激活。激活事件通常用于清理旧的缓存。
- **持续运行**：一旦激活，`service-worker.js` 可以在后台持续运行，即使没有打开任何相关的页面。它可以监听各种事件，如网络请求、消息传递等。
- **生命周期**：服务工作者有一个生命周期，包括安装、激活、空闲和终止状态。它可以在不需要时被浏览器终止，以节省资源。

### 总结

- **`content.js`**：在匹配的网页加载完成后注入并执行，主要用于操作和交互特定网页的内容。
- **`service-worker.js`**：在扩展安装或更新时安装，在激活后持续在后台运行，主要用于处理网络请求和缓存管理。

希望这些解释对你有帮助！如果你有更多问题，请随时提问。