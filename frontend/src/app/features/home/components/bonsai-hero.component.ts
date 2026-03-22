import {
  Component,
  OnInit,
  OnDestroy,
  ElementRef,
  ViewChild,
  AfterViewInit,
  NgZone,
  HostListener
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

@Component({
  selector: 'app-bonsai-hero',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <section class="bonsai-hero">
      <div class="hero-left">
        <div class="main-text-row">
          <div class="vertical-text-wrap">
            <span class="vertical-text">ponsai</span>
          </div>

          <div class="text-block">
            <h1 class="title-art">THE ART</h1>
            <p class="title-sub">
              <span class="dash"></span>
              OF TREE GROWING
            </p>
            <p class="art-desc">
              In the most restrictive sense, "bonsai" refers to<br>
              miniaturized, container-grown trees adhering to<br>
              Japanese tradition and principles.
            </p>
            <a routerLink="/shop" class="btn-explore">explore</a>
          </div>
        </div>

      </div>

      <div class="hero-right" #container>
        <div class="gray-block"></div>
        <div class="bg-number">PONSAI</div>

        <div class="loading-overlay" *ngIf="isLoading">
          <div class="loading-spinner"></div>
          <span class="loading-text">Loading</span>
        </div>

        <canvas #canvas></canvas>
      </div>
    </section>
  `,
  styles: [`
    .bonsai-hero {
      display: flex;
      height: 100vh;
      width: 100%;
      overflow: hidden;
      font-family: system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", "Liberation Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji";
      position: relative;
    }

    .hero-left {
      width: 45%;
      display: flex;
      flex-direction: column;
      justify-content: center;
      position: relative;
      background: transparent;
      z-index: 2;
    }

    .main-text-row {
      display: flex;
      align-items: flex-start;
      margin-left: 10rem;
      margin-top: -5rem;
      position: relative;
      z-index: 1;
    }

    .vertical-text-wrap {
      margin-right: 3rem;
      display: flex;
    }

    .vertical-text {
      writing-mode: vertical-rl;
      transform: rotate(180deg);
      font-size: 6rem;
      font-weight: 300;
      letter-spacing: 0.15em;
      color: #000;
      line-height: 1;
      pointer-events: none;
      user-select: none;
    }

    .text-block {
      padding-top: 0.5rem;
    }

    .title-art {
      font-size: 4rem;
      font-weight: 300;
      letter-spacing: 0.08em;
      color: #000;
      margin: 0 0 0.5rem;
      line-height: 1;
      text-transform: uppercase;
    }

    .title-sub {
      display: flex;
      align-items: center;
      gap: 1rem;
      font-size: 0.95rem;
      font-weight: 400;
      letter-spacing: 0.25em;
      color: #000;
      text-transform: uppercase;
      margin: 0 0 2rem;
    }

    .dash {
      display: inline-block;
      width: 3.5rem;
      height: 1.5px;
      background: var(--deep-space-blue);
      flex-shrink: 0;
    }

    .art-desc {
      font-size: 0.75rem;
      color: #000;
      line-height: 1.8;
      margin: 0 0 2rem;
      font-weight: 300;
      letter-spacing: 0.03em;
    }

    .btn-explore {
      position: relative;
      width: 120px;
      height: 40px;
      background-color: #000;
      display: flex;
      align-items: center;
      color: white;
      flex-direction: column;
      justify-content: center;
      border: none;
      padding: 12px;
      gap: 12px;
      border-radius: 8px;
      cursor: pointer;
      text-decoration: none;
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }

    .btn-explore::before {
      content: '';
      position: absolute;
      inset: 0;
      left: -4px;
      top: -1px;
      margin: auto;
      width: 128px;
      height: 48px;
      border-radius: 10px;
      background: linear-gradient(-45deg, #2cff5d 0%, #40c9ff 100%);
      z-index: -10;
      pointer-events: none;
      transition: all 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }

    .btn-explore::after {
      content: '';
      z-index: -1;
      position: absolute;
      inset: 0;
      background: linear-gradient(-45deg, #2cff5d 0%, #00dbde 100%);
      transform: translate3d(0, 0, 0) scale(0.95);
      filter: blur(20px);
    }

    .btn-explore:hover::after {
      filter: blur(30px);
    }

    .btn-explore:hover::before {
      transform: rotate(-180deg);
    }

    .btn-explore:active::before {
      scale: 0.7;
    }

    .hero-right {
      flex: 1;
      position: relative;
      overflow: hidden;
      background: transparent;
    }

    .gray-block {
      position: absolute;
      left: -15%;
      top: 40%;
      width: 115%;
      height: 22%;
      background: var(--yale-blue-rgb);
      z-index: 1;
      pointer-events: none;
    }

    .bg-number {
      position: absolute;
      left: 0;
      right: 0;
      top: 40%;
      height: 22%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 7rem;
      font-weight: 800;
      color: #ffffff;
      line-height: 1;
      letter-spacing: 2.5rem;
      font-family: system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", "Liberation Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji";
      z-index: 2;
      pointer-events: none;
      user-select: none;
      overflow: hidden;
    }

    canvas {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      display: block;
      z-index: 3;
      cursor: grab;
    }

    canvas:active {
      cursor: grabbing;
    }

    .loading-overlay {
      position: absolute;
      inset: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: transparent;
      z-index: 10;
      gap: 1rem;
    }

    .loading-spinner {
      width: 34px;
      height: 34px;
      border: 2px solid #ddd;
      border-top-color: #2d5a3d;
      border-radius: 50%;
      animation: spin 0.85s linear infinite;
    }

    .loading-text {
      font-size: 0.7rem;
      letter-spacing: 0.2em;
      color: #999;
      text-transform: uppercase;
    }

    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }

    @media (max-width: 900px) {
      .bonsai-hero {
        flex-direction: column;
        height: auto;
      }

      .hero-left {
        width: 100%;
        padding: 8rem 2rem 3rem 2rem;
        min-height: 55vh;
      }

      .main-text-row {
        margin-left: 0;
        margin-top: 0;
      }

      .text-block {
        margin-left: 6rem;
      }

      .hero-right {
        width: 100%;
        height: 50vh;
      }

      .title-art {
        font-size: 2.6rem;
      }

    }
  `]
})
export class BonsaiHeroComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('canvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('container', { static: true }) containerRef!: ElementRef<HTMLElement>;

  isLoading = true;

  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private animationId = 0;
  private isRenderLoopActive = false;
  private isDestroyed = false;
  private model: THREE.Object3D | null = null;
  private intersectionObserver: IntersectionObserver | null = null;
  private isInViewport = true;
  private isPageVisible = true;
  private lowPowerMode = false;
  private shadowsEnabled = true;
  private frameIntervalMs = 1000 / 45;
  private lastFrameTime = 0;

  private cameraDistance = 5.5;
  private cameraAngle = Math.PI * 0.15;
  private cameraPolarAngle = Math.PI * 0.35;
  private targetDistance = 5.5;
  private isDragging = false;
  private lastMouseX = 0;
  private lastMouseY = 0;
  private cameraTarget = new THREE.Vector3(0, 1.0, 0);

  constructor(private ngZone: NgZone) {}

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    this.ngZone.runOutsideAngular(() => {
      this.setupVisibilityOptimization();
      this.initScene();
      this.loadModel();
      this.syncRenderLoopState();
    });
  }

  ngOnDestroy(): void {
    this.isDestroyed = true;
    this.stopRenderLoop();

    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
      this.intersectionObserver = null;
    }

    this.disposeModel();

    if (this.renderer) {
      this.renderer.dispose();
    }

    if (this.scene) {
      this.scene.clear();
    }
  }

  @HostListener('wheel', ['$event'])
  onWheel(event: WheelEvent): void {
    const delta = -event.deltaY * 0.005;
    const newDistance = this.targetDistance + delta;
    if (newDistance >= 1.5 && newDistance <= 10) {
      event.preventDefault();
      this.targetDistance = newDistance;
    }
  }

  @HostListener('mousedown', ['$event'])
  onMouseDown(event: MouseEvent): void {
    if (event.button === 0) {
      if (event.target !== this.canvasRef.nativeElement) {
        return;
      }
      this.isDragging = true;
      this.lastMouseX = event.clientX;
      this.lastMouseY = event.clientY;
    }
  }

  @HostListener('document:mouseup')
  onMouseUp(): void {
    this.isDragging = false;
  }

  @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: MouseEvent): void {
    if (!this.isDragging) {
      return;
    }

    const deltaX = event.clientX - this.lastMouseX;
    const deltaY = event.clientY - this.lastMouseY;

    this.cameraAngle += deltaX * 0.005;
    this.cameraPolarAngle = Math.max(0.1, Math.min(Math.PI * 0.6, this.cameraPolarAngle - deltaY * 0.003));

    this.lastMouseX = event.clientX;
    this.lastMouseY = event.clientY;
  }

  @HostListener('window:resize')
  onResize(): void {
    if (!this.renderer || !this.camera) {
      return;
    }

    const width = this.containerRef.nativeElement.clientWidth;
    const height = this.containerRef.nativeElement.clientHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, this.lowPowerMode ? 1 : 1.5));
    this.renderer.setSize(width, height, false);
  }

  @HostListener('document:visibilitychange')
  onVisibilityChange(): void {
    this.isPageVisible = !document.hidden;
    this.syncRenderLoopState();
  }

  private initScene(): void {
    const host = this.containerRef.nativeElement;
    const width = host.clientWidth;
    const height = host.clientHeight;

    this.lowPowerMode = this.detectLowPowerMode();
    this.shadowsEnabled = !this.lowPowerMode;
    this.frameIntervalMs = this.lowPowerMode ? 1000 / 30 : 1000 / 45;

    this.scene = new THREE.Scene();
    this.scene.background = null;

    this.camera = new THREE.PerspectiveCamera(38, width / height, 0.01, 200);
    this.updateCameraPosition();

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvasRef.nativeElement,
      antialias: !this.lowPowerMode,
      alpha: true,
      powerPreference: this.lowPowerMode ? 'default' : 'high-performance'
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, this.lowPowerMode ? 1 : 1.5));
    this.renderer.setSize(width, height, false);
    this.renderer.shadowMap.enabled = this.shadowsEnabled;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = this.lowPowerMode ? 1.4 : 1.6;

    this.setupLights();
    this.addGroundShadow();
  }

  private setupLights(): void {
    this.scene.add(new THREE.AmbientLight(0xffffff, this.lowPowerMode ? 1.2 : 1.1));

    const keyLight = new THREE.DirectionalLight(0xfff5e8, this.lowPowerMode ? 2.0 : 2.5);
    keyLight.position.set(3, 6, 4);
    keyLight.castShadow = this.shadowsEnabled;
    if (this.shadowsEnabled) {
      keyLight.shadow.mapSize.width = 1024;
      keyLight.shadow.mapSize.height = 1024;
      keyLight.shadow.camera.near = 0.5;
      keyLight.shadow.camera.far = 30;
      keyLight.shadow.camera.left = -5;
      keyLight.shadow.camera.right = 5;
      keyLight.shadow.camera.top = 5;
      keyLight.shadow.camera.bottom = -5;
    }
    this.scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xe8f2ff, this.lowPowerMode ? 0.8 : 1.0);
    fillLight.position.set(-4, 2, -2);
    this.scene.add(fillLight);

    if (!this.lowPowerMode) {
      const rimLight = new THREE.PointLight(0xffffff, 0.4);
      rimLight.position.set(0, 8, -4);
      this.scene.add(rimLight);
    }
  }

  private addGroundShadow(): void {
    const shadow = new THREE.Mesh(
      new THREE.CircleGeometry(1.5, 64),
      new THREE.MeshBasicMaterial({
        color: 0x000000,
        transparent: true,
        opacity: 0.07,
        depthWrite: false
      })
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.01;
    this.scene.add(shadow);
  }

  private loadModel(): void {
    const loader = new GLTFLoader();
    loader.load(
      'assets/demo-import/3d-trees/tree2.glb',
      (gltf) => {
        const model = gltf.scene;

        model.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            mesh.castShadow = this.shadowsEnabled;
            mesh.receiveShadow = false;
          }
        });

        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());
        const maxDimension = Math.max(size.x, size.y, size.z);
        model.scale.setScalar(1.9 / maxDimension);

        const centeredBox = new THREE.Box3().setFromObject(model);
        const center = centeredBox.getCenter(new THREE.Vector3());
        model.position.x = -center.x;
        model.position.y = -centeredBox.min.y;
        model.position.z = -center.z;

        this.cameraTarget.y = (centeredBox.max.y - centeredBox.min.y) * 0.45;

        this.model = model;
        this.scene.add(model);
        this.ngZone.run(() => {
          this.isLoading = false;
        });
      },
      undefined,
      (error) => {
        console.error('GLB load error:', error);
        this.ngZone.run(() => {
          this.isLoading = false;
        });
      }
    );
  }

  private startRenderLoop(): void {
    if (this.isRenderLoopActive) {
      return;
    }

    this.isRenderLoopActive = true;
    this.lastFrameTime = performance.now();
    this.animationId = requestAnimationFrame(this.renderFrame);
  }

  private stopRenderLoop(): void {
    if (!this.isRenderLoopActive) {
      return;
    }

    this.isRenderLoopActive = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = 0;
    }
  }

  private readonly renderFrame = (time: number): void => {
    if (this.isDestroyed || !this.isRenderLoopActive) {
      return;
    }

    this.animationId = requestAnimationFrame(this.renderFrame);

    const deltaMs = time - this.lastFrameTime;
    if (deltaMs < this.frameIntervalMs) {
      return;
    }

    const deltaSec = deltaMs / 1000;
    this.lastFrameTime = time;

    if (this.model) {
      const rotationSpeed = this.lowPowerMode ? 0.22 : 0.35;
      this.model.rotation.y += rotationSpeed * deltaSec;
    }

    const zoomLerp = Math.min(1, deltaSec * 8);
    this.cameraDistance += (this.targetDistance - this.cameraDistance) * zoomLerp;
    this.updateCameraPosition();

    this.renderer.render(this.scene, this.camera);
  };

  private setupVisibilityOptimization(): void {
    this.isPageVisible = !document.hidden;

    if ('IntersectionObserver' in window) {
      this.intersectionObserver = new IntersectionObserver(
        (entries) => {
          this.isInViewport = entries.some((entry) => entry.isIntersecting);
          this.syncRenderLoopState();
        },
        {
          threshold: 0.05
        }
      );

      this.intersectionObserver.observe(this.containerRef.nativeElement);
    }
  }

  private syncRenderLoopState(): void {
    const shouldRender = this.isPageVisible && this.isInViewport && !this.isDestroyed;
    if (shouldRender) {
      this.startRenderLoop();
      return;
    }

    this.stopRenderLoop();
  }

  private detectLowPowerMode(): boolean {
    const nav = navigator as Navigator & { deviceMemory?: number };
    const memory = nav.deviceMemory ?? 8;
    const cores = nav.hardwareConcurrency ?? 8;
    const isSmallScreen = window.innerWidth <= 1024;

    return memory <= 4 || cores <= 4 || isSmallScreen;
  }

  private disposeModel(): void {
    if (!this.model) {
      return;
    }

    this.model.traverse((child) => {
      if (!(child as THREE.Mesh).isMesh) {
        return;
      }

      const mesh = child as THREE.Mesh;
      mesh.geometry.dispose();

      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      for (const material of materials) {
        const materialWithMaps = material as THREE.Material & {
          map?: THREE.Texture;
          normalMap?: THREE.Texture;
          roughnessMap?: THREE.Texture;
          metalnessMap?: THREE.Texture;
          aoMap?: THREE.Texture;
          emissiveMap?: THREE.Texture;
          alphaMap?: THREE.Texture;
        };

        materialWithMaps.map?.dispose();
        materialWithMaps.normalMap?.dispose();
        materialWithMaps.roughnessMap?.dispose();
        materialWithMaps.metalnessMap?.dispose();
        materialWithMaps.aoMap?.dispose();
        materialWithMaps.emissiveMap?.dispose();
        materialWithMaps.alphaMap?.dispose();
        material.dispose();
      }
    });

    this.scene.remove(this.model);
    this.model = null;
  }

  private updateCameraPosition(): void {
    const distance = this.cameraDistance;
    const polar = this.cameraPolarAngle;
    const azimuth = this.cameraAngle;

    this.camera.position.set(
      distance * Math.sin(polar) * Math.sin(azimuth),
      distance * Math.cos(polar),
      distance * Math.sin(polar) * Math.cos(azimuth)
    );
    this.camera.lookAt(this.cameraTarget);
  }
}
