<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { Transformer } from 'markmap-lib';
import { Markmap } from 'markmap-view';
import { Toolbar } from 'markmap-toolbar';

// icon from => https://icon-sets.iconify.design/?query=github
import icon__m2mm from './icon__m2mm.svg';
import icon__github from './icon__github.svg';
import icon__newtab from './icon__newtab.svg';
import icon__newtab_selected from './icon__newtab_selected.svg';

const isOpenInNewTab = ref(false);

let observer: MutationObserver | null = null;

const isChromeExtensionEnv = () => location.href.startsWith('chrome-extension://');
const isAbsoluteUrl = (url) => /^(https?:\/\/|\/\/)/.test(url); // 判断是否是绝对路径 - 匹配 http:// 或 https:// 或 // 的链接

const handleTabOpen = () => {
  const links = document.querySelectorAll('a');
  links.forEach(link => {
    link.addEventListener('click', (event) => {
      event.preventDefault();

      if (!isAbsoluteUrl(link.href)) return;

      const target = link.target || '_self';
      
      if (isChromeExtensionEnv()) {
        target === '_self' ? chrome.tabs.update({ url: link.href }) : chrome.tabs.create({ url: link.href });
      } else {
        target === '_self' ? window.open(link.href, '_self') : window.open(link.href, '_blank');
      }
    });
  });
};

const openInNewTab = () => {
  document.querySelectorAll('a').forEach(a => a.target = '_blank');
  isOpenInNewTab.value = true;
};

const openInCurTab = () => {
  document.querySelectorAll('a').forEach(a => a.target = '_self');
  isOpenInNewTab.value = false;
};

const toggleTabState = () => isOpenInNewTab.value ? openInCurTab() : openInNewTab();

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

let mdStr: string = ''; // msg from user's clipboard

onMounted(async () => {
  await updateMM();
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

const fetchDataFromClipboard = async () => await navigator.clipboard.readText().catch(e => console.error('error - navigator.clipboard.readText =>', e)) as string;
const handleDataBeforeUpdateMM = (data: string) => {
  let result = '';
  // 将 mdStr 中所有的代码块删除，实测当内容中含有代码快时，渲染效果不太好，会导致后续的大量内容丢失。
  // mdStr = mdStr.replace(/```[\s\S]*?```/g, '');

  // for personnal notes --> https://tdahuyou.github.io/notes/
  // 将个人笔记中的目录区域的开始行和结束行的注释内容移除。
  result = data.split('\n').filter(line => !line.includes('region:toc')).join('\n');

  // !for debugger - 将 mdStr 写入剪切板
  navigator.clipboard.writeText(result).catch(e => {
    console.error('error - navigator.clipboard.writeText =>', e);
  });

  return result;
}

/**
 * 读取剪切板中的数据
 * 对数据进行简单的预处理
 * 生成 markmap 思维导图
 */
async function genMM_Clipboard() {
  mdStr = await fetchDataFromClipboard();
  mdStr = handleDataBeforeUpdateMM(mdStr);
  await updateMM();
}

/**
 * 接收来自 TNotes 中的消息
 * 对数据进行简单的预处理
 * 生成 markmap 思维导图
 * @param e 监听到的消息事件。
 */
async function genMM_PostMessage(e: MessageEvent) {
  if (e.data.senderID !== '__TNotes__') return // 消息来源验证
  console.log('m2mm received message event from __TNotes__:', e)
  mdStr = handleDataBeforeUpdateMM(e.data.message);
  await updateMM();
}

/**
 * 使用 post message 实现跨标签页通信。
 * 主要配合 TNotes 中的笔记大纲使用，实现一键生成 markmap 思维导图的功能。
 */
 window.addEventListener('message', genMM_PostMessage)

async function updateMM() {
  await destroyMM(500);
  markmap = Markmap.create(markmapSvgRef.value, {
    initialExpandLevel: expandLevel.value,
    ...defaultOptions
  });
  initToolbar();
  const { root: markmapData } = transformer.transform(mdStr as string);
  if (markmapData) {
    markmap.setData(markmapData);
    await markmap.fit().catch(e => {
      console.error('error - markmap.fit =>', e);
    });
  }
  observeMarkmapChanges();
  handleTabOpen();
}

async function destroyMM(delay = 0) {
  if (markmap) markmap.destroy();
  return new Promise(resolve => setTimeout(resolve, delay));
}

function observeMarkmapChanges() {
  if (observer) observer.disconnect(); // 停止观察
  const markmapContainer = markmapSvgRef.value;

  // 每次 DOM 更新时执行 handleTabOpen
  observer = new MutationObserver(() => {
    console.log('observer');
    handleTabOpen();
  });

  // 配置观察器监听子节点的变动、子树变动等
  observer.observe(markmapContainer, {
    childList: true,    // 监听子节点变动
    subtree: true,      // 监听子树变动
    attributes: true,   // 监听属性变动
  });
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
      <button @click="genMM_Clipboard" title="Paste content from the clipboard and generate a markmap mind map.">paste</button>
      <div title="Input the expand level">level: <input type="number" min="1" step="1" max="100" style="width: 2.5rem;" placeholder="level" v-model="expandLevel"></div>
      <button @click="updateMM" title="Update the expand level.">update</button>
      <span 
        title="toggle open tab" 
        :class="{ selected: isOpenInNewTab }" 
        @click="toggleTabState">
        <img :src="isOpenInNewTab ? icon__newtab_selected : icon__newtab" alt="toggle open tab" />
      </span>
      <a href="https://tdahuyou.github.io/m2mm/" target="_blank" title="m2mm live access link">
        <img :src="icon__m2mm" alt="m2mm live" />
      </a>
      <a href="https://github.com/Tdahuyou/m2mm" target="_blank" title="m2mm GitHub repository">
        <img :src="icon__github" alt="m2mm GitHub" />
      </a>
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

.markmap-wrapper button {
  outline: none;
  border: none;
  background: #666;
  cursor: pointer;
  color: white;
  border-radius: .2rem;
  padding: .2rem .4rem;
}

.markmap-wrapper .btn-group {
  position: relative;
    top: 1rem;
    display: flex;
    gap: 0.8rem;
    justify-content: center;
    height: 1.5rem;
    line-height: 1.5rem;
}

.markmap-wrapper .btn-group a img,
.markmap-wrapper .btn-group span img {
  width: 1.2rem;
  vertical-align: middle;
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
