import React, { useState, useRef, useEffect } from "react";
import * as THREE from "three";
import { SVGRenderer } from "three/examples/jsm/renderers/SVGRenderer.js";
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';


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
  const svgOutputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    // --- Scene Setup ---
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);

    const container = mountRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

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
    mountRef.current.innerHTML = '';
    mountRef.current.appendChild(renderer.domElement);

  }, [shape, twist, roundness, fatten, angle, mainColor, shadowTint, shadowIntensity, preset]);

  const exportToSvg = () => {
    if (mountRef.current && svgOutputRef.current) {
      const svgElement = mountRef.current.querySelector('svg');
      if (svgElement) {
        const svgString = new XMLSerializer().serializeToString(svgElement);
        
        // Display the SVG code in the text area
        const formattedSvg = svgString.replace(/></g, '>\n<');
        svgOutputRef.current.textContent = formattedSvg;

        // In a real Canva app, you would use:
        // canva.addPage({
        //   type: 'SVG',
        //   data: svgString,
        // });
        
        console.log("Exporting SVG:", svgString);
        alert("SVG exported and displayed below!");
      }
    }
  };

  return (
    <div className="container">
      <div className="panel">
        <h2>Panel A: Choose a 3D Style</h2>
        <select value={preset} onChange={(e) => setPreset(e.target.value as Preset)}>
          <option value="isometric">Isometric 3D Icon</option>
          <option value="clay">Clay 3D Object</option>
          <option value="extrude">Minimal Extruded Object</option>
          <option value="low-poly">Low Poly Object</option>
          <option value="organic">Round/Organic Object</option>
          <option value="emoji">3D Emoji Style</option>
        </select>
      </div>

      <div className="panel">
        <h2>Panel B: Build Your Object</h2>
        
        <div>
          <strong>1. Main Shape</strong>
          <select value={shape} onChange={(e) => setShape(e.target.value as Shape)}>
            <option value="cube">Cube</option>
            <option value="sphere">Sphere</option>
            <option value="cylinder">Cylinder</option>
            <option value="donut">Donut</option>
            <option value="cone">Cone</option>
          </select>
        </div>

        <div>
          <strong>2. Deformations</strong>
          <label>Twist: {twist}°</label>
          <input type="range" min="0" max="40" value={twist} onChange={(e) => setTwist(Number(e.target.value))} />
          
          <label>Roundness: {roundness}</label>
          <input type="range" min="0" max="1" step="0.01" value={roundness} onChange={(e) => setRoundness(Number(e.target.value))} />

          <label>Fatten: {fatten}</label>
          <input type="range" min="0.8" max="1.2" step="0.01" value={fatten} onChange={(e) => setFatten(Number(e.target.value))} />
        </div>

        <div>
            <strong>3. Angle</strong>
            <select value={angle} onChange={(e) => setAngle(e.target.value)}>
                <option value="isometric-left">Isometric Left</option>
                <option value="isometric-right">Isometric Right</option>
                <option value="top-down">Slightly Top-Down</option>
            </select>
        </div>

        <div>
          <strong>4. Colors</strong>
          <label>Main Color</label>
          <input type="color" value={mainColor} onChange={(e) => setMainColor(e.target.value)} />

          <label>Shadow Tint</label>
          <input type="color" value={shadowTint} onChange={(e) => setShadowTint(e.target.value)} />

          <label>Shadow Intensity</label>
          <input type="range" min="0" max="1" step="0.01" value={shadowIntensity} onChange={(e) => setShadowIntensity(Number(e.target.value))} />
        </div>
      </div>

      <div className="panel">
        <h2>Panel C: Export</h2>
        <div ref={mountRef} className="render-preview"></div>
        <button onClick={exportToSvg}>Add to Canva</button>
        <div className="svg-output-container">
          <h3>Generated SVG Code:</h3>
          <textarea ref={svgOutputRef} readOnly rows={10}></textarea>
        </div>
      </div>
    </div>
  );
};

export default App;
