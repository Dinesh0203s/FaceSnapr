import * as faceapi from 'face-api.js';

let modelsLoaded = false;

// Initialize face-api.js models
export async function initFaceApi() {
  if (modelsLoaded) return;
  
  try {
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

// Detect faces in an image element
export async function detectFaces(imgElement: HTMLImageElement) {
  await initFaceApi();
  
  return faceapi.detectAllFaces(imgElement)
    .withFaceLandmarks()
    .withFaceDescriptors();
}

// Process image file for face detection
export async function processFaceImage(file: File): Promise<{ success: boolean, message?: string, faceDescriptors?: Float32Array[] }> {
  try {
    await initFaceApi();
    
    // Create an image element from the file
    const img = await createImageFromFile(file);
    
    // Detect faces
    const detections = await faceapi.detectAllFaces(img)
      .withFaceLandmarks()
      .withFaceDescriptors();
    
    if (detections.length === 0) {
      return { 
        success: false, 
        message: 'No faces detected in the image. Please upload a clear photo of your face.' 
      };
    }
    
    return {
      success: true,
      faceDescriptors: detections.map(d => d.descriptor)
    };
  } catch (error) {
    console.error('Error processing face image:', error);
    return {
      success: false,
      message: 'Failed to process the image. Please try again with a different photo.'
    };
  }
}

// Helper function to create an image element from a file
function createImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    
    img.onerror = (err) => {
      URL.revokeObjectURL(url);
      reject(err);
    };
    
    img.src = url;
  });
}

// Draw face detections on a canvas
export function drawFaceDetections(canvas: HTMLCanvasElement, imgElement: HTMLImageElement, detections: faceapi.WithFaceDescriptor<faceapi.WithFaceLandmarks<faceapi.DetectionWithLandmarks>> | faceapi.WithFaceDescriptor<faceapi.WithFaceLandmarks<faceapi.DetectionWithLandmarks>>[]) {
  // Resize canvas to match image dimensions
  const displaySize = { width: imgElement.width, height: imgElement.height };
  faceapi.matchDimensions(canvas, displaySize);
  
  // Draw detections
  const resizedDetections = Array.isArray(detections) 
    ? detections.map(d => faceapi.resizeResults(d, displaySize)) 
    : [faceapi.resizeResults(detections, displaySize)];
  
  // Clear previous drawings
  const ctx = canvas.getContext('2d');
  if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Draw each detection
  faceapi.draw.drawDetections(canvas, resizedDetections);
  faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
}
