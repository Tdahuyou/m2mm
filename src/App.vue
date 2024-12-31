<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { Transformer } from 'markmap-lib';
import { Markmap } from 'markmap-view';
import { Toolbar } from 'markmap-toolbar';

const transformer = new Transformer();

const markmapSvgContainerRef = ref<HTMLDivElement | undefined>(undefined);
const markmapSvgRef = ref<SVGSVGElement | undefined>(undefined);

const expandLevel = ref(3);

const defaultOptions = {
  nodeMinHeight: 24,
  duration: 100,
  maxWidth: 400,
  spacingHorizontal: 20,
  spacingVertical: 10,
  colorFreezeLevel: 2, // !NOTE 不起作用
};

let markmap: Markmap | null = null;
let markmapData: any = null;

onMounted(async () => {
  await updateMM();
  initToolbar();
});

// !NOTE 当 expandLevel 变化后立刻更新 markmap 有时会失败。
// watch(expandLevel, async () => await updateMM());

function initToolbar() {
  const { el } = Toolbar.create(markmap);
  el.style.position = 'absolute';
  el.style.top = '2.5rem';
  el.style.right = '1.5rem';
  el.style.scale = '1.2';
  el.removeChild(el.querySelector('.mm-toolbar-brand'));
  markmapSvgContainerRef.value.append(el);
}

async function genClipboard() {
  let mdStr = await navigator.clipboard.readText().catch(e => {
    console.error('error - navigator.clipboard.readText =>', e);
  }) as string;
  // 将 mdStr 中所有的代码块删除
  // mdStr = mdStr.replace(/```[\s\S]*?```/g, '');

  // !NOTE - for personnal notes --> https://github.com/Tdahuyou/* - 将个人笔记中的目录区域的开始行和结束行移除。
  mdStr = mdStr.split('\n').filter(line => !line.includes('region:toc')).join('\n');

  // !for debugger - 将 mdStr 写入剪切板
  navigator.clipboard.writeText(mdStr).catch(e => {
    console.error('error - navigator.clipboard.writeText =>', e);
  });

  const { root } = transformer.transform(mdStr as string);
  markmapData = root;
  await updateMM();
}

async function updateMM() {
  await destroyMM(500);
  markmap = Markmap.create(markmapSvgRef.value, {
    initialExpandLevel: expandLevel.value,
    ...defaultOptions
  });
  initToolbar();
  if (markmapData) {
    markmap.setData(markmapData);
    await markmap.fit().catch(e => {
      console.error('error - markmap.fit =>', e);
    });
  }
}

async function destroyMM(delay = 0) {
  if (markmap) markmap.destroy();
  return new Promise(resolve => setTimeout(resolve, delay));
}

// #region auto parse github article
// 使用 turndownService 将 github 文章转换为 markdown 然后再把数据丢给 markmap。
// 实测效果不太好。
// import TurndownService from 'turndown';

// const turndownService = new TurndownService({
//   headingStyle: 'atx',
//   hr: '---',
//   bulletListMarker: '-',
//   codeBlockStyle: 'indented',
//   fence: '```',
//   linkStyle: 'inlined',
// });

// function genGithub() {
//   chrome.tabs.query({
//     active: true,
//     currentWindow: true
//   }, async (tabs) => {
//     const curActiveTab = tabs[0];
//     if (curActiveTab && curActiveTab.url && curActiveTab.id) {
//       chrome.scripting.executeScript({
//         target: { tabId: curActiveTab.id },
//         func: () => {
//           const articleElement = document.querySelector("article");
//           return articleElement ? articleElement.outerHTML : null;
//         }
//       }, (results) => {
//         if (results && results.length > 0) {
//           const articleOuterHTML = results[0].result;
//           // 将 articleOuterHTML 保存到剪切版中
//           navigator.clipboard.writeText(articleOuterHTML);
//           let mdStr = turndownService.turndown(articleOuterHTML);
//           console.log('mdStr:', mdStr);
//           const { root } = transformer.transform(mdStr);
//           if (markmap) {
//             markmap.setData(root);
//             markmap.fit();
//           }
//         }
//       });
//     }
//   });
// };
// #endregion auto parse github article
</script>

<template>
  <div class="markmap-wrapper" ref="markmapSvgContainerRef">
    <div class="btn-group">
      <a href="https://m2mm.tdahuyou.cn" target="_blank" title="m2mm 在线访问链接">live</a>
      <a href="https://github.com/Tdahuyou/m2mm" target="_blank" title="m2mm github 仓库地址">github</a>
      <span title="输入展开的层次">level: </span><input type="number" min="1" step="1" max="100" style="width: 2.5rem;" placeholder="请输入展开层次"
        v-model="expandLevel">
      <button @click="genClipboard" title="从剪切板中生成">update</button>
    </div>
    <!-- <button @click="genGithub" title="读取 github 文章">github</button> -->
    <svg ref="markmapSvgRef" style="height: 100%; width: 100%;"></svg>
  </div>
</template>

<style scoped>
.markmap-wrapper {
  width: 98vw;
  height: 98vh;
  overflow: hidden;
}

.markmap-wrapper .btn-group {
  position: relative;
  top: 1rem;
  left: 1rem;
  display: flex;
  gap: 1rem;
}

.markmap-wrapper .btn-group a {
  color: #1E90FF;
}
</style>

<style>
/* for toolbar - Toggle recursively */
.mm-toolbar-item.active {
  /* background: #88888888; */
  color: #7cacf8;
}

/* remove link text underline */
a {
  text-decoration: none !important;
}
</style>
