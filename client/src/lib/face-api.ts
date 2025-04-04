import * as faceapi from 'face-api.js';

// Track whether models have been loaded
let modelsLoaded = false;

// Load face-api.js models
export async function initFaceApi() {
  if (modelsLoaded) return;
  
  try {
    // Load models from public directory
    await Promise.all([
      faceapi.nets.ssdMobilenetv1.loadFromUri('/models'),
      faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
      faceapi.nets.faceRecognitionNet.loadFromUri('/models')
    ]);
    
    modelsLoaded = true;
    console.log('Face-api models loaded successfully');
  } catch (error) {
    console.error('Error loading face-api models:', error);
    throw new Error('Failed to load face recognition models');
  }
}

// Detect faces in an image
export async function detectFaces(imgElement: HTMLImageElement) {
  await initFaceApi();
  
  try {
    // Detect faces with landmarks and descriptor
    const detections = await faceapi
      .detectAllFaces(imgElement)
      .withFaceLandmarks()
      .withFaceDescriptors();
    
    return detections;
  } catch (error) {
    console.error('Error detecting faces:', error);
    throw new Error('Face detection failed');
  }
}

// Process an image for face recognition and return face descriptors
export async function processFaceImage(file: File): Promise<{ success: boolean, message?: string, faceDescriptors?: Float32Array[] }> {
  try {
    await initFaceApi();
    
    // Create img element from file
    const img = await createImageFromFile(file);
    
    // Detect faces
    const detections = await faceapi
      .detectAllFaces(img)
      .withFaceLandmarks()
      .withFaceDescriptors();
    
    // If no faces detected
    if (detections.length === 0) {
      return { 
        success: false, 
        message: "No faces detected in the image. Please try a different photo." 
      };
    }
    
    // If too many faces detected
    if (detections.length > 1) {
      return { 
        success: false, 
        message: "Multiple faces detected. Please use a photo with only your face." 
      };
    }
    
    // Extract face descriptors (features that identify the face)
    const faceDescriptors = detections.map(d => d.descriptor);
    
    return {
      success: true,
      faceDescriptors
    };
  } catch (error) {
    console.error('Error processing face image:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Face processing failed'
    };
  }
}

// Helper function to create an image element from a file
function createImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(img);
    };
    
    img.onerror = (error) => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load image'));
    };
    
    img.src = objectUrl;
  });
}

// Draw face detection results on canvas
export function drawFaceDetections(
  canvas: HTMLCanvasElement, 
  imgElement: HTMLImageElement, 
  detections: faceapi.WithFaceDescriptor<faceapi.WithFaceLandmarks<faceapi.DetectionWithLandmarks>> | faceapi.WithFaceDescriptor<faceapi.WithFaceLandmarks<faceapi.DetectionWithLandmarks>>[]
) {
  // Resize canvas to match image
  canvas.width = imgElement.width;
  canvas.height = imgElement.height;
  
  // Clear canvas
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
  
  // Draw image
  faceapi.draw.drawImage(canvas, imgElement);
  
  // Draw face detections
  if (Array.isArray(detections)) {
    faceapi.draw.drawDetections(canvas, detections);
    faceapi.draw.drawFaceLandmarks(canvas, detections);
  } else {
    faceapi.draw.drawDetections(canvas, [detections]);
    faceapi.draw.drawFaceLandmarks(canvas, [detections]);
  }
}