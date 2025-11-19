import React, { useState, useRef, useEffect } from "react";
import * as THREE from "three";
import { RoundedBoxGeometry } from 'three-stdlib';
import { Rows, Text, Select, Button, ColorSelector, Box, Slider, Columns, Column, Accordion, AccordionItem, Checkbox } from "@canva/app-ui-kit";
import { addElementAtPoint } from "@canva/design";
import { useIntl } from "react-intl";
import "styles/components.css";
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import venice_sunset from 'assets/hdr/venice_sunset_1k.hdr';

type Shape = "cube" | "sphere" | "cylinder" | "donut" | "cone" | "torusKnot" | "icosahedron" | "dodecahedron" | "vase";
type MaterialType = "matte" | "metal" | "glass" | "velvet" | "toon" | "wireframe" | "plastic" | "porcelain" | "normal" | "lambert";

const defaultState = {
  shape: "cube" as Shape,
  twist: 0,
  roundness: 0.1,
  taper: 0,
  noise: 0,
  angle: "isometric-left",
  mainColor: "#4A90E2",
  shadowTint: "#1E3A5F",
  lightColor: "#FFFFFF",
  shadowIntensity: 0.8,
  ambientIntensity: 0.5,
  materialType: "matte" as MaterialType,
  donutTube: 0.4,
  knotP: 2,
  knotQ: 3,
  isTransparent: true,
  backgroundColor: "#FFFFFF",
  wireframeOverlay: false,
};

