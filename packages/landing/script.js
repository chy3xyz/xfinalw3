/* Xfinalw3 landing — 轻量交互 + swarm 节点网络 */
;(function () {
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches

  /* ---------- 移动端菜单 ---------- */
  var burger = document.getElementById("navBurger")
  var links = document.getElementById("navLinks")
  if (burger && links) {
    burger.addEventListener("click", function () {
      var open = links.classList.toggle("open")
      burger.setAttribute("aria-expanded", open ? "true" : "false")
    })
  }

  /* ---------- 滚动显现 ---------- */
  var sections = document.querySelectorAll("main section")
  if ("IntersectionObserver" in window && !reduced) {
    sections.forEach(function (s) {
      s.classList.add("reveal")
    })
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) {
            e.target.classList.add("in")
            io.unobserve(e.target)
          }
        })
      },
      { threshold: 0.08 }
    )
    sections.forEach(function (s) {
      io.observe(s)
    })
  }

  /* ---------- 数字滚动 ---------- */
  function fmt(n) {
    return n.toLocaleString("en-US")
  }

  function countUp(el) {
    var target = parseInt(el.getAttribute("data-count"), 10) || 0
    var suffix = el.getAttribute("data-suffix") || ""
    if (reduced) {
      el.textContent = fmt(target) + suffix
      return
    }
    var dur = 1300
    var t0 = null
    function frame(t) {
      if (!t0) t0 = t
      var p = Math.min((t - t0) / dur, 1)
      var eased = 1 - Math.pow(1 - p, 3)
      el.textContent = fmt(Math.round(target * eased)) + suffix
      if (p < 1) requestAnimationFrame(frame)
    }
    requestAnimationFrame(frame)
  }

  var nums = document.querySelectorAll(".num[data-count]")
  if ("IntersectionObserver" in window) {
    var nio = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) {
            countUp(e.target)
            nio.unobserve(e.target)
          }
        })
      },
      { threshold: 0.4 }
    )
    nums.forEach(function (n) {
      nio.observe(n)
    })
  } else {
    nums.forEach(function (n) {
      n.textContent = fmt(parseInt(n.getAttribute("data-count"), 10) || 0)
    })
  }

  /* ---------- Swarm 节点网络动画 ---------- */
  var canvas = document.getElementById("swarmCanvas")
  if (!canvas) return

  var ctx = canvas.getContext("2d")
  if (!ctx) return

  var GOLD = { r: 245, g: 158, b: 11 }
  var CYAN = { r: 34, g: 211, b: 238 }
  var NODE_COUNT = reduced ? 18 : 50
  var CONNECT_DIST = 140
  var DRIFT = reduced ? 0 : 0.22
  var nodes = []
  var animId = null
  var w = 0
  var h = 0

  function rand(min, max) {
    return min + Math.random() * (max - min)
  }

  function pickColor() {
    return Math.random() < 0.5 ? GOLD : CYAN
  }

  function resize() {
    var hero = canvas.parentElement
    var rect = hero
      ? hero.getBoundingClientRect()
      : canvas.getBoundingClientRect()
    var dpr = Math.min(window.devicePixelRatio || 1, 2)
    w = rect.width
    h = rect.height
    canvas.width = Math.floor(w * dpr)
    canvas.height = Math.floor(h * dpr)
    canvas.style.width = w + "px"
    canvas.style.height = h + "px"
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    CONNECT_DIST = Math.min(160, Math.max(90, w * 0.14))
  }

  function initNodes() {
    nodes = []
    for (var i = 0; i < NODE_COUNT; i++) {
      var c = pickColor()
      nodes.push({
        x: rand(0, w),
        y: rand(0, h),
        vx: rand(-DRIFT, DRIFT),
        vy: rand(-DRIFT, DRIFT),
        r: rand(1.4, 2.8),
        color: c,
        pulse: rand(0, Math.PI * 2)
      })
    }
  }

  function drawNode(n, t) {
    var glow = reduced ? 0.35 : 0.45 + Math.sin(t * 0.001 + n.pulse) * 0.15
    var grd = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r * 5)
    grd.addColorStop(
      0,
      "rgba(" + n.color.r + "," + n.color.g + "," + n.color.b + "," + glow + ")"
    )
    grd.addColorStop(
      1,
      "rgba(" + n.color.r + "," + n.color.g + "," + n.color.b + ",0)"
    )
    ctx.fillStyle = grd
    ctx.beginPath()
    ctx.arc(n.x, n.y, n.r * 5, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle =
      "rgba(" + n.color.r + "," + n.color.g + "," + n.color.b + ",0.9)"
    ctx.beginPath()
    ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2)
    ctx.fill()
  }

  function drawConnections(t) {
    for (var i = 0; i < nodes.length; i++) {
      for (var j = i + 1; j < nodes.length; j++) {
        var a = nodes[i]
        var b = nodes[j]
        var dx = a.x - b.x
        var dy = a.y - b.y
        var dist = Math.sqrt(dx * dx + dy * dy)
        if (dist > CONNECT_DIST) continue
        var alpha = (1 - dist / CONNECT_DIST) * (reduced ? 0.18 : 0.32)
        var mix =
          a.color === GOLD && b.color === GOLD
            ? GOLD
            : a.color === CYAN && b.color === CYAN
              ? CYAN
              : { r: 180, g: 190, b: 200 }
        ctx.strokeStyle =
          "rgba(" + mix.r + "," + mix.g + "," + mix.b + "," + alpha + ")"
        ctx.lineWidth = 0.8
        ctx.beginPath()
        ctx.moveTo(a.x, a.y)
        ctx.lineTo(b.x, b.y)
        ctx.stroke()
      }
    }
  }

  function tick(t) {
    if (!reduced) {
      for (var i = 0; i < nodes.length; i++) {
        var n = nodes[i]
        n.x += n.vx
        n.y += n.vy
        if (n.x < 0 || n.x > w) n.vx *= -1
        if (n.y < 0 || n.y > h) n.vy *= -1
        n.x = Math.max(0, Math.min(w, n.x))
        n.y = Math.max(0, Math.min(h, n.y))
      }
    }

    ctx.clearRect(0, 0, w, h)
    drawConnections(t)
    for (var j = 0; j < nodes.length; j++) {
      drawNode(nodes[j], t)
    }

    if (!reduced) {
      animId = requestAnimationFrame(tick)
    }
  }

  function start() {
    resize()
    initNodes()
    if (animId) cancelAnimationFrame(animId)
    tick(0)
  }

  var resizeTimer
  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer)
    resizeTimer = setTimeout(start, 120)
  })

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(start)
  } else {
    start()
  }
})()
