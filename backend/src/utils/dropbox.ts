import { Dropbox } from 'dropbox';

export class DropboxService {
  private dbx: Dropbox;

  constructor(accessToken: string) {
    this.dbx = new Dropbox({ 
      accessToken,
      fetch: fetch
    });
  }

  async uploadFolder(files: File[], folderName: string): Promise<string> {
    try {
      const folderPath = `/${folderName}`;
      
      // Create folder
      await this.dbx.filesCreateFolderV2({
        path: folderPath,
        autorename: true
      });

      // Upload files
      const uploadPromises = files.map(async (file) => {
        const arrayBuffer = await file.arrayBuffer();
        const contents = new Uint8Array(arrayBuffer);
        
        return this.dbx.filesUpload({
          path: `${folderPath}/${file.name}`,
          contents,
          mode: 'add',
          autorename: true
        });
      });

      await Promise.all(uploadPromises);

      // Create shared link
      const sharedLinkResponse = await this.dbx.sharingCreateSharedLinkWithSettings({
        path: folderPath,
        settings: {
          requested_visibility: 'public'
        }
      });

      return sharedLinkResponse.result.url;
    } catch (error) {
      console.error('Dropbox upload error:', error);
      throw new Error('Failed to upload folder to Dropbox');
    }
  }

  async createSharedLink(path: string): Promise<string> {
    try {
      const response = await this.dbx.sharingCreateSharedLinkWithSettings({
        path,
        settings: {
          requested_visibility: 'public'
        }
      });
      
      return response.result.url;
    } catch (error) {
      console.error('Error creating shared link:', error);
      throw error;
    }
  }
}