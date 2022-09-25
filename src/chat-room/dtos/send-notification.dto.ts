export class NoticationDTO {
  userId: number;
  type: string;
  data: {
    [key: string]: string;
  };
  apns?: any;
  android?: any;
  webpush?: any;
  fcmOptions?: any;
  notification: any;
}
