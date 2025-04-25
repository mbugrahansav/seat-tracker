import { Request, Response } from 'express';
import { karsilastir } from '../services/seferService';
import { seferleriGetir } from '../services/puppeteerService';
import { SeferBilgi } from '../models/seferBilgi';
import { SeferListe } from '../models/seferListe';
import { Sefer } from '../models/seferListe';
import { KullaniciBilgi } from '../models/kullaniciBilgi';

export async function handleSeferleriGetir (req: Request, res: Response) {
  const seferBilgi = new SeferBilgi(req.body);

  try {
    const seferListe: SeferListe = await seferleriGetir(seferBilgi);
    
    res.status(200).json({
      message: 'Sefer listesi başarıyla getirildi',
      seferListe
    });
  } catch (error: any) {
    console.error('Puppeteer çalışırken hata oluştu:', error);
    res.status(500).json({
      message: 'Puppeteer servisi çalışırken hata oluştu',
      error: error.message
    });
  }
};

export async function handleSeferTakibi (req: Request, res: Response): Promise<any> {
  if (!Array.isArray(req.body.seferliste)) {
    return res.status(400).json({ message: 'Geçersiz format: seferliste dizisi bekleniyor.' });
  }

  const kullaniciBilgi = new KullaniciBilgi(req.body.kullaniciBilgi);
  const seferBilgi = new SeferBilgi(req.body.seferBilgi);
  const hedefSeferListe = new SeferListe(req.body.seferliste);

  res.status(200).json({
    message: 'Sefer takibi başlatıldı. Güncellemeler yapılacak...',
  });

  startMonitoring(seferBilgi, kullaniciBilgi, hedefSeferListe);
};


const startMonitoring = (seferBilgi: SeferBilgi, kullaniciBilgi: KullaniciBilgi, hedefSeferListe: SeferListe) => {
  setInterval(async () => {
    try {
      const guncelSeferListe = await seferleriGetir(seferBilgi);
      console.log('Yeni Liste:', guncelSeferListe);

      karsilastir(seferBilgi, guncelSeferListe, kullaniciBilgi, hedefSeferListe);

    } catch (error) {
      console.error('Takip sırasında hata:', error);
    }
  }, 10000);
};