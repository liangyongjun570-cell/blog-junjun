// 🛡️ 本文件由 XingHuiSama 控制台自动生成，请勿手动修改
export interface Photo { url: string; caption?: string; }
export interface Album { id: string; title: string; description: string; cover: string; date: string; photos: Photo[]; }

export const albums: Album[] = [
  {
    "title": "猫",
    "description": "猫",
    "id": "album_1791784233797",
    "photos": [
      {
        "url": "/images/231965-20261012-135049.jpg"
      },
      {
        "url": "/images/246821-20261012-135049.jpg"
      },
      {
        "url": "/images/688439-20261012-135049.jpg"
      }
    ],
    "date": "2026-10-12"
  },
  {
    "title": "11",
    "description": "22",
    "id": "album_1791780175233",
    "photos": [
      {
        "url": "/images/1372162-20261012-125953.jpeg"
      },
      {
        "url": "/images/_20261012111632_172_152-20261012-124314.jpg"
      }
    ],
    "date": "2026-10-12"
  }
];