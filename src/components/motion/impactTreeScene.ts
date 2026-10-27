import * as T from 'three'
import { growthBetween, safeHelpCount, treeGrowth } from './impactTreeGrowth'

// All geometry is local. Instancing keeps over a thousand individual leaves
// inexpensive; no downloaded model, video, external texture or network request.
export function createImpactTreeScene(canvas: HTMLCanvasElement, initialCount: number, onUnavailable: () => void) {
  const renderer = new T.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'low-power' })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
  renderer.setClearColor(0, 0)
  renderer.toneMapping = T.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.1
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = T.PCFSoftShadowMap
  const scene = new T.Scene()
  const camera = new T.OrthographicCamera(-2.3, 2.3, 2.6, -2.6, .1, 30)
  camera.position.set(0, 4.8, 11); camera.lookAt(0, 2, 0)
  const root = new T.Group(), tree = new T.Group()
  scene.add(root); root.add(tree)
  const geometries = new Set<T.BufferGeometry>(), materials = new Set<T.Material>(), textures = new Set<T.Texture>()
  const geometry = <G extends T.BufferGeometry>(value: G) => { geometries.add(value); return value }
  const material = <M extends T.Material>(value: M) => { materials.add(value); return value }
  const mesh = (g: T.BufferGeometry, m: T.Material, parent: T.Object3D) => {
    const result = new T.Mesh(geometry(g), m)
    result.castShadow = true; result.receiveShadow = true; parent.add(result); return result
  }
  let seed = 73491
  const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296 }
  const leafTextureCanvas = document.createElement('canvas')
  leafTextureCanvas.width = 128; leafTextureCanvas.height = 256
  const ctx = leafTextureCanvas.getContext('2d')!
  ctx.fillStyle = '#e0edcc'; ctx.fillRect(0, 0, 128, 256)
  const gradient = ctx.createLinearGradient(0, 0, 128, 0)
  gradient.addColorStop(0, '#c6dcb3'); gradient.addColorStop(.48, '#f0f5d9'); gradient.addColorStop(.53, '#b1cca3'); gradient.addColorStop(1, '#d2e6bf')
  ctx.fillStyle = gradient; ctx.fillRect(0, 0, 128, 256)
  ctx.strokeStyle = '#9cb58d'; ctx.lineWidth = 1.5
  for (let y = 26; y < 245; y += 24) {
    for (const side of [-1, 1]) {
      ctx.beginPath(); ctx.moveTo(64, y); ctx.bezierCurveTo(64 + side * 20, y - 9, 64 + side * 39, y - 28, 64 + side * 62, y - 39); ctx.stroke()
    }
  }
  ctx.strokeStyle = '#f6f8df'; ctx.lineWidth = 2
  ctx.beginPath(); ctx.moveTo(64, 256); ctx.lineTo(64, 0); ctx.stroke()
  const leafMap = new T.CanvasTexture(leafTextureCanvas)
  leafMap.colorSpace = T.SRGBColorSpace; leafMap.anisotropy = 4; textures.add(leafMap)
  const leafMaterial = material(new T.MeshStandardMaterial({ color: '#ffffff', map: leafMap, side: T.DoubleSide, roughness: .68, metalness: 0 }))
  const barkCanvas = document.createElement('canvas'); barkCanvas.width = 128; barkCanvas.height = 256
  const bc = barkCanvas.getContext('2d')!
  bc.fillStyle = '#aaa'; bc.fillRect(0, 0, 128, 256)
  for (let i = 0; i < 90; i++) {
    const x = random() * 128
    bc.strokeStyle = i % 3 ? '#707070' : '#dedede'; bc.lineWidth = .3 + random() * 1.1
    bc.beginPath(); bc.moveTo(x, 0)
    bc.bezierCurveTo(x + 6, 80, x - 8, 170, x + 2, 256); bc.stroke()
  }
  const bark = new T.CanvasTexture(barkCanvas); bark.wrapS = T.RepeatWrapping; textures.add(bark)
  const woodMaterial = material(new T.MeshStandardMaterial({ vertexColors: true, roughness: .87, bumpMap: bark, bumpScale: .038 }))
  const grassMaterial = material(new T.MeshStandardMaterial({ side: T.DoubleSide, roughness: .95 }))
  const leafVertices: number[] = [], leafUvs: number[] = [], leafIndices: number[] = []
  // A folded, curved almond, with an actual central ridge and pointed tip.
  for (let j = 0; j <= 10; j++) {
    const t = j / 10, halfWidth = Math.pow(Math.sin(Math.PI * t), .8) * .29
    for (let k = 0; k <= 4; k++) {
      const u = k / 2 - 1
      leafVertices.push(u * halfWidth, t, Math.sin(t * Math.PI) * (.13 - Math.abs(u) * .13) + t * t * .13)
      leafUvs.push(k / 4, t)
      if (j < 10 && k < 4) { const a = j * 5 + k; leafIndices.push(a, a + 1, a + 5, a + 1, a + 6, a + 5) }
    }
  }
  const leafGeometry = geometry(new T.BufferGeometry())
  leafGeometry.setAttribute('position', new T.Float32BufferAttribute(leafVertices, 3)); leafGeometry.setAttribute('uv', new T.Float32BufferAttribute(leafUvs, 2))
  leafGeometry.setIndex(leafIndices); leafGeometry.computeVertexNormals()
  const dummy = new T.Object3D(), color = new T.Color()
  const crownPalette = ['#24877b', '#258970', '#399c72', '#59ae74', '#85b965', '#b2cf71', '#58b3a0']
  function makeCrown(n: number, radii: [number, number, number]) {
    const group = new T.Group()
    const leaves = new T.InstancedMesh(leafGeometry, leafMaterial, n)
    leaves.castShadow = true; leaves.receiveShadow = true
    group.add(leaves)
    for (let i = 0; i < n; i++) {
      const phi = i * 2.39996323, y = 1 - 2 * (i + .5) / n, r = Math.sqrt(1 - y * y)
      const jitter = .80 + random() * .24
      const x = Math.cos(phi) * r, z = Math.sin(phi) * r
      dummy.position.set(x * radii[0] * jitter, y * radii[1] * jitter, z * radii[2] * jitter)
      const direction = new T.Vector3(x * .7, y * .45 + .48, z * .75).normalize()
      dummy.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), direction)
      dummy.rotateY(random() * Math.PI * 2)
      dummy.scale.setScalar(.24 + random() * .17)
      dummy.updateMatrix(); leaves.setMatrixAt(i, dummy.matrix)
      const tone = Math.min(crownPalette.length - 1, Math.floor(random() * 4 + Math.max(0, y + x * .5) * 2))
      leaves.setColorAt(i, color.set(crownPalette[tone]!))
    }
    return group
  }
  function branch(points: number[][], radius: number, parent: T.Object3D) {
    const curve = new T.CatmullRomCurve3(points.map(p => new T.Vector3(...p)))
    const tubular = 64, radial = 48, frames = curve.computeFrenetFrames(tubular, false)
    const positions: number[] = [], colors: number[] = [], indices: number[] = [], uvs: number[] = []
    for (let i = 0; i <= tubular; i++) {
      const t = i / tubular, p = curve.getPointAt(t)
      for (let j = 0; j <= radial; j++) {
        const angle = j / radial * Math.PI * 2, ridge = 1 + .035 * Math.sin(angle * 9 + t * 7) + .015 * Math.cos(angle * 15 - t * 12)
        const rad = radius * Math.pow(1 - t * .91, .8) * ridge
        const v = p.clone().addScaledVector(frames.normals[i]!, -Math.cos(angle) * rad).addScaledVector(frames.binormals[i]!, Math.sin(angle) * rad)
        positions.push(v.x, v.y, v.z)
        uvs.push(j / radial, t)
        color.set('#9e713f').multiplyScalar(.82 + .2 * Math.sin(angle * 9 + t * 7) + .15 * Math.sin(angle * 2 + 1))
        colors.push(color.r, color.g, color.b)
        if (i < tubular && j < radial) { const a = i * (radial + 1) + j; indices.push(a, a + radial + 1, a + 1, a + 1, a + radial + 1, a + radial + 2) }
      }
    }
    const g = new T.BufferGeometry()
    g.setAttribute('position', new T.Float32BufferAttribute(positions, 3)); g.setAttribute('color', new T.Float32BufferAttribute(colors, 3)); g.setAttribute('uv', new T.Float32BufferAttribute(uvs, 2)); g.setIndex(indices); g.computeVertexNormals()
    return mesh(g, woodMaterial, parent)
  }
  const seedling = new T.Group(); tree.add(seedling)
  branch([[0, .08, 0], [.04, .39, 0], [-.07, .73, 0], [0, 1.12, 0]], .028, seedling)
  const youngLeaf = material(new T.MeshStandardMaterial({ color: '#77b576', map: leafMap, side: T.DoubleSide, roughness: .65 }))
  for (const [side, y, length] of [[-1, .45, .60], [1, .55, .57], [-1, .93, .48], [1, 1.02, .43]] as const) {
    const leaf = mesh(leafGeometry, youngLeaf, seedling)
    leaf.position.set(0, y, .02); leaf.scale.setScalar(length); leaf.rotation.set(.16, side * .3, side * .9)
  }
  const trunk = new T.Group(); tree.add(trunk)
  branch([[-.2, .1, 0], [.2, .53, .04], [.34, 1.02, 0], [-.12, 1.48, 0], [-.25, 2.05, -.04], [-.08, 2.66, 0], [.08, 3.18, 0]], .38, trunk)
  for (let i = 0; i < 7; i++) {
    const a = i / 7 * Math.PI * 2
    branch([[-.15, .45, 0], [Math.cos(a) * .33, .18, Math.sin(a) * .24], [Math.cos(a) * .67, .10, Math.sin(a) * .46]], .095, trunk)
  }
  const top = makeCrown(640, [.88, .58, .72]); top.position.set(-.03, 3.07, 0); trunk.add(top)
  for (const side of [-1, 1]) {
    branch([[-.13, 2.13, 0], [side * .42, 2.65, .03], [side * .70, 2.98, .04]], .10, trunk)
  }
  const left = new T.Group(), right = new T.Group(); trunk.add(left, right)
  left.position.set(-.1, 1.35, 0); right.position.set(.12, .80, 0)
  branch([[0, 0, 0], [-.40, .03, .03], [-.85, .14, .03], [-1.03, .67, .03]], .13, left)
  branch([[0, 0, 0], [.43, .41, -.02], [.72, .83, 0], [.97, 1.04, 0]], .16, right)
  const leftCrown = makeCrown(300, [.65, .40, .55]); leftCrown.position.set(-1.05, .74, 0); left.add(leftCrown)
  const rightCrown = makeCrown(300, [.64, .42, .56]); rightCrown.position.set(1.01, 1.11, 0); right.add(rightCrown)
  const sprout = new T.Group(); sprout.position.set(.08, 3.52, 0); trunk.add(sprout)
  branch([[0, 0, 0], [.04, .19, 0], [0, .38, 0]], .019, sprout)
  for (const side of [-1, 1]) {
    const bud = mesh(leafGeometry, material(new T.MeshStandardMaterial({ color: side < 0 ? '#3c9e91' : '#b0c95e', map: leafMap, side: T.DoubleSide, roughness: .6 })), sprout)
    bud.position.set(.03, .18, 0); bud.scale.setScalar(.36); bud.rotation.z = side * .9; bud.rotation.y = side * .4
  }
  // An earthy oval island with grasses, stones and small shoots; no floating disc.
  const island = mesh(new T.SphereGeometry(1, 48, 20), material(new T.MeshStandardMaterial({ color: '#678950', roughness: 1 })), root)
  island.position.y = .035; island.scale.set(1.28, .12, .91)
  const grassGeometry = geometry(new T.BufferGeometry())
  grassGeometry.setAttribute('position', new T.Float32BufferAttribute([-.025, 0, 0, .025, 0, 0, .012, .13, .025, 0, .22, .075], 3))
  grassGeometry.setIndex([0, 1, 2, 0, 2, 3]); grassGeometry.computeVertexNormals()
  const grass = new T.InstancedMesh(grassGeometry, grassMaterial, 1800); root.add(grass)
  grass.receiveShadow = true
  for (let i = 0; i < grass.count; i++) {
    const a = random() * Math.PI * 2, r = Math.sqrt(random()), x = Math.cos(a) * r * 1.25, z = Math.sin(a) * r * .88
    dummy.position.set(x, .08 + Math.sqrt(1 - r * r) * .04, z); dummy.rotation.set(0, random() * 6.28, (random() - .5) * .5); dummy.scale.setScalar(.35 + random() * .5)
    dummy.updateMatrix(); grass.setMatrixAt(i, dummy.matrix); grass.setColorAt(i, color.set(['#467d42', '#588f45', '#73a34c', '#8caf52'][Math.floor(random() * 4)]!))
  }
  const stoneMaterial = material(new T.MeshStandardMaterial({ color: '#a2aca0', roughness: .96 }))
  for (const [x, z, s] of [[-.60, .40, .24], [.63, .05, .24], [-.95, .1, .14], [.37, .66, .10], [.85, .40, .12]] as const) {
    const stone = mesh(new T.IcosahedronGeometry(1, 2), stoneMaterial, root)
    stone.position.set(x, .10, z); stone.scale.set(s * 1.3, s * .65, s); stone.rotation.set(random(), random(), random())
  }
  for (let i = 0; i < 12; i++) {
    const a = i * 2.4, r = .7 + random() * .25
    const shoot = new T.Group(); shoot.position.set(Math.cos(a) * r, .13, Math.sin(a) * r * .75); root.add(shoot)
    for (let j = 0; j < 4; j++) {
      const leaf = mesh(leafGeometry, leafMaterial, shoot)
      leaf.scale.setScalar(.12 + random() * .12); leaf.rotation.set(.4, j * 1.5, j % 2 ? .65 : -.65)
    }
  }
  const shadowCanvas = document.createElement('canvas'); shadowCanvas.width = 128; shadowCanvas.height = 128
  const sc = shadowCanvas.getContext('2d')!, sg = sc.createRadialGradient(64, 64, 4, 64, 64, 64)
  sg.addColorStop(0, '#17464e55'); sg.addColorStop(.5, '#17464e25'); sg.addColorStop(1, '#17464e00')
  sc.fillStyle = sg; sc.fillRect(0, 0, 128, 128)
  const shadowMap = new T.CanvasTexture(shadowCanvas); textures.add(shadowMap)
  const shadow = mesh(new T.PlaneGeometry(4.1, 3.3), material(new T.MeshBasicMaterial({ map: shadowMap, transparent: true, depthWrite: false })), root)
  shadow.rotation.x = -Math.PI / 2; shadow.position.y = -.055; shadow.castShadow = false; shadow.receiveShadow = false
  scene.add(new T.HemisphereLight('#efffff', '#67866a', 1.4))
  const key = new T.DirectionalLight('#fff0c8', 2.4); key.position.set(3.5, 7, 5); key.castShadow = true
  key.shadow.mapSize.set(1024, 1024); key.shadow.camera.left = -3; key.shadow.camera.right = 3; key.shadow.camera.top = 5; key.shadow.camera.bottom = -2
  key.shadow.normalBias = .03; key.shadow.bias = -.0002; key.shadow.radius = 3; key.shadow.intensity = .65; scene.add(key)
  const fill = new T.DirectionalLight('#abe8f4', 1.2); fill.position.set(-4, 3.8, 2); scene.add(fill)
  const rim = new T.DirectionalLight('#f1ffb9', 1.3); rim.position.set(1.5, 5, -3); scene.add(rim)

  let target = safeHelpCount(initialCount), shown = target, active = false, reduced = false, disposed = false
  let frame = 0, last = 0, time = 0, tap = 0, tiltX = 0, tiltY = 0
  function draw(delta = 0) {
    shown += (target - shown) * (1 - Math.exp(-delta * 3))
    if (Math.abs(target - shown) < .001) shown = target
    const growth = treeGrowth(shown)
    seedling.scale.setScalar((1 + growthBetween(shown, 0, 5) * .15) * (1 - growthBetween(shown, 5, 15)))
    seedling.visible = shown < 15; trunk.visible = shown > 2
    trunk.scale.set(.30 + growth.trunk * .70, growth.trunk, .30 + growth.trunk * .70)
    top.scale.setScalar(growth.crown)
    left.scale.setScalar(growth.left); right.scale.setScalar(growth.right)
    top.children[0]!.scale.setScalar(.87 + growth.fullness * .13)
    leftCrown.scale.setScalar(.82 + growth.fullness * .18); rightCrown.scale.copy(leftCrown.scale)
    sprout.scale.setScalar(growth.sprouts)
    const breeze = reduced ? 0 : Math.sin(time * 1.1) * .012
    const response = reduced ? 0 : Math.sin(tap * 9) * tap * .09
    tree.rotation.z = breeze + response
    top.rotation.z = breeze * 1.6; leftCrown.rotation.z = -breeze * 2; rightCrown.rotation.z = breeze * 2
    root.rotation.y += ((reduced ? 0 : tiltX * .35) - root.rotation.y) * .12
    root.rotation.x += ((reduced ? 0 : tiltY * .08) - root.rotation.x) * .12
    renderer.render(scene, camera)
  }
  function animate(now: number) {
    if (!active || reduced || disposed) { frame = 0; return }
    frame = requestAnimationFrame(animate)
    if (now - last < 1000 / 30) return
    const delta = Math.min((now - (last || now)) / 1000, .15); last = now
    time += delta; tap = Math.max(0, tap - delta * .7); draw(delta)
  }
  const contextLost = (event: Event) => { event.preventDefault(); if (!disposed) onUnavailable() }
  canvas.addEventListener('webglcontextlost', contextLost)
  return {
    resize(width: number, height: number) {
      if (disposed || width <= 0 || height <= 0) return
      renderer.setSize(width, height, false)
      const vertical = Math.max(4.65, 4.4 / (width / height)), horizontal = vertical * width / height
      camera.left = -horizontal / 2; camera.right = horizontal / 2; camera.top = vertical / 2; camera.bottom = -vertical / 2
      camera.updateProjectionMatrix(); draw()
    },
    setCount(count: number) { target = safeHelpCount(count); if (!active || reduced) { shown = target; draw() } },
    setEnabled(enabled: boolean, reduce: boolean) {
      if (disposed) return
      active = enabled; reduced = reduce
      canvas.dataset.motion = reduce ? 'reduced' : enabled ? 'running' : 'paused'
      cancelAnimationFrame(frame); frame = 0; last = 0
      if (reduce) { shown = target; tap = 0; time = 0; root.rotation.set(0, 0, 0) }
      if (enabled) { draw(); if (!reduce) frame = requestAnimationFrame(animate) }
    },
    celebrate() { if (active && !reduced && !disposed) tap = 1 },
    tilt(x: number, y: number) { tiltX = x; tiltY = y },
    dispose() {
      if (disposed) return
      disposed = true; cancelAnimationFrame(frame); canvas.removeEventListener('webglcontextlost', contextLost)
      scene.traverse(object => { if (object instanceof T.InstancedMesh) object.dispose() })
      geometries.forEach(g => g.dispose()); materials.forEach(m => m.dispose()); textures.forEach(t => t.dispose())
      renderer.dispose(); renderer.forceContextLoss()
    },
  }
}
