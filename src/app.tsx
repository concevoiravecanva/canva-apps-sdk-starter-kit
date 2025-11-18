import React, { useState, useRef, useEffect } from "react";
import * as THREE from "three";
import { SVGRenderer } from "three/examples/jsm/renderers/SVGRenderer.js";
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { Rows, Text, Select, Button, ColorSelector, Box, Slider } from "@canva/app-ui-kit";
import { addElementAtPoint } from "@canva/design";
import "styles/components.css";

type Preset =
  | "isometric"
  | "clay"
  | "extrude"
  | "low-poly"
  | "organic"
  | "emoji";

type Shape = "cube" | "sphere" | "cylinder" | "donut" | "cone" | "text" | "svg";

const App = () => {
  const [preset, setPreset] = useState<Preset>("isometric");
  const [shape, setShape] = useState<Shape>("cube");
  const [twist, setTwist] = useState(0);
  const [roundness, setRoundness] = useState(0);
  const [fatten, setFatten] = useState(1);
  const [angle, setAngle] = useState("isometric-left");
  const [mainColor, setMainColor] = useState("#ff8a80");
  const [shadowTint, setShadowTint] = useState("#444444");
  const [shadowIntensity, setShadowIntensity] = useState(0.5);

  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    // --- Scene Setup ---
    const scene = new THREE.Scene();
    // Remove background for transparency
    scene.background = null;

    const width = 328;
    const height = 328;

    // --- Camera Setup ---
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    switch (angle) {
      case "isometric-left":
        camera.position.set(-5, 5, 5);
        break;
      case "isometric-right":
        camera.position.set(5, 5, 5);
        break;
      case "top-down":
        camera.position.set(0, 7, 2);
        break;
      default:
        camera.position.set(-5, 5, 5);
    }
    camera.lookAt(scene.position);

    // --- Lighting ---
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, shadowIntensity);
    directionalLight.position.set(5, 10, 7.5);
    scene.add(directionalLight);


    // --- Geometry ---
    let geometry: THREE.BufferGeometry;
    switch (shape) {
      case "cube":
        geometry = new RoundedBoxGeometry(1.5, 1.5, 1.5, 6, roundness * 10);
        break;
      case "sphere":
        geometry = new THREE.SphereGeometry(1, 32, 16);
        break;
      case "cylinder":
        geometry = new THREE.CylinderGeometry(1, 1, 2, 32);
        break;
      case "donut":
        geometry = new THREE.TorusGeometry(1, 0.4, 16, 100);
        break;
      case "cone":
        geometry = new THREE.ConeGeometry(1, 2, 32);
        break;
      default:
        geometry = new RoundedBoxGeometry(1.5, 1.5, 1.5, 6, roundness * 10);
    }

    // --- Material & Mesh ---
    const material = new THREE.MeshStandardMaterial({
        color: new THREE.Color(mainColor),
        roughness: 0.5,
        metalness: 0.1,
        emissive: new THREE.Color(shadowTint).multiplyScalar(0.2)
    });
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    // --- Deformations ---
    const positionAttribute = mesh.geometry.getAttribute('position');
    const vertex = new THREE.Vector3();
    for (let i = 0; i < positionAttribute.count; i++) {
        vertex.fromBufferAttribute(positionAttribute, i);
        
        // Twist
        const twistAngle = vertex.y * (twist * Math.PI / 180);
        const sin = Math.sin(twistAngle);
        const cos = Math.cos(twistAngle);
        const x = vertex.x * cos - vertex.z * sin;
        const z = vertex.x * sin + vertex.z * cos;
        vertex.x = x;
        vertex.z = z;

        // Fatten
        vertex.multiplyScalar(fatten);

        positionAttribute.setXYZ(i, vertex.x, vertex.y, vertex.z);
    }
    positionAttribute.needsUpdate = true;
    mesh.geometry.computeVertexNormals(); // Important for lighting after deformation

    // --- SVG Renderer ---
    const renderer = new SVGRenderer();
    renderer.setSize(width, height);
    renderer.setQuality('high');
    renderer.render(scene, camera);
    
    // Clear previous render and append new one
    if (mountRef.current) {
        mountRef.current.innerHTML = '';
        mountRef.current.appendChild(renderer.domElement);
    }

  }, [shape, twist, roundness, fatten, angle, mainColor, shadowTint, shadowIntensity, preset]);

  const exportToSvg = async () => {
    if (mountRef.current) {
      const svgElement = mountRef.current.querySelector('svg');
      if (svgElement) {
        // Get the SVG string
        const svgString = new XMLSerializer().serializeToString(svgElement);
        
        // Create an image from the SVG
        const img = new Image();
        const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);
        
        img.onload = async () => {
          // Create a canvas and draw the image on it
          const canvas = document.createElement('canvas');
          canvas.width = 328;
          canvas.height = 328;
          const ctx = canvas.getContext('2d');
          
          if (ctx) {
            // Draw the SVG image (no background for transparency)
            ctx.drawImage(img, 0, 0, 328, 328);
            
            // Convert canvas to PNG data URL
            const pngDataUrl = canvas.toDataURL('image/png');
            
            // Add the PNG image to Canva
            await addElementAtPoint({
              type: "image",
              dataUrl: pngDataUrl,
              altText: {
                text: "3D generated object",
              },
              top: 0,
              left: 0,
              width: 328,
              height: 328,
            });
          }
          
          // Clean up
          URL.revokeObjectURL(url);
        };
        
        img.src = url;
      }
    }
  };

  return (
    <div className="scrollContainer">
      <Rows spacing="2u">
        {/* Preview at the top */}
        <Box>
          <div ref={mountRef} className="renderPreview" />
        </Box>
        <Button variant="primary" onClick={exportToSvg} stretch>
          Add to Canva
        </Button>

        <Rows spacing="1.5u">
          <Text size="small" tone="tertiary">Style Preset</Text>
          <Select
            value={preset}
            options={[
              { value: "isometric", label: "Isometric 3D Icon" },
              { value: "clay", label: "Clay 3D Object" },
              { value: "extrude", label: "Minimal Extruded Object" },
              { value: "low-poly", label: "Low Poly Object" },
              { value: "organic", label: "Round/Organic Object" },
              { value: "emoji", label: "3D Emoji Style" },
            ]}
            onChange={(value) => setPreset(value as Preset)}
          />
        </Rows>

        <Rows spacing="1.5u">
          <Text size="small" tone="tertiary">Shape</Text>
          <Select
            value={shape}
            options={[
              { value: "cube", label: "Cube" },
              { value: "sphere", label: "Sphere" },
              { value: "cylinder", label: "Cylinder" },
              { value: "donut", label: "Donut" },
              { value: "cone", label: "Cone" },
            ]}
            onChange={(value) => setShape(value as Shape)}
          />
        </Rows>

        <Rows spacing="1u">
          <Text size="small" tone="tertiary">Deformations</Text>
          
          <Box>
            <Text size="xsmall">Twist: {twist}°</Text>
            <Slider
              min={0}
              max={40}
              step={1}
              value={twist}
              onChange={setTwist}
            />
          </Box>

          <Box>
            <Text size="xsmall">Roundness: {roundness.toFixed(2)}</Text>
            <Slider
              min={0}
              max={1}
              step={0.01}
              value={roundness}
              onChange={setRoundness}
            />
          </Box>

          <Box>
            <Text size="xsmall">Fatten: {fatten.toFixed(2)}</Text>
            <Slider
              min={0.8}
              max={1.2}
              step={0.01}
              value={fatten}
              onChange={setFatten}
            />
          </Box>
        </Rows>

        <Rows spacing="1.5u">
          <Text size="small" tone="tertiary">Camera Angle</Text>
          <Select
            value={angle}
            options={[
              { value: "isometric-left", label: "Isometric Left" },
              { value: "isometric-right", label: "Isometric Right" },
              { value: "top-down", label: "Slightly Top-Down" },
            ]}
            onChange={setAngle}
          />
        </Rows>

        <Rows spacing="1u">
          <Text size="small" tone="tertiary">Colors</Text>
          
          <Box>
            <Text size="xsmall">Main Color</Text>
            <ColorSelector
              color={mainColor}
              onChange={setMainColor}
            />
          </Box>

          <Box>
            <Text size="xsmall">Shadow Tint</Text>
            <ColorSelector
              color={shadowTint}
              onChange={setShadowTint}
            />
          </Box>

          <Box>
            <Text size="xsmall">Shadow Intensity: {shadowIntensity.toFixed(2)}</Text>
            <Slider
              min={0}
              max={1}
              step={0.01}
              value={shadowIntensity}
              onChange={setShadowIntensity}
            />
          </Box>
        </Rows>
      </Rows>
    </div>
  );
};

export default App;
