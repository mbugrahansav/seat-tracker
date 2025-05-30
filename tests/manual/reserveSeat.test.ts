import { reserveSeat } from '../../src/services/puppeteerService';
import { Cinsiyet, KoltukTipi } from '../../src/constants/enum';

const testReserveSeat = async () => {
  const seferBilgi = {
    kalkisYeri: 'ESKİŞEHİR, ESKİŞEHİR',
    varisYeri: 'ANKARA GAR, ANKARA',
    gidisTarihi: '2025-05-28',
    seferOncelik: 1
  };

  const guncelSefer = {
    kalkisSaati: '18:19',
    varisSaati: '19:43',
    business: '(3)',
    ekonomi: '(10)'
  };

  const kullaniciBilgi = {
    cinsiyet: Cinsiyet.Erkek,
    koltukOncelik: KoltukTipi.Ekonomi
  };

  try {
    await reserveSeat(seferBilgi, guncelSefer, kullaniciBilgi);
    console.log("Test başarılı: Koltuk rezervasyon fonksiyonu çalıştı.");
  } catch (error) {
    console.error("Test başarısız:", error);
  }
};

testReserveSeat();
