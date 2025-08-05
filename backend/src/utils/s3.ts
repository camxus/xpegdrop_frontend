import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';

export const saveItemImage = async (
  s3Client: S3Client,
  imageUrl: string,
  folder: string
): Promise<{ key: string; url: string }> => {
  try {
    // This is a simplified version - in reality you'd fetch the image and upload it
    const key = `${folder}/${uuidv4()}.jpg`;
    
    // For now, return the original URL - implement actual S3 upload as needed
    return {
      key,
      url: imageUrl
    };
  } catch (error) {
    console.error('Error saving image to S3:', error);
    throw error;
  }
};

export const getSignedImage = async (
  s3Client: S3Client,
  key: string
): Promise<string> => {
  try {
    const command = new GetObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: key,
    });

    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    return signedUrl;
  } catch (error) {
    console.error('Error getting signed URL:', error);
    throw error;
  }
};