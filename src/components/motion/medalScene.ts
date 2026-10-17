import * as T from 'three'

// Geometry, camera and studio lighting from the approved perks/scene.js model.
export function createMedalScene(canvas: HTMLCanvasElement, metalColor: string, onUnavailable: () => void) {
  const renderer = new T.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'low-power' })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
  renderer.setClearColor(0, 0)
  renderer.toneMapping = T.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.1
  const scene = new T.Scene(), view = 2.6
  const camera = new T.OrthographicCamera(-view / 2, view / 2, view / 2, -view / 2, .1, 30)
  camera.position.set(0, 1.05, 7); camera.lookAt(0, .1, 0)
  const group = new T.Group()
  scene.add(group)
  const materials = new Set<T.Material>(), geometries = new Set<T.BufferGeometry>()
  const material = (color: string, metalness = .25, roughness = .25) => {
    const result = new T.MeshPhysicalMaterial({ color, metalness, roughness, clearcoat: .8, clearcoatRoughness: .14, envMapIntensity: .65 })
    materials.add(result); return result
  }
  const mesh = (geometry: T.BufferGeometry, surface: T.Material, parent: T.Object3D, x = 0, y = 0, z = 0) => {
    geometries.add(geometry); materials.add(surface)
    const object = new T.Mesh(geometry, surface)
    object.position.set(x, y, z); parent.add(object); return object
  }
  const metal = material(metalColor, .84, .22)
  const face = material(metalColor === '#ced8e2' ? '#91a8b9' : `#${new T.Color(metalColor).multiplyScalar(.68).getHexString()}`, .76, .3)
  const blue = material('#0054d5', .3, .23)
  for (const side of [-1, 1]) {
    const shape = new T.Shape(), w = .36, h = 1.15, r = .025
    shape.moveTo(-w / 2 + r, -h / 2 + r); shape.lineTo(w / 2 - r, -h / 2 + r)
    shape.lineTo(w / 2 - r, h / 2 - r); shape.lineTo(-w / 2 + r, h / 2 - r); shape.closePath()
    const ribbon = new T.ExtrudeGeometry(shape, { depth: .025, bevelEnabled: true, bevelSize: r, bevelThickness: r, bevelSegments: 4, steps: 1 })
    ribbon.translate(0, 0, -.0125)
    mesh(ribbon, blue, group, side * .29, .74, -.1).rotation.z = -side * .39
  }
  mesh(new T.CylinderGeometry(.67, .67, .16, 64), metal, group, 0, -.08).rotation.x = Math.PI / 2
  mesh(new T.CylinderGeometry(.575, .575, .03, 64), face, group, 0, -.08, .1).rotation.x = Math.PI / 2
  mesh(new T.TorusGeometry(.60, .035, 10, 64), metal, group, 0, -.08, .13)
  const star = new T.Shape()
  for (let i = 0; i < 10; i++) {
    const angle = i * Math.PI / 5 + Math.PI / 2, radius = i % 2 ? .20 : .43
    const x = Math.cos(angle) * radius, y = Math.sin(angle) * radius
    if (i === 0) star.moveTo(x, y); else star.lineTo(x, y)
  }
  star.closePath()
  mesh(new T.ExtrudeGeometry(star, { depth: .055, bevelEnabled: true, bevelThickness: .027, bevelSize: .027, bevelSegments: 3, steps: 1 }), metal, group, 0, -.08, .13)

  const room = new T.Scene(); room.background = new T.Color('#8495a8')
  for (const [x, y, z, w, h] of [[-3, 2, 3, 2, 5], [3, 3, 0, 2, 4], [0, 5, -2, 4, 2]] as const) {
    mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ color: new T.Color(3, 3, 3), side: T.DoubleSide }), room, x, y, z).lookAt(0, 0, 0)
  }
  const generator = new T.PMREMGenerator(renderer)
  const environment = generator.fromScene(room, .05, .1, 30, { size: 64 }); generator.dispose()
  scene.environment = environment.texture
  scene.add(new T.HemisphereLight('#ecfaff', '#466689', .9))
  for (const [x, y, z, intensity] of [[-3, 4, 5, 2.6], [4, 1, 3, 1.1], [0, 4, -3, 1.5]] as const) {
    const light = new T.DirectionalLight('#ffffff', intensity); light.position.set(x, y, z); scene.add(light)
  }
  let enabled = false, reduced = true, disposed = false, time = 0, last = 0, pulse = -1
  const render = () => {
    const progress = pulse < 0 ? 0 : Math.min(pulse / 1.5, 1)
    const spin = reduced ? 0 : (1 - (1 - progress) ** 3) * Math.PI * 2
    group.position.y = -.15
    group.rotation.set(.12, -.32 + (enabled && !reduced ? Math.sin(time * .7) * .17 : 0) + spin, -.08)
    renderer.render(scene, camera)
  }
  const frame = (now: number) => {
    if (last && now - last < 1000 / 30) return
    const delta = last ? Math.min((now - last) / 1000, .05) : 0
    last = now; time += delta
    if (pulse >= 0) { pulse += delta; if (pulse >= 1.5) pulse = -1 }
    render()
  }
  const sync = () => {
    if (disposed) return
    last = 0; renderer.setAnimationLoop(enabled && !reduced ? frame : null); render()
  }
  const lost = (event: Event) => { event.preventDefault(); renderer.setAnimationLoop(null); onUnavailable() }
  canvas.addEventListener('webglcontextlost', lost)
  return {
    resize(width: number, height: number) {
      if (disposed || !width || !height) return
      camera.left = -view / 2 * width / height; camera.right = view / 2 * width / height
      camera.updateProjectionMatrix(); renderer.setSize(width, height, false); render()
    },
    setEnabled(value: boolean, reduceMotion: boolean) { enabled = value; reduced = reduceMotion; sync() },
    celebrate() { if (!enabled || disposed || reduced) return; pulse = 0; sync() },
    dispose() {
      if (disposed) return
      disposed = true; renderer.setAnimationLoop(null); canvas.removeEventListener('webglcontextlost', lost)
      geometries.forEach(item => item.dispose()); materials.forEach(item => item.dispose())
      environment.dispose(); renderer.dispose(); renderer.forceContextLoss()
    },
  }
}
