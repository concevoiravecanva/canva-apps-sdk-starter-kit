import React, { useState, useRef, useEffect } from "react";
import * as THREE from "three";
import { RoundedBoxGeometry } from 'three-stdlib';
import { Rows, Text, Select, Button, ColorSelector, Box, Slider, Columns, Column, Accordion, AccordionItem, Checkbox } from "@canva/app-ui-kit";
import { addElementAtPoint } from "@canva/design";
import { useIntl } from "react-intl";
import "styles/components.css";
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import venice_sunset from 'assets/hdr/venice_sunset_1k.hdr';
import HelpPage from "./HelpPage";
import { InfoIcon } from "@canva/app-ui-kit";

type Shape = "cube" | "sphere" | "cylinder" | "donut" | "cone" | "torusKnot" | "icosahedron" | "dodecahedron" | "vase" | "capsule" | "octahedron" | "tetrahedron";
type MaterialType = "matte" | "metal" | "glass" | "velvet" | "toon" | "wireframe" | "plastic" | "porcelain" | "normal" | "lambert";

const defaultState = {
  shape: "cube" as Shape,
  twist: 0,
  roundness: 0.1,
  taper: 0,
  noise: 0,
  rotationX: 0,
  rotationY: 0,
  rotationZ: 0,
  mainColor: "#4A90E2",
  shadowTint: "#1E3A5F",
  lightColor: "#FFFFFF",
  lightX: 5,
  lightY: 10,
  lightZ: 7.5,
  shadowIntensity: 0.8,
  ambientIntensity: 0.5,
  materialType: "matte" as MaterialType,
  donutTube: 0.4,
  knotP: 2,
  knotQ: 3,
  isTransparent: true,
  backgroundColor: "#FFFFFF",
  backgroundOpacity: 1,
  wireframeOverlay: false,
};