const App = () => {
  const intl = useIntl();
  const [shape, setShape] = useState<Shape>(defaultState.shape);
  const [twist, setTwist] = useState(defaultState.twist);
  const [roundness, setRoundness] = useState(defaultState.roundness);
  const [taper, setTaper] = useState(defaultState.taper);
  const [noise, setNoise] = useState(defaultState.noise);
  const [angle, setAngle] = useState(defaultState.angle);
  const [mainColor, setMainColor] = useState(defaultState.mainColor);
  const [shadowTint, setShadowTint] = useState(defaultState.shadowTint);
  const [lightColor, setLightColor] = useState(defaultState.lightColor);
  const [shadowIntensity, setShadowIntensity] = useState(defaultState.shadowIntensity);
  const [ambientIntensity, setAmbientIntensity] = useState(defaultState.ambientIntensity);
  const [materialType, setMaterialType] = useState<MaterialType>(defaultState.materialType);
  const [donutTube, setDonutTube] = useState(defaultState.donutTube);
  const [knotP, setKnotP] = useState(defaultState.knotP);
  const [knotQ, setKnotQ] = useState(defaultState.knotQ);
  const [isTransparent, setIsTransparent] = useState(defaultState.isTransparent);
  const [backgroundColor, setBackgroundColor] = useState(defaultState.backgroundColor);
  const [wireframeOverlay, setWireframeOverlay] = useState(defaultState.wireframeOverlay);

  const mountRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);

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
      const object = scene.children[0];
      if (object instanceof THREE.Mesh) {
        object.geometry.dispose();
        if (Array.isArray(object.material)) {
          object.material.forEach(material => material.dispose());
        } else {
          object.material.dispose();
        }
      }
      scene.remove(object);
    }
    
    if (isTransparent) {
        renderer.setClearAlpha(0);
    } else {
        renderer.setClearColor(backgroundColor);
        renderer.setClearAlpha(1);
    }

    // --- Lights ---
    const ambientLight = new THREE.AmbientLight(lightColor, ambientIntensity);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(new THREE.Color(lightColor), shadowIntensity);
    directionalLight.position.set(5, 10, 7.5);
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
    switch (angle) {
      case "isometric-left":
        camera.position.set(-3, 2, 3);
        break;
      case "isometric-right":
        camera.position.set(3, 2, 3);
        break;
      case "front":
        camera.position.set(0, 0, 4);
        break;
      case "top":
        camera.position.set(0, 4, 0.01); // a little bit off to avoid gimbal lock
        break;
      case "side":
        camera.position.set(4, 0, 0);
        break;
      default:
        camera.position.set(-3, 2, 3);
    }
    camera.lookAt(0, 0, 0);

    renderer.render(scene, camera);
  }, [shape, twist, roundness, taper, noise, angle, mainColor, shadowTint, lightColor, shadowIntensity, ambientIntensity, materialType, donutTube, knotP, knotQ, isTransparent, backgroundColor, wireframeOverlay]);

  const addToCanva = () => {
    const renderer = rendererRef.current;
    if (!renderer) return;

    // Force a render to ensure the canvas is up-to-date
    if (sceneRef.current && cameraRef.current) {
      renderer.render(sceneRef.current, cameraRef.current);
    }

    const canvas = renderer.domElement;
    const dataUrl = canvas.toDataURL("image/png");

    addElementAtPoint({
      type: "image",
      dataUrl,
      width: 1312,
      height: 1312,
      top: 0,
      left: 0,
      altText: { text: "", decorative: true },
    });
  };

  const handleReset = () => {
    setShape(defaultState.shape);
    setTwist(defaultState.twist);
    setRoundness(defaultState.roundness);
    setTaper(defaultState.taper);
    setNoise(defaultState.noise);
    setAngle(defaultState.angle);
    setMainColor(defaultState.mainColor);
    setShadowTint(defaultState.shadowTint);
    setLightColor(defaultState.lightColor);
    setShadowIntensity(defaultState.shadowIntensity);
    setAmbientIntensity(defaultState.ambientIntensity);
    setMaterialType(defaultState.materialType);
    setDonutTube(defaultState.donutTube);
    setKnotP(defaultState.knotP);
    setKnotQ(defaultState.knotQ);
    setIsTransparent(defaultState.isTransparent);
    setBackgroundColor(defaultState.backgroundColor);
    setWireframeOverlay(defaultState.wireframeOverlay);
  };

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

        <Accordion defaultExpanded>
          <AccordionItem title={intl.formatMessage({ defaultMessage: "Object", description: "Title for the Object settings section"})}>
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
              <Checkbox
                label={intl.formatMessage({ defaultMessage: "Transparent Background", description: "Checkbox to toggle transparent background" })}
                checked={isTransparent}
                onChange={(_, checked) => setIsTransparent(checked)}
              />
              {!isTransparent && (
                <Rows spacing="0.5u">
                    <Text size="xsmall">{intl.formatMessage({ defaultMessage: "Background Color", description: "Label for the background color selector" })}</Text>
                    <ColorSelector
                        color={backgroundColor}
                        onChange={setBackgroundColor}
                    />
                </Rows>
              )}
            </Rows>
          </AccordionItem>

          <AccordionItem title={intl.formatMessage({ defaultMessage: "Camera", description: "Title for the Camera settings section"})}>
            <Rows spacing="1.5u">
              <Text size="small" tone="tertiary">{intl.formatMessage({ defaultMessage: "Camera Angle", description: "Label for the camera angle selection dropdown" })}</Text>
              <Select
                value={angle}
                options={[
                  { value: "isometric-left", label: intl.formatMessage({ defaultMessage: "Isometric Left", description: "Isometric Left camera angle" }) },
                  { value: "isometric-right", label: intl.formatMessage({ defaultMessage: "Isometric Right", description: "Isometric Right camera angle" }) },
                  { value: "front", label: intl.formatMessage({ defaultMessage: "Front", description: "Front camera angle" }) },
                  { value: "top", label: intl.formatMessage({ defaultMessage: "Top", description: "Top camera angle" }) },
                  { value: "side", label: intl.formatMessage({ defaultMessage: "Side", description: "Side camera angle" }) },
                ]}
                onChange={setAngle}
              />
            </Rows>
          </AccordionItem>
        </Accordion>

      </Rows>
    </div>
  );
};

export default App;
