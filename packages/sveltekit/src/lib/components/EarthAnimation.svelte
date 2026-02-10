<script lang="ts">
  import { onMount } from 'svelte';
  
  let svgElement: SVGSVGElement | null = null;
  
  onMount(() => {
    // 确保动画在客户端运行
  });
</script>

<svg width="800" height="400" viewBox="0 0 800 400" xmlns="http://www.w3.org/2000/svg">
  <defs>
      <!-- 渐变定义 -->
      <linearGradient id="bgGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:#000000;stop-opacity:0.95" />
          <stop offset="100%" style="stop-color:#000000;stop-opacity:0.8" />
      </linearGradient>
      
      <!-- 流体光轨渐变 -->
      <linearGradient id="gradBlue" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style="stop-color:#0066ff;stop-opacity:0.8" />
          <stop offset="50%" style="stop-color:#00ccff;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#66ffff;stop-opacity:0.9" />
      </linearGradient>
      
      <linearGradient id="gradPurple" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style="stop-color:#6600ff;stop-opacity:0.8" />
          <stop offset="50%" style="stop-color:#cc00ff;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#ff66ff;stop-opacity:0.9" />
      </linearGradient>
      
      <linearGradient id="gradCyan" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style="stop-color:#00ffcc;stop-opacity:0.8" />
          <stop offset="50%" style="stop-color:#00ffff;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#66ffff;stop-opacity:0.9" />
      </linearGradient>
      
      <linearGradient id="gradGold" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style="stop-color:#ff9900;stop-opacity:0.8" />
          <stop offset="50%" style="stop-color:#ffcc00;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#ffff66;stop-opacity:0.9" />
      </linearGradient>
      
      <linearGradient id="gradMagenta" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style="stop-color:#ff0066;stop-opacity:0.8" />
          <stop offset="50%" style="stop-color:#ff3399;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#ff66cc;stop-opacity:0.9" />
      </linearGradient>
      
      <linearGradient id="gradGreen" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style="stop-color:#00ff66;stop-opacity:0.8" />
          <stop offset="50%" style="stop-color:#66ff99;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#99ffcc;stop-opacity:0.9" />
      </linearGradient>
      
      <!-- 核心环渐变 -->
      <radialGradient id="coreGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" style="stop-color:#ffffff;stop-opacity:1" />
          <stop offset="30%" style="stop-color:#00ccff;stop-opacity:0.9" />
          <stop offset="70%" style="stop-color:#6600ff;stop-opacity:0.6" />
          <stop offset="100%" style="stop-color:#0066ff;stop-opacity:0" />
      </radialGradient>
      
      <!-- 流动模糊滤镜 -->
      <filter id="flowBlur" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur" />
          <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
          </feMerge>
      </filter>
      
      <!-- 强光滤镜 -->
      <filter id="glow" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
          <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
          </feMerge>
      </filter>
      
      <!-- 闪电粒子形状 -->
      <path id="lightning" d="M0,-8 L3,-2 L1,-2 L4,4 L2,4 L5,10 L-2,2 L0,2 L-3,-4 L-1,-4 Z" fill="#fff" filter="url(#glow)">
      </path>
  </defs>
  
  <!-- 背景 -->
  <rect width="800" height="400" fill="url(#bgGrad)" rx="12" ry="12"/>
  
  <!-- 链节点阵背景 -->
  <g id="chainDots" opacity="0.4">
      <!-- 使用JavaScript生成或预置随机点 -->
      <circle cx="50" cy="50" r="1.5" fill="#4a5568">
          <animate attributeName="opacity" values="0.2;0.8;0.2" dur="3s" repeatCount="indefinite" begin="0s"/>
      </circle>
      <circle cx="150" cy="80" r="1.5" fill="#4a5568">
          <animate attributeName="opacity" values="0.2;0.8;0.2" dur="4s" repeatCount="indefinite" begin="0.5s"/>
      </circle>
      <circle cx="650" cy="120" r="1.5" fill="#4a5568">
          <animate attributeName="opacity" values="0.2;0.8;0.2" dur="3.5s" repeatCount="indefinite" begin="1s"/>
      </circle>
      <circle cx="750" cy="60" r="1.5" fill="#4a5568">
          <animate attributeName="opacity" values="0.2;0.8;0.2" dur="2.8s" repeatCount="indefinite" begin="1.5s"/>
      </circle>
      <circle cx="100" cy="350" r="1.5" fill="#4a5568">
          <animate attributeName="opacity" values="0.2;0.8;0.2" dur="3.2s" repeatCount="indefinite" begin="2s"/>
      </circle>
      <circle cx="700" cy="320" r="1.5" fill="#4a5568">
          <animate attributeName="opacity" values="0.2;0.8;0.2" dur="2.5s" repeatCount="indefinite" begin="0.3s"/>
      </circle>
      <circle cx="200" cy="30" r="1.5" fill="#4a5568">
          <animate attributeName="opacity" values="0.2;0.8;0.2" dur="3.8s" repeatCount="indefinite" begin="1.2s"/>
      </circle>
      <circle cx="600" cy="40" r="1.5" fill="#4a5568">
          <animate attributeName="opacity" values="0.2;0.8;0.2" dur="4.2s" repeatCount="indefinite" begin="2.5s"/>
      </circle>
      <circle cx="80" cy="200" r="2" fill="#00ccff" opacity="0.3">
          <animate attributeName="opacity" values="0.1;0.5;0.1" dur="5s" repeatCount="indefinite" begin="0s"/>
      </circle>
      <circle cx="720" cy="180" r="2" fill="#6600ff" opacity="0.3">
          <animate attributeName="opacity" values="0.1;0.5;0.1" dur="4s" repeatCount="indefinite" begin="2s"/>
      </circle>
      <!-- 链节连接线 -->
      <line x1="50" y1="50" x2="150" y2="80" stroke="#4a5568" stroke-width="0.5" opacity="0.2"/>
      <line x1="650" y1="120" x2="750" y2="60" stroke="#4a5568" stroke-width="0.5" opacity="0.2"/>
  </g>
  
  <!-- 六边形算力引擎底座 -->
  <g transform="translate(400,200)" filter="url(#glow)">
      <!-- 六边形外框 -->
      <polygon points="120,-69.28 120,69.28 0,138.56 -120,69.28 -120,-69.28 0,-138.56" 
               fill="none" stroke="#2d3748" stroke-width="2" opacity="0.6"/>
      <polygon points="110,-63.51 110,63.51 0,127.02 -110,63.51 -110,-63.51 0,-127.02" 
               fill="none" stroke="#4a5568" stroke-width="1" opacity="0.4"/>
      
      <!-- 内部网格结构 -->
      <line x1="0" y1="0" x2="120" y2="-69.28" stroke="#2d3748" stroke-width="1" opacity="0.3"/>
      <line x1="0" y1="0" x2="120" y2="69.28" stroke="#2d3748" stroke-width="1" opacity="0.3"/>
      <line x1="0" y1="0" x2="0" y2="138.56" stroke="#2d3748" stroke-width="1" opacity="0.3"/>
      <line x1="0" y1="0" x2="-120" y2="69.28" stroke="#2d3748" stroke-width="1" opacity="0.3"/>
      <line x1="0" y1="0" x2="-120" y2="-69.28" stroke="#2d3748" stroke-width="1" opacity="0.3"/>
      <line x1="0" y1="0" x2="0" y2="-138.56" stroke="#2d3748" stroke-width="1" opacity="0.3"/>
  </g>
  
  <!-- 流体光轨组 -->
  <g transform="translate(400,200)" filter="url(#flowBlur)">
      <!-- 光轨1: 蓝色 - 从右上到中心 -->
      <path d="M 120,-69.28 Q 60,-34.64 0,0" fill="none" stroke="url(#gradBlue)" stroke-width="4" stroke-linecap="round" opacity="0.9">
          <animate attributeName="stroke-dasharray" values="0,200;100,200;200,200" dur="0.6s" repeatCount="indefinite"/>
          <animate attributeName="stroke-dashoffset" values="0;-100;-200" dur="0.6s" repeatCount="indefinite"/>
      </path>
      
      <!-- 光轨2: 紫色 - 从右到中心 -->
      <path d="M 120,69.28 Q 60,34.64 0,0" fill="none" stroke="url(#gradPurple)" stroke-width="4" stroke-linecap="round" opacity="0.9">
          <animate attributeName="stroke-dasharray" values="0,200;100,200;200,200" dur="0.6s" repeatCount="indefinite" begin="0.1s"/>
          <animate attributeName="stroke-dashoffset" values="0;-100;-200" dur="0.6s" repeatCount="indefinite" begin="0.1s"/>
      </path>
      
      <!-- 光轨3: 青色 - 从下到中心 -->
      <path d="M 0,138.56 Q 0,69.28 0,0" fill="none" stroke="url(#gradCyan)" stroke-width="4" stroke-linecap="round" opacity="0.9">
          <animate attributeName="stroke-dasharray" values="0,200;100,200;200,200" dur="0.6s" repeatCount="indefinite" begin="0.2s"/>
          <animate attributeName="stroke-dashoffset" values="0;-100;-200" dur="0.6s" repeatCount="indefinite" begin="0.2s"/>
      </path>
      
      <!-- 光轨4: 金色 - 从左下到中心 -->
      <path d="M -120,69.28 Q -60,34.64 0,0" fill="none" stroke="url(#gradGold)" stroke-width="4" stroke-linecap="round" opacity="0.9">
          <animate attributeName="stroke-dasharray" values="0,200;100,200;200,200" dur="0.6s" repeatCount="indefinite" begin="0.3s"/>
          <animate attributeName="stroke-dashoffset" values="0;-100;-200" dur="0.6s" repeatCount="indefinite" begin="0.3s"/>
      </path>
      
      <!-- 光轨5: 品红 - 从左上到中心 -->
      <path d="M -120,-69.28 Q -60,-34.64 0,0" fill="none" stroke="url(#gradMagenta)" stroke-width="4" stroke-linecap="round" opacity="0.9">
          <animate attributeName="stroke-dasharray" values="0,200;100,200;200,200" dur="0.6s" repeatCount="indefinite" begin="0.4s"/>
          <animate attributeName="stroke-dashoffset" values="0;-100;-200" dur="0.6s" repeatCount="indefinite" begin="0.4s"/>
      </path>
      
      <!-- 光轨6: 绿色 - 从上到下中心 -->
      <path d="M 0,-138.56 Q 0,-69.28 0,0" fill="none" stroke="url(#gradGreen)" stroke-width="4" stroke-linecap="round" opacity="0.9">
          <animate attributeName="stroke-dasharray" values="0,200;100,200;200,200" dur="0.6s" repeatCount="indefinite" begin="0.5s"/>
          <animate attributeName="stroke-dashoffset" values="0;-100;-200" dur="0.6s" repeatCount="indefinite" begin="0.5s"/>
      </path>
  </g>
  
  <!-- 流动性核心环 -->
  <g transform="translate(400,200)">
      <!-- 外环旋转 -->
      <g>
          <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="1s" repeatCount="indefinite"/>
          <!-- 主环 -->
          <circle r="35" fill="none" stroke="url(#coreGrad)" stroke-width="3" filter="url(#glow)"/>
          <!-- 内环反向旋转 -->
          <circle r="25" fill="none" stroke="url(#coreGrad)" stroke-width="2" opacity="0.8">
              <animateTransform attributeName="transform" type="rotate" from="360" to="0" dur="0.5s" repeatCount="indefinite"/>
          </circle>
          <!-- 核心光点 -->
          <circle r="15" fill="url(#coreGrad)" opacity="0.9">
              <animate attributeName="r" values="12;18;12" dur="1s" repeatCount="indefinite"/>
              <animate attributeName="opacity" values="0.7;1;0.7" dur="1s" repeatCount="indefinite"/>
          </circle>
          
          <!-- 3个微缩闪电粒子 - 每圈释放 -->
          <g>
              <!-- 闪电1 -->
              <g transform="rotate(0) translate(45,0)">
                  <use href="#lightning" transform="scale(0.8)">
                      <animate attributeName="opacity" values="1;0" dur="1s" repeatCount="indefinite"/>
                      <animateTransform attributeName="transform" type="translate" values="0,0; 20,0" dur="1s" repeatCount="indefinite"/>
                  </use>
              </g>
              <!-- 闪电2 - 120度延迟 -->
              <g transform="rotate(120) translate(45,0)">
                  <use href="#lightning" transform="scale(0.8)">
                      <animate attributeName="opacity" values="1;0" dur="1s" begin="0.33s" repeatCount="indefinite"/>
                      <animateTransform attributeName="transform" type="translate" values="0,0; 20,0" dur="1s" begin="0.33s" repeatCount="indefinite"/>
                  </use>
              </g>
              <!-- 闪电3 - 240度延迟 -->
              <g transform="rotate(240) translate(45,0)">
                  <use href="#lightning" transform="scale(0.8)">
                      <animate attributeName="opacity" values="1;0" dur="1s" begin="0.66s" repeatCount="indefinite"/>
                      <animateTransform attributeName="transform" type="translate" values="0,0; 20,0" dur="1s" begin="0.66s" repeatCount="indefinite"/>
                  </use>
              </g>
          </g>
      </g>
      
      <!-- 脉冲扩散效果 -->
      <circle r="40" fill="none" stroke="#00ccff" stroke-width="1" opacity="0">
          <animate attributeName="r" values="35;60" dur="1s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="0.6;0" dur="1s" repeatCount="indefinite"/>
      </circle>
  </g>
  
  <!-- 文字标识 -->
  <text x="400" y="380" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" fill="#a0aec0" letter-spacing="3" opacity="0.8">
      XFINALW3
      <animate attributeName="opacity" values="0.8;1;0.8" dur="3s" repeatCount="indefinite"/>
  </text>
  <text x="400" y="360" text-anchor="middle" font-family="Arial, sans-serif" font-size="10" fill="#4a5568" letter-spacing="2">
      WEB3 DEVELOPMENT FRAMEWORK
  </text>
</svg>


<style>
  /* svg {
    filter: drop-shadow(0 0 0 20px rgba(245, 166, 35, 0.4));
  } */
</style>