const App = () => {
  const intl = useIntl();
  const [shape, setShape] = useState<Shape>(defaultState.shape);
  const [twist, setTwist] = useState(defaultState.twist);
  const [roundness, setRoundness] = useState(defaultState.roundness);
  const [taper, setTaper] = useState(defaultState.taper);
  const [noise, setNoise] = useState(defaultState.noise);
  const [rotationX, setRotationX] = useState(defaultState.rotationX);
  const [rotationY, setRotationY] = useState(defaultState.rotationY);
  const [rotationZ, setRotationZ] = useState(defaultState.rotationZ);
  const [mainColor, setMainColor] = useState(defaultState.mainColor);
  const [shadowTint, setShadowTint] = useState(defaultState.shadowTint);
  const [lightColor, setLightColor] = useState(defaultState.lightColor);
  const [lightX, setLightX] = useState(defaultState.lightX);
  const [lightY, setLightY] = useState(defaultState.lightY);
  const [lightZ, setLightZ] = useState(defaultState.lightZ);
  const [shadowIntensity, setShadowIntensity] = useState(defaultState.shadowIntensity);
  const [ambientIntensity, setAmbientIntensity] = useState(defaultState.ambientIntensity);
  const [materialType, setMaterialType] = useState<MaterialType>(defaultState.materialType);
  const [donutTube, setDonutTube] = useState(defaultState.donutTube);
  const [knotP, setKnotP] = useState(defaultState.knotP);
  const [knotQ, setKnotQ] = useState(defaultState.knotQ);
  const [isTransparent, setIsTransparent] = useState(defaultState.isTransparent);
  const [backgroundColor, setBackgroundColor] = useState(defaultState.backgroundColor);
  const [backgroundOpacity, setBackgroundOpacity] = useState(defaultState.backgroundOpacity);
  const [wireframeOverlay, setWireframeOverlay] = useState(defaultState.wireframeOverlay);
  const [exportSize, setExportSize] = useState(1024);
  const [showHelp, setShowHelp] = useState(false);

  const mountRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);

  const shapes: Shape[] = ["cube", "sphere", "cylinder", "donut", "cone", "torusKnot", "icosahedron", "dodecahedron", "vase", "capsule", "octahedron", "tetrahedron"];
  const materials: MaterialType[] = ["matte", "plastic", "metal", "glass", "porcelain", "velvet", "toon", "lambert", "normal", "wireframe"];

  // Initialize Scene and Renderer once on mount
  useEffect(() => {
    if (!mountRef.current || rendererRef.current) return;

    const width = 328;
    const height = 328;
    const renderScale = 8; // Increased from 4 to 8 for better anti-aliasing

    // --- Scene, Camera, Renderer Setup ---
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true,
    });
    renderer.setSize(width * renderScale, height * renderScale);
    renderer.setClearColor(0x000000, 0);
    rendererRef.current = renderer;

    const canvas = renderer.domElement;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    mountRef.current.appendChild(canvas);

    // --- Environment Map ---
    new RGBELoader().load(venice_sunset, function (texture) {
      texture.mapping = THREE.EquirectangularReflectionMapping;
      if (sceneRef.current) {
        sceneRef.current.environment = texture;
      }
    });

    // --- Cleanup on unmount ---
    return () => {
      renderer.dispose();
      if (mountRef.current) {
        mountRef.current.innerHTML = "";
      }
      rendererRef.current = null;
      sceneRef.current = null;
      cameraRef.current = null;
    };
  }, []);


  // Update and Render scene on property change
  useEffect(() => {
    const scene = sceneRef.current;
    const camera = cameraRef.current;
    const renderer = rendererRef.current;

    if (!scene || !camera || !renderer) return;

    // --- Clear previous objects ---
    while (scene.children.length > 0) {
      const obj = scene.children[0];
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose();
        if (Array.isArray(obj.material)) {
          obj.material.forEach(material => material.dispose());
        } else {
          obj.material.dispose();
        }
      }
      scene.remove(obj);
    }
    
    if (isTransparent) {
        renderer.setClearAlpha(0);
    } else {
        renderer.setClearColor(backgroundColor);
        renderer.setClearAlpha(backgroundOpacity);
    }

    // --- Lights ---
    const ambientLight = new THREE.AmbientLight(lightColor, ambientIntensity);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(new THREE.Color(lightColor), shadowIntensity);
    directionalLight.position.set(lightX, lightY, lightZ);
    scene.add(directionalLight);

    const createMesh = (geometry: THREE.BufferGeometry) => {
      let material: THREE.Material;
      switch (materialType) {
        case 'metal':
          material = new THREE.MeshStandardMaterial({ color: new THREE.Color(mainColor), roughness: 0.1, metalness: 0.9, emissive: new THREE.Color(shadowTint).multiplyScalar(0.1) });
          break;
        case 'glass':
          material = new THREE.MeshPhysicalMaterial({ color: new THREE.Color(mainColor), roughness: 0, metalness: 0.1, transmission: 1.0, ior: 1.5, thickness: 1.0 });
          break;
        case 'velvet':
          material = new THREE.MeshPhysicalMaterial({ color: new THREE.Color(mainColor), roughness: 1, metalness: 0.1, sheen: 0.7, sheenRoughness: 0.3, sheenColor: new THREE.Color(shadowTint) });
          break;
        case 'toon':
          material = new THREE.MeshToonMaterial({ color: new THREE.Color(mainColor) });
          break;
        case 'wireframe':
          material = new THREE.MeshBasicMaterial({ color: new THREE.Color(mainColor), wireframe: true });
          break;
        case 'plastic':
          material = new THREE.MeshStandardMaterial({ color: new THREE.Color(mainColor), roughness: 0.4, metalness: 0.05 });
          break;
        case 'porcelain':
          material = new THREE.MeshPhysicalMaterial({ color: new THREE.Color(mainColor), roughness: 0.1, metalness: 0.1, transmission: 0.2, sheen: 0.5, sheenColor: new THREE.Color(shadowTint) });
          break;
        case 'normal':
          material = new THREE.MeshNormalMaterial();
          break;
        case 'lambert':
          material = new THREE.MeshLambertMaterial({ color: new THREE.Color(mainColor) });
          break;
        case 'matte':
        default:
          material = new THREE.MeshStandardMaterial({ color: new THREE.Color(mainColor), roughness: 0.9, metalness: 0.1, emissive: new THREE.Color(shadowTint).multiplyScalar(0.2) });
          break;
      }

      const mesh = new THREE.Mesh(geometry, material);
      scene.add(mesh);

      // Rotation
      mesh.rotation.set(
        THREE.MathUtils.degToRad(rotationX),
        THREE.MathUtils.degToRad(rotationY),
        THREE.MathUtils.degToRad(rotationZ)
      );

      // Deformations
      geometry.computeBoundingBox();
      const bbox = geometry.boundingBox as THREE.Box3;
      const height = bbox.max.y - bbox.min.y;

      const positionAttribute = mesh.geometry.getAttribute('position');
      const vertex = new THREE.Vector3();
      for (let i = 0; i < positionAttribute.count; i++) {
        vertex.fromBufferAttribute(positionAttribute, i);
        
        const normalizedY = height > 0 ? (vertex.y - bbox.min.y) / height : 0;

        // Taper
        const taperAmount = 1.0 - (normalizedY * taper);
        vertex.x *= taperAmount;
        vertex.z *= taperAmount;

        // Noise
        if (noise > 0) {
          const noiseAngle = vertex.y * 2.0;
          const noiseAmount = Math.sin(noiseAngle) * noise * 0.2;
          vertex.x += noiseAmount;
          vertex.z += noiseAmount;
        }

        // Twist
        const twistAngle = vertex.y * (twist * Math.PI / 180);
        const sin = Math.sin(twistAngle);
        const cos = Math.cos(twistAngle);
        const x = vertex.x * cos - vertex.z * sin;
        const z = vertex.x * sin + vertex.z * cos;
        vertex.x = x;
        vertex.z = z;

        positionAttribute.setXYZ(i, vertex.x, vertex.y, vertex.z);
      }
      positionAttribute.needsUpdate = true;
      mesh.geometry.computeVertexNormals();
    };

    let geometry: THREE.BufferGeometry | undefined;

    switch (shape) {
      case "cube":
        geometry = new RoundedBoxGeometry(2.2, 2.2, 2.2, 6, roundness * 10);
        break;
      case "sphere":
        geometry = new THREE.SphereGeometry(1.5, 32, 16);
        break;
      case "cylinder":
        geometry = new THREE.CylinderGeometry(0.8, 0.8, 2, 64);
        break;
      case "donut":
        geometry = new THREE.TorusGeometry(1, donutTube, 64, 100);
        break;
      case "cone":
        geometry = new THREE.ConeGeometry(1, 2, 64);
        break;
      case "torusKnot":
        geometry = new THREE.TorusKnotGeometry(0.8, 0.25, 100, 16, knotP, knotQ);
        break;
      case "icosahedron":
        geometry = new THREE.IcosahedronGeometry(1.2, 0);
        break;
      case "dodecahedron":
        geometry = new THREE.DodecahedronGeometry(1.2, 0);
        break;
      case "vase": {
        const points: THREE.Vector2[] = [];
        for (let i = 0; i < 10; i++) {
          points.push(new THREE.Vector2(Math.sin(i * 0.2) * 1.5 + 0.5, (i - 5) * 0.4));
        }
        geometry = new THREE.LatheGeometry(points);
        break;
      }
      case "capsule":
        geometry = new THREE.CapsuleGeometry(1, 1, 4, 8);
        break;
      case "octahedron":
        geometry = new THREE.OctahedronGeometry(1.5);
        break;
      case "tetrahedron":
        geometry = new THREE.TetrahedronGeometry(1.5);
        break;
      default:
        geometry = new RoundedBoxGeometry(2.2, 2.2, 2.2, 6, roundness * 10);
    }

    if (geometry) {
      createMesh(geometry);
    }

    if (wireframeOverlay) {
        const wireframeMaterial = new THREE.MeshBasicMaterial({
            color: 0x000000,
            wireframe: true,
            transparent: true,
            opacity: 0.5,
        });
        const wireframeMesh = new THREE.Mesh(geometry, wireframeMaterial);
        scene.add(wireframeMesh);
    }

    // --- Camera ---
    camera.position.set(0, 1, 5);
    camera.lookAt(0, 0, 0);

    renderer.render(scene, camera);
  }, [shape, twist, roundness, taper, noise, rotationX, rotationY, rotationZ, mainColor, shadowTint, lightColor, lightX, lightY, lightZ, shadowIntensity, ambientIntensity, materialType, donutTube, knotP, knotQ, isTransparent, backgroundColor, backgroundOpacity, wireframeOverlay]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'Enter':
          addToCanva();
          break;
        case 'r':
        case 'R':
          handleReset();
          break;
        case 'h':
        case 'H':
          setShowHelp(prev => !prev);
          break;
        case 'c':
        case 'C':
          setShape(prev => shapes[(shapes.indexOf(prev) + 1) % shapes.length]);
          break;
        case 'm':
        case 'M':
          setMaterialType(prev => materials[(materials.indexOf(prev) + 1) % materials.length]);
          break;
        case 'ArrowUp':
          setRotationX(prev => (prev + 5) % 360);
          break;
        case 'ArrowDown':
          setRotationX(prev => (prev - 5 + 360) % 360);
          break;
        case 'ArrowLeft':
          setRotationY(prev => (prev - 5 + 360) % 360);
          break;
        case 'ArrowRight':
          setRotationY(prev => (prev + 5) % 360);
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [shapes, materials]);

  const addToCanva = () => {
    const renderer = rendererRef.current;
    const scene = sceneRef.current;
    const camera = cameraRef.current;
    const mount = mountRef.current;

    if (!renderer || !scene || !camera || !mount) return;

    const canvas = renderer.domElement;

    // Temporarily resize for export
    const originalSize = new THREE.Vector2();
    renderer.getSize(originalSize);
    const originalStyle = { width: canvas.style.width, height: canvas.style.height };
    
    renderer.setSize(exportSize, exportSize);
    canvas.style.width = `${exportSize}px`;
    canvas.style.height = `${exportSize}px`;
    renderer.render(scene, camera);

    const dataUrl = renderer.domElement.toDataURL("image/png");

    // Restore original size for preview
    renderer.setSize(originalSize.x, originalSize.y);
    canvas.style.width = originalStyle.width;
    canvas.style.height = originalStyle.height;
    renderer.render(scene, camera);

    addElementAtPoint({
      type: "image",
      dataUrl,
      width: 328,
      height: 328,
      top: 100,
      left: 100,
      altText: { text: "", decorative: true },
    });
  };

  const handleReset = () => {
    setShape(defaultState.shape);
    setTwist(defaultState.twist);
    setRoundness(defaultState.roundness);
    setTaper(defaultState.taper);
    setNoise(defaultState.noise);
    setRotationX(defaultState.rotationX);
    setRotationY(defaultState.rotationY);
    setRotationZ(defaultState.rotationZ);
    setMainColor(defaultState.mainColor);
    setShadowTint(defaultState.shadowTint);
    setLightColor(defaultState.lightColor);
    setLightX(defaultState.lightX);
    setLightY(defaultState.lightY);
    setLightZ(defaultState.lightZ);
    setShadowIntensity(defaultState.shadowIntensity);
    setAmbientIntensity(defaultState.ambientIntensity);
    setMaterialType(defaultState.materialType);
    setDonutTube(defaultState.donutTube);
    setKnotP(defaultState.knotP);
    setKnotQ(defaultState.knotQ);
    setIsTransparent(defaultState.isTransparent);
    setBackgroundColor(defaultState.backgroundColor);
    setBackgroundOpacity(defaultState.backgroundOpacity);
    setWireframeOverlay(defaultState.wireframeOverlay);
  };

  if (showHelp) {
    return <HelpPage onBack={() => setShowHelp(false)} />;
  }

  return (
    <div className="container" style={{ padding: '16px' }}>
      <Rows spacing="1u">
        <Box>
          <div ref={mountRef} className="renderPreview" />
        </Box>
        
        <Columns spacing="1u">
            <Column>
                <Button variant="primary" onClick={addToCanva} stretch>
                    {intl.formatMessage({ defaultMessage: "Add to Canva", description: "Button to add the 3D element to the Canva design" })}
                </Button>
            </Column>
            <Column>
                <Button variant="secondary" onClick={handleReset} stretch>
                    {intl.formatMessage({ defaultMessage: "Reset", description: "Button to reset all settings" })}
                </Button>
            </Column>
        </Columns>

        <Accordion>
          <AccordionItem title={intl.formatMessage({ defaultMessage: "Object", description: "Title for the Object settings section"})} defaultExpanded>
            <Rows spacing="1.5u">
              <Rows spacing="0.5u">
                <Text size="small" tone="tertiary">{intl.formatMessage({ defaultMessage: "Shape", description: "Label for the shape selection dropdown" })}</Text>
                <Select
                  value={shape}
                  options={[
                    { value: "cube", label: intl.formatMessage({ defaultMessage: "Cube", description: "Cube shape option" }) },
                    { value: "sphere", label: intl.formatMessage({ defaultMessage: "Sphere", description: "Sphere shape option" }) },
                    { value: "cylinder", label: intl.formatMessage({ defaultMessage: "Cylinder", description: "Cylinder shape option" }) },
                    { value: "donut", label: intl.formatMessage({ defaultMessage: "Donut", description: "Donut shape option" }) },
                    { value: "cone", label: intl.formatMessage({ defaultMessage: "Cone", description: "Cone shape option" }) },
                    { value: "torusKnot", label: intl.formatMessage({ defaultMessage: "Knot", description: "Torus Knot shape option" }) },
                    { value: "icosahedron", label: intl.formatMessage({ defaultMessage: "Icosahedron", description: "Icosahedron shape option" }) },
                    { value: "dodecahedron", label: intl.formatMessage({ defaultMessage: "Dodecahedron", description: "Dodecahedron shape option" }) },
                    { value: "vase", label: intl.formatMessage({ defaultMessage: "Vase", description: "Vase shape option" }) },
                    { value: "capsule", label: intl.formatMessage({ defaultMessage: "Capsule", description: "Capsule shape option" }) },
                    { value: "octahedron", label: intl.formatMessage({ defaultMessage: "Octahedron", description: "Octahedron shape option" }) },
                    { value: "tetrahedron", label: intl.formatMessage({ defaultMessage: "Tetrahedron", description: "Tetrahedron shape option" }) },
                  ]}
                  onChange={(value) => setShape(value as Shape)}
                />
              </Rows>
              <Rows spacing="0.5u">
                <Text size="small" tone="tertiary">{intl.formatMessage({ defaultMessage: "Material", description: "Label for the material selection dropdown" })}</Text>
                <Select
                  value={materialType}
                  options={[
                    { value: "matte", label: intl.formatMessage({ defaultMessage: "Matte", description: "Matte material option" }) },
                    { value: "plastic", label: intl.formatMessage({ defaultMessage: "Plastic", description: "Plastic material option" }) },
                    { value: "metal", label: intl.formatMessage({ defaultMessage: "Metal", description: "Metal material option" }) },
                    { value: "glass", label: intl.formatMessage({ defaultMessage: "Glass", description: "Glass material option" }) },
                    { value: "porcelain", label: intl.formatMessage({ defaultMessage: "Porcelain", description: "Porcelain material option" }) },
                    { value: "velvet", label: intl.formatMessage({ defaultMessage: "Velvet", description: "Velvet material option" }) },
                    { value: "toon", label: intl.formatMessage({ defaultMessage: "Toon", description: "Toon material option" }) },
                    { value: "lambert", label: intl.formatMessage({ defaultMessage: "Lambert", description: "Lambert material option" }) },
                    { value: "normal", label: intl.formatMessage({ defaultMessage: "Normal", description: "Normal material option" }) },
                    { value: "wireframe", label: intl.formatMessage({ defaultMessage: "Wireframe", description: "Wireframe material option" }) },
                  ]}
                  onChange={(value) => setMaterialType(value as MaterialType)}
                />
              </Rows>
               <Checkbox
                label={intl.formatMessage({ defaultMessage: "Wireframe Overlay", description: "Checkbox to toggle wireframe overlay" })}
                checked={wireframeOverlay}
                onChange={(_, checked) => setWireframeOverlay(checked)}
              />
            </Rows>
          </AccordionItem>

          <AccordionItem title={intl.formatMessage({ defaultMessage: "Rotation", description: "Title for the Rotation settings section"})}>
            <Rows spacing="1.5u">
              <Box>
                <Text size="xsmall">{intl.formatMessage({ defaultMessage: "X-Axis Rotation: {rotationX}°", description: "Label for the X-axis rotation slider" }, { rotationX })}</Text>
                <Slider
                  value={rotationX}
                  min={0}
                  max={360}
                  onChange={setRotationX}
                />
              </Box>
              <Box>
                <Text size="xsmall">{intl.formatMessage({ defaultMessage: "Y-Axis Rotation: {rotationY}°", description: "Label for the Y-axis rotation slider" }, { rotationY })}</Text>
                <Slider
                  value={rotationY}
                  min={0}
                  max={360}
                  onChange={setRotationY}
                />
              </Box>
              <Box>
                <Text size="xsmall">{intl.formatMessage({ defaultMessage: "Z-Axis Rotation: {rotationZ}°", description: "Label for the Z-axis rotation slider" }, { rotationZ })}</Text>
                <Slider
                  value={rotationZ}
                  min={0}
                  max={360}
                  onChange={setRotationZ}
                />
              </Box>
            </Rows>
          </AccordionItem>

          <AccordionItem title={intl.formatMessage({ defaultMessage: "Deformations", description: "Title for the Deformations settings section"})}>
            <Rows spacing="1.5u">
              <Box>
                <Text size="xsmall">{intl.formatMessage({ defaultMessage: "Twist: {twist}°", description: "Label for the twist slider" }, { twist })}</Text>
                <Slider
                  value={twist}
                  min={-180}
                  max={180}
                  onChange={setTwist}
                />
              </Box>
              <Box>
                <Text size="xsmall">{intl.formatMessage({ defaultMessage: "Taper: {taper}", description: "Label for the taper slider" }, { taper: taper.toFixed(2) })}</Text>
                <Slider
                  value={taper}
                  min={-1}
                  max={1}
                  step={0.05}
                  onChange={setTaper}
                />
              </Box>
              <Box>
                <Text size="xsmall">{intl.formatMessage({ defaultMessage: "Noise: {noise}", description: "Label for the noise slider" }, { noise: noise.toFixed(2) })}</Text>
                <Slider
                  value={noise}
                  min={0}
                  max={1}
                  step={0.05}
                  onChange={setNoise}
                />
              </Box>
              {shape === 'cube' && (
                <Box>
                  <Text size="xsmall">{intl.formatMessage({ defaultMessage: "Roundness: {roundness}", description: "Label for the roundness slider" }, { roundness: roundness.toFixed(2) })}</Text>
                  <Slider
                    value={roundness}
                    min={0}
                    max={1}
                    step={0.05}
                    onChange={setRoundness}
                  />
                </Box>
              )}
              {shape === 'donut' && (
                <Box>
                  <Text size="xsmall">{intl.formatMessage({ defaultMessage: "Ring Thickness: {donutTube}", description: "Label for the donut tube slider" }, { donutTube: donutTube.toFixed(2) })}</Text>
                  <Slider
                    value={donutTube}
                    min={0.1}
                    max={0.8}
                    step={0.05}
                    onChange={setDonutTube}
                  />
                </Box>
              )}
              {shape === 'torusKnot' && (
                <>
                  <Box>
                    <Text size="xsmall">{intl.formatMessage({ defaultMessage: "P-value: {knotP}", description: "Label for the knot P value slider" }, { knotP })}</Text>
                    <Slider
                      value={knotP}
                      min={1}
                      max={10}
                      step={1}
                      onChange={setKnotP}
                    />
                  </Box>
                  <Box>
                    <Text size="xsmall">{intl.formatMessage({ defaultMessage: "Q-value: {knotQ}", description: "Label for the knot Q value slider" }, { knotQ })}</Text>
                    <Slider
                      value={knotQ}
                      min={1}
                      max={10}
                      step={1}
                      onChange={setKnotQ}
                    />
                  </Box>
                </>
              )}
            </Rows>
          </AccordionItem>

          <AccordionItem title={intl.formatMessage({ defaultMessage: "Lighting & Colors", description: "Title for the Lighting & Colors settings section"})}>
            <Rows spacing="1.5u">
              <Columns spacing="1u" align="center">
                <Column>
                    <Rows spacing="0.5u">
                        <Text size="xsmall">{intl.formatMessage({ defaultMessage: "Main Color", description: "Label for the main color selector" })}</Text>
                        <ColorSelector
                            color={mainColor}
                            onChange={setMainColor}
                        />
                    </Rows>
                </Column>
                <Column>
                    <Rows spacing="0.5u">
                        <Text size="xsmall">{intl.formatMessage({ defaultMessage: "Shadow Tint", description: "Label for the shadow tint color selector" })}</Text>
                        <ColorSelector
                            color={shadowTint}
                            onChange={setShadowTint}
                        />
                    </Rows>
                </Column>
                <Column>
                    <Rows spacing="0.5u">
                        <Text size="xsmall">{intl.formatMessage({ defaultMessage: "Light Color", description: "Label for the light color selector" })}</Text>
                        <ColorSelector
                            color={lightColor}
                            onChange={setLightColor}
                        />
                    </Rows>
                </Column>
              </Columns>
              <Box>
                <Text size="xsmall">{intl.formatMessage({ defaultMessage: "Shadow Intensity: {shadowIntensity}", description: "Label for the shadow intensity slider" }, { shadowIntensity: shadowIntensity.toFixed(2) })}</Text>
                <Slider
                  value={shadowIntensity}
                  min={0}
                  max={2}
                  step={0.1}
                  onChange={setShadowIntensity}
                />
              </Box>
              <Box>
                <Text size="xsmall">{intl.formatMessage({ defaultMessage: "Ambient Intensity: {ambientIntensity}", description: "Label for the ambient intensity slider" }, { ambientIntensity: ambientIntensity.toFixed(2) })}</Text>
                <Slider
                  value={ambientIntensity}
                  min={0}
                  max={2}
                  step={0.1}
                  onChange={setAmbientIntensity}
                />
              </Box>
              <Box>
                <Text size="small" tone="tertiary">{intl.formatMessage({ defaultMessage: "Light Position", description: "Label for the light position sliders" })}</Text>
                <Rows spacing="1u">
                   <Box>
                    <Text size="xsmall">{intl.formatMessage({ defaultMessage: "X: {lightX}", description: "Label for the light X position slider" }, { lightX: lightX.toFixed(1) })}</Text>
                    <Slider
                      value={lightX}
                      min={-20}
                      max={20}
                      step={0.5}
                      onChange={setLightX}
                    />
                  </Box>
                  <Box>
                    <Text size="xsmall">{intl.formatMessage({ defaultMessage: "Y: {lightY}", description: "Label for the light Y position slider" }, { lightY: lightY.toFixed(1) })}</Text>
                    <Slider
                      value={lightY}
                      min={-20}
                      max={20}
                      step={0.5}
                      onChange={setLightY}
                    />
                  </Box>
                  <Box>
                    <Text size="xsmall">{intl.formatMessage({ defaultMessage: "Z: {lightZ}", description: "Label for the light Z position slider" }, { lightZ: lightZ.toFixed(1) })}</Text>
                    <Slider
                      value={lightZ}
                      min={-20}
                      max={20}
                      step={0.5}
                      onChange={setLightZ}
                    />
                  </Box>
                </Rows>
              </Box>
              <Checkbox
                label={intl.formatMessage({ defaultMessage: "Transparent Background", description: "Checkbox to toggle transparent background" })}
                checked={isTransparent}
                onChange={(_, checked) => setIsTransparent(checked)}
              />
              {!isTransparent && (
                <Rows spacing="1u">
                    <Rows spacing="0.5u">
                        <Text size="xsmall">{intl.formatMessage({ defaultMessage: "Background Color", description: "Label for the background color selector" })}</Text>
                        <ColorSelector
                            color={backgroundColor}
                            onChange={setBackgroundColor}
                        />
                    </Rows>
                     <Box>
                        <Text size="xsmall">{intl.formatMessage({ defaultMessage: "Opacity: {opacity}%", description: "Label for background opacity slider" }, { opacity: Math.round(backgroundOpacity * 100) })}</Text>
                        <Slider
                            value={backgroundOpacity}
                            min={0}
                            max={1}
                            step={0.01}
                            onChange={setBackgroundOpacity}
                        />
                    </Box>
                </Rows>
              )}
            </Rows>
          </AccordionItem>

           <AccordionItem title={intl.formatMessage({ defaultMessage: "Export Settings", description: "Title for the Export Settings section"})}>
            <Rows spacing="1.5u">
              <Text size="small" tone="tertiary">{intl.formatMessage({ defaultMessage: "Export Size", description: "Label for the export size selection dropdown" })}</Text>
              <Select
                value={exportSize}
                options={[
                  { value: 512, label: "512px" },
                  { value: 1024, label: "1024px" },
                  { value: 2048, label: "2048px" },
                  { value: 4096, label: "4096px" },
                ]}
                onChange={(value) => setExportSize(value as number)}
              />
            </Rows>
          </AccordionItem>
        </Accordion>

        <Button variant="secondary" onClick={() => setShowHelp(true)} icon={InfoIcon} stretch>
            {intl.formatMessage({ defaultMessage: "Help & Shortcuts", description: "Button to open help page" })}
        </Button>

      </Rows>
    </div>
  );
};

export default App;
