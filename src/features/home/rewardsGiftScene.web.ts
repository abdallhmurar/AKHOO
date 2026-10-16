import {
  AmbientLight, CanvasTexture, CatmullRomCurve3, DirectionalLight,
  DoubleSide, ExtrudeGeometry, Group, HemisphereLight, Mesh, MeshBasicMaterial,
  MeshPhysicalMaterial, OrthographicCamera, PlaneGeometry, Scene, Shape,
  SRGBColorSpace, Vector3, WebGLRenderer, BufferGeometry, Float32BufferAttribute, PMREMGenerator
} from 'three'
import type { Material, Texture } from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'

// Loaded only by the web rewards button, once it enters the viewport.
export function createRewardsGift(canvas: HTMLCanvasElement, onUnavailable: () => void, onCelebrating: (value: boolean) => void, { idle = true }: { idle?: boolean } = {}) {
  const renderer = new WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'low-power' })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
  renderer.outputColorSpace = SRGBColorSpace
  renderer.setClearColor(0x000000, 0)
  const scene = new Scene()
  const camera = new OrthographicCamera(-2, 2, 1.8, -1.8, 0.1, 30)
  camera.position.set(2.5, 2.8, 8)
  camera.lookAt(-0.05, 0.16, 0)
  const studio = new RoomEnvironment()
  const pmrem = new PMREMGenerator(renderer)
  const environment = pmrem.fromScene(studio, 0.04, 0.1, 100, { size: 64 })
  scene.environment = environment.texture
  scene.environmentIntensity = 0.65
  studio.dispose()
  pmrem.dispose()
  const geometries = new Set<BufferGeometry>()
  const materials = new Set<Material>()
  const textures = new Set<Texture>()
  const material = (color: string, metalness = 0.1) => {
    const result = new MeshPhysicalMaterial({ color, metalness, roughness: 0.24, clearcoat: 0.8, clearcoatRoughness: 0.2, side: DoubleSide })
    materials.add(result)
    return result
  }
  const blue = material('#1375ff'), lidBlue = material('#459dff')
  const teal = material('#039985', 0.35), gold = material('#ffbd39', 0.3)
  const couponBlue = material('#0860ed')
  function mesh(geometry: BufferGeometry, surface: Material, parent: Group | Scene) {
    geometries.add(geometry)
    const object = new Mesh(geometry, surface)
    parent.add(object)
    return object
  }
  function box(parent: Group, width: number, height: number, depth: number, surface: Material, x = 0, y = 0, z = 0, radius = 0.06) {
    const object = mesh(new RoundedBoxGeometry(width, height, depth, 3, radius), surface, parent)
    object.position.set(x, y, z)
    return object
  }
  scene.add(new AmbientLight(0xffffff, 0.65), new HemisphereLight(0xeaf6ff, 0x7da2a6, 1))
  const key = new DirectionalLight(0xffffff, 2.5)
  key.position.set(-3, 6, 5)
  const rim = new DirectionalLight(0xc7e7ff, 1.8)
  rim.position.set(4, 2, -3)
  scene.add(key, rim)

  const gift = new Group()
  gift.position.set(0.18, -0.25, 0)
  gift.rotation.y = -0.15
  scene.add(gift)
  // Four walls and a recessed interior make the opened box a real hollow object.
  box(gift, 1.4, 0.12, 1.22, blue, 0, -0.5)
  box(gift, 1.4, 1.02, 0.13, blue, 0, 0, 0.55)
  box(gift, 1.4, 1.02, 0.13, blue, 0, 0, -0.55)
  box(gift, 0.13, 1.02, 1.04, blue, -0.64)
  box(gift, 0.13, 1.02, 1.04, blue, 0.64)
  box(gift, 0.25, 1.02, 0.035, teal, 0, 0, 0.63, 0.01)
  box(gift, 0.25, 1.02, 0.035, teal, 0, 0, -0.63, 0.01)
  box(gift, 0.035, 1.02, 0.23, teal, -0.715, 0, 0, 0.01)
  box(gift, 0.035, 1.02, 0.23, teal, 0.715, 0, 0, 0.01)
  const lid = new Group()
  lid.position.y = 0.59
  gift.add(lid)
  box(lid, 1.54, 0.24, 1.36, lidBlue)
  box(lid, 0.26, 0.27, 1.38, teal, 0, 0, 0, 0.025)
  box(lid, 1.56, 0.27, 0.24, teal, 0, 0, 0, 0.025)

  // Wide curved ribbon strips, rather than tubes, give the bow its satin folds.
  function ribbon(points: Vector3[], width: number) {
    const curve = new CatmullRomCurve3(points)
    const positions: number[] = [], indices: number[] = []
    for (let i = 0; i <= 32; i++) {
      const point = curve.getPoint(i / 32)
      positions.push(point.x, point.y, point.z - width / 2, point.x, point.y, point.z + width / 2)
      if (i < 32) { const j = i * 2; indices.push(j, j + 1, j + 2, j + 1, j + 3, j + 2) }
    }
    const geometry = new BufferGeometry()
    geometry.setAttribute('position', new Float32BufferAttribute(positions, 3))
    geometry.setIndex(indices)
    geometry.computeVertexNormals()
    mesh(geometry, teal, lid)
  }
  for (const side of [-1, 1]) ribbon([
    new Vector3(0, 0.22, 0), new Vector3(side * 0.43, 0.78, -0.04),
    new Vector3(side * 0.64, 0.63, 0.02), new Vector3(side * 0.39, 0.3, 0.04), new Vector3(0, 0.21, 0.02)
  ], 0.24)
  box(lid, 0.29, 0.24, 0.28, teal, 0, 0.26, 0.03, 0.09)

  const coupon = new Group()
  coupon.position.set(-0.6, -0.22, 0.94)
  coupon.rotation.set(-0.06, -0.13, -0.19)
  coupon.scale.setScalar(1.16)
  gift.add(coupon)
  box(coupon, 1, 0.7, 0.08, couponBlue, 0, 0, 0, 0.08)
  const labelCanvas = document.createElement('canvas')
  labelCanvas.width = 128; labelCanvas.height = 128
  const labelContext = labelCanvas.getContext('2d')
  if (labelContext) {
    labelContext.fillStyle = '#ffffff'
    labelContext.font = 'bold 100px Arial'
    labelContext.textAlign = 'center'; labelContext.textBaseline = 'middle'
    labelContext.fillText('%', 64, 70)
  }
  const labelTexture = new CanvasTexture(labelCanvas)
  labelTexture.colorSpace = SRGBColorSpace
  textures.add(labelTexture)
  const labelMaterial = new MeshBasicMaterial({ map: labelTexture, transparent: true, depthWrite: false })
  materials.add(labelMaterial)
  const label = mesh(new PlaneGeometry(0.65, 0.65), labelMaterial, coupon)
  label.position.z = 0.046

  const starShape = new Shape()
  const starPoints = [[0, 1], [0.24, 0.24], [1, 0], [0.24, -0.24], [0, -1], [-0.24, -0.24], [-1, 0], [-0.24, 0.24]]
  starPoints.forEach(([x = 0, y = 0], i) => i ? starShape.lineTo(x, y) : starShape.moveTo(x, y))
  starShape.closePath()
  const starGeometry = new ExtrudeGeometry(starShape, { depth: 0.1, bevelEnabled: true, bevelSize: 0.05, bevelThickness: 0.03, bevelSegments: 1, steps: 1 })
  const stars = Array.from({ length: 5 }, (_, i) => {
    const star = mesh(starGeometry, gold, scene)
    const angle = (i / 5) * Math.PI * 2
    const position = new Vector3(Math.cos(angle) * 1.22 - 0.1, Math.sin(angle) * 0.75 + 0.45, 0.3)
    star.position.copy(position)
    star.scale.setScalar(i < 2 ? 0.12 : 0.07)
    return { star, position, angle }
  })

  let enabled = false, reduced = false, disposed = false, lost = false
  let time = 0, previous = 0, lastFrame = 0, celebration = -1
  function pose() {
    const still = reduced || (!idle && celebration < 0)
    const wave = still ? 0 : Math.sin(time * 1.5)
    const progress = celebration < 0 ? 0 : Math.min(celebration / 1.8, 1)
    const open = celebration < 0 ? 0 : reduced ? 0.7 : Math.sin(Math.PI * progress) ** 0.65
    gift.position.y = -0.25 + wave * 0.035
    gift.rotation.y = -0.15 + (still ? 0 : Math.sin(time * 0.8) * 0.09)
    gift.rotation.z = still ? 0 : Math.sin(time * 1.2) * 0.025
    lid.position.y = 0.59 + open * 0.42
    lid.rotation.set(-open * 0.14, open * 0.12, -open * 0.09)
    coupon.rotation.z = -0.19 - open * 0.1
    for (const [i, { star, position, angle }] of stars.entries()) {
      star.position.copy(position)
      star.position.x += Math.cos(angle) * open * 0.25
      star.position.y += open * (0.2 + i * 0.04)
      star.rotation.y = still ? 0 : time * 0.4 + i
      star.scale.setScalar((i < 2 ? 0.12 : 0.07) * (1 + open * 0.65 + (still ? 0 : Math.sin(time * 2 + i) * 0.12)))
    }
    renderer.render(scene, camera)
  }
  function tick(now: number) {
    if (now - lastFrame < 1000 / 30) return
    const delta = previous ? Math.min((now - previous) / 1000, 0.08) : 0
    previous = now; lastFrame = now; time += delta
    if (celebration >= 0) {
      celebration += delta
      if (celebration >= 1.8) { celebration = -1; onCelebrating(false) }
    }
    pose()
    if ((reduced || !idle) && celebration < 0) renderer.setAnimationLoop(null)
  }
  function sync() {
    previous = 0
    renderer.setAnimationLoop(enabled && !lost && ((!reduced && idle) || celebration >= 0) ? tick : null)
    if (!lost) pose()
  }
  function contextLost(event: Event) {
    event.preventDefault()
    lost = true
    renderer.setAnimationLoop(null)
    onUnavailable()
  }
  canvas.addEventListener('webglcontextlost', contextLost)
  return {
    resize(width: number, height: number) {
      if (disposed || lost || !width || !height) return
      const halfHeight = 1.47, halfWidth = halfHeight * width / height
      camera.left = -halfWidth; camera.right = halfWidth
      camera.top = halfHeight; camera.bottom = -halfHeight
      camera.updateProjectionMatrix()
      renderer.setSize(width, height, false)
      pose()
    },
    setEnabled(value: boolean, reducedMotion: boolean) {
      if (disposed) return
      enabled = value; reduced = reducedMotion
      sync()
    },
    celebrate() {
      if (disposed || lost || !enabled) return
      celebration = 0
      onCelebrating(true)
      sync()
    },
    dispose() {
      disposed = true
      renderer.setAnimationLoop(null)
      canvas.removeEventListener('webglcontextlost', contextLost)
      geometries.forEach(geometry => geometry.dispose())
      materials.forEach(surface => surface.dispose())
      textures.forEach(texture => texture.dispose())
      environment.dispose()
      renderer.dispose()
      renderer.forceContextLoss()
    }
  }
}
