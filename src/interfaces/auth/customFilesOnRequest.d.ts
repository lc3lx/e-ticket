import { File } from 'multer';

declare global {
  namespace Express {
    interface Request {
      files?: {
        mainPhoto?: File[];
        eventPhotos?: File[];
        miniPoster?: File[];
      };
      file?: {
        profilePicture?: File;
      };
    }
  }
}
