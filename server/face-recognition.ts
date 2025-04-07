import vision from '@google-cloud/vision';

// Create a client
const client = new vision.ImageAnnotatorClient();

// Define the threshold for face matching (adjusted for confidence score)
const FACE_MATCH_THRESHOLD = 0.8;

export async function extractFaceDescriptors(imageBuffer: Buffer): Promise<any> {
  try {
    // Perform face detection
    const [result] = await client.faceDetection({
      image: {
        content: imageBuffer.toString('base64')
      }
    });

    const faces = result.faceAnnotations;

    if (!faces || faces.length === 0) {
      console.log('No faces detected in image');
      return null;
    }

    // Return face detection data
    return faces;
  } catch (error) {
    console.error('Error extracting face data:', error);
    return null;
  }
}


export function findMatchingPhotos(
  sourceFace: any,
  photoDescriptors: { photoId: number, descriptors: any[] }[]
): number[] {
  const matchingPhotoIds: number[] = [];

  // Compare confidence levels and features
  for (const { photoId, descriptors } of photoDescriptors) {
    const matches = descriptors.some(face => 
      face.detectionConfidence > FACE_MATCH_THRESHOLD && 
      Math.abs(face.rollAngle - sourceFace.rollAngle) < 20 &&
      Math.abs(face.panAngle - sourceFace.panAngle) < 20
    );

    if (matches) {
      matchingPhotoIds.push(photoId);
    }
  }

  return matchingPhotoIds;
}