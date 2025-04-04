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
    // First try the public directory where we downloaded the models
    const publicModelsPath = path.join(process.cwd(), 'public', 'models');
    
    // Check if models exist in public folder
    if (fs.existsSync(publicModelsPath) && 
        fs.existsSync(path.join(publicModelsPath, 'ssd_mobilenetv1_model-weights_manifest.json'))) {
      
      // Load models from public directory
      await Promise.all([
        faceapi.nets.ssdMobilenetv1.loadFromDisk(publicModelsPath),
        faceapi.nets.faceLandmark68Net.loadFromDisk(publicModelsPath),
        faceapi.nets.faceRecognitionNet.loadFromDisk(publicModelsPath)
      ]);
      
      modelsLoaded = true;
      log('Face-api models loaded successfully from public directory', 'face-api');
      return;
    }
    
    // Try dist directory as fallback
    const distModelsPath = path.join(process.cwd(), 'dist', 'models');
    
    // Create models directory if it doesn't exist
    if (!fs.existsSync(distModelsPath)) {
      fs.mkdirSync(distModelsPath, { recursive: true });
    }
    
    // Load models
    await Promise.all([
      faceapi.nets.ssdMobilenetv1.loadFromDisk(distModelsPath),
      faceapi.nets.faceLandmark68Net.loadFromDisk(distModelsPath),
      faceapi.nets.faceRecognitionNet.loadFromDisk(distModelsPath)
    ]);
    
    modelsLoaded = true;
    log('Face-api models loaded successfully from dist directory', 'face-api');
  } catch (error) {
    log(`Error loading face-api models locally: ${error}`, 'face-api');
    
    // Attempt to load from CDN as a last resort
    try {
      const cdnUrl = 'https://justadudewhohacks.github.io/face-api.js/weights';
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
}

// Extract face descriptors from an image
export async function extractFaceDescriptors(imageBuffer: Buffer): Promise<Float32Array[] | null> {
  try {
    await initFaceApi();
    
    const img = await faceapi.bufferToImage(imageBuffer);
    const detections = await faceapi.detectAllFaces(img)
      .withFaceLandmarks()
      .withFaceDescriptors();
    
    if (detections.length === 0) {
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
