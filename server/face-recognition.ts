import * as faceapi from 'face-api.js';
import { Canvas, Image } from 'canvas';
import path from 'path';
import fs from 'fs';
import { log } from './vite';

// Register the Canvas and Image with face-api
faceapi.env.monkeyPatch({ Canvas, Image } as any);

// Define the threshold for face matching
const FACE_MATCH_THRESHOLD = 0.6;

// Initialize face-api models
let modelsLoaded = false;

export async function initFaceApi() {
  if (modelsLoaded) return;
  
  try {
    // Log current working directory to help with debugging
    const cwd = process.cwd();
    log(`Current working directory: ${cwd}`, 'face-api');
    
    // First try the public directory where we downloaded the models
    const publicModelsPath = path.join(cwd, 'public', 'models');
    log(`Looking for models in: ${publicModelsPath}`, 'face-api');
    
    // List files in the directory to verify
    if (fs.existsSync(publicModelsPath)) {
      const files = fs.readdirSync(publicModelsPath);
      log(`Found files in models directory: ${files.join(', ')}`, 'face-api');
    }
    
    // Check if models exist in public folder
    if (fs.existsSync(publicModelsPath) && 
        fs.existsSync(path.join(publicModelsPath, 'ssd_mobilenetv1_model-weights_manifest.json'))) {
      
      log('Found model files in public directory, loading...', 'face-api');
      
      // Load models from public directory
      await Promise.all([
        faceapi.nets.ssdMobilenetv1.loadFromDisk(publicModelsPath),
        faceapi.nets.faceLandmark68Net.loadFromDisk(publicModelsPath),
        faceapi.nets.faceRecognitionNet.loadFromDisk(publicModelsPath)
      ]);
      
      modelsLoaded = true;
      log('Face-api models loaded successfully from public directory', 'face-api');
      return;
    } else {
      log('Models not found in public directory, trying alternatives', 'face-api');
    }
    
    // Try loading from absolute public URL path as a fallback
    try {
      const publicUrlPath = '/models';
      log(`Trying to load models from URL path: ${publicUrlPath}`, 'face-api');
      
      await Promise.all([
        faceapi.nets.ssdMobilenetv1.loadFromUri(publicUrlPath),
        faceapi.nets.faceLandmark68Net.loadFromUri(publicUrlPath),
        faceapi.nets.faceRecognitionNet.loadFromUri(publicUrlPath)
      ]);
      
      modelsLoaded = true;
      log('Face-api models loaded successfully from public URL path', 'face-api');
      return;
    } catch (urlError) {
      log(`Error loading models from public URL path: ${urlError}`, 'face-api');
    }
    
    // Try dist directory as another fallback
    const distModelsPath = path.join(cwd, 'dist', 'models');
    log(`Trying to load models from dist path: ${distModelsPath}`, 'face-api');
    
    // Create models directory if it doesn't exist
    if (!fs.existsSync(distModelsPath)) {
      fs.mkdirSync(distModelsPath, { recursive: true });
      log(`Created models directory at: ${distModelsPath}`, 'face-api');
    }
    
    // Copy models to dist if they're in public but not in dist
    if (fs.existsSync(publicModelsPath) && 
        fs.readdirSync(publicModelsPath).length > 0) {
      log('Copying models from public to dist directory', 'face-api');
      for (const file of fs.readdirSync(publicModelsPath)) {
        const srcPath = path.join(publicModelsPath, file);
        const destPath = path.join(distModelsPath, file);
        fs.copyFileSync(srcPath, destPath);
      }
      log('Models copied to dist directory', 'face-api');
    }
    
    // Try to load models from dist
    if (fs.existsSync(path.join(distModelsPath, 'ssd_mobilenetv1_model-weights_manifest.json'))) {
      log('Found model files in dist directory, loading...', 'face-api');
      
      // Load models
      await Promise.all([
        faceapi.nets.ssdMobilenetv1.loadFromDisk(distModelsPath),
        faceapi.nets.faceLandmark68Net.loadFromDisk(distModelsPath),
        faceapi.nets.faceRecognitionNet.loadFromDisk(distModelsPath)
      ]);
      
      modelsLoaded = true;
      log('Face-api models loaded successfully from dist directory', 'face-api');
      return;
    }
  } catch (error) {
    log(`Error loading face-api models locally: ${error}`, 'face-api');
  }
  
  // Attempt to load from CDN as a last resort
  try {
    const cdnUrl = 'https://justadudewhohacks.github.io/face-api.js/weights';
    log(`Trying to load models from CDN: ${cdnUrl}`, 'face-api');
    
    await Promise.all([
      faceapi.nets.ssdMobilenetv1.loadFromUri(cdnUrl),
      faceapi.nets.faceLandmark68Net.loadFromUri(cdnUrl),
      faceapi.nets.faceRecognitionNet.loadFromUri(cdnUrl)
    ]);
    
    modelsLoaded = true;
    log('Face-api models loaded from CDN', 'face-api');
  } catch (cdnError) {
    log(`Error loading face-api models from CDN: ${cdnError}`, 'face-api');
    throw new Error('Failed to load face recognition models');
  }
}

// Extract face descriptors from an image
export async function extractFaceDescriptors(imageBuffer: Buffer): Promise<Float32Array[] | null> {
  try {
    await initFaceApi();
    
    const img = await faceapi.bufferToImage(imageBuffer);
    console.log('Image loaded for processing');
    
    // Try both detectors
    let detections = await faceapi.detectAllFaces(img, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptors();
      
    if (detections.length === 0) {
      // Fallback to SSD MobileNet if TinyFaceDetector fails
      detections = await faceapi.detectAllFaces(img, new faceapi.SsdMobilenetv1Options())
        .withFaceLandmarks()
        .withFaceDescriptors();
    }
    
    console.log(`Detected ${detections.length} faces`);
    
    if (detections.length === 0) {
      console.log('No faces detected in image');
      return null;
    }
    
    return detections.map(d => d.descriptor);
  } catch (error) {
    log(`Error extracting face descriptors: ${error}`, 'face-api');
    return null;
  }
}

// Match face descriptors
export function matchFaceDescriptors(
  sourceFace: Float32Array,
  targetFaces: Float32Array[]
): boolean {
  try {
    const labeledDescriptors = [
      new faceapi.LabeledFaceDescriptors('person', [sourceFace])
    ];
    
    const faceMatcher = new faceapi.FaceMatcher(labeledDescriptors, FACE_MATCH_THRESHOLD);
    
    for (const targetFace of targetFaces) {
      const match = faceMatcher.findBestMatch(targetFace);
      if (match.label !== 'unknown') {
        return true;
      }
    }
    
    return false;
  } catch (error) {
    log(`Error matching face descriptors: ${error}`, 'face-api');
    return false;
  }
}

// Find photos with matching faces
export function findMatchingPhotos(
  sourceFaceDescriptor: Float32Array,
  photoDescriptors: { photoId: number, descriptors: Float32Array[] }[]
): number[] {
  const matchingPhotoIds: number[] = [];
  
  for (const { photoId, descriptors } of photoDescriptors) {
    if (descriptors.some(descriptor => {
      const distance = faceapi.euclideanDistance(sourceFaceDescriptor, descriptor);
      return distance < FACE_MATCH_THRESHOLD;
    })) {
      matchingPhotoIds.push(photoId);
    }
  }
  
  return matchingPhotoIds;
}
